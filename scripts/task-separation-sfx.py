# 《课题分离》音效轨：纸张 / 木质 / 剪刀音色，由 src/compositions/TaskSeparation/timeline.json 驱动
# 用法：npm run sfx（需要 Python 3 + numpy、scipy、Pillow）
import json, sys, math
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

TL = json.load(open(sys.argv[1], encoding="utf-8"))
OUT, ENV_PNG = sys.argv[2], sys.argv[3]
import os
for _p in (OUT, ENV_PNG):
    os.makedirs(os.path.dirname(_p) or ".", exist_ok=True)
SR = 48000
ED = TL["edit"]; CUTS = ED["to"] - ED["newTo"]
DUR = TL["dur"] - CUTS            # 成片时长
PEAK_OLD = TL["peak"]
def toNew(o):  # 编排时间 → 成片时间（与 lib.ts 一致）
    if o < ED["from"]: return o
    if o < ED["to"]: return ED["from"] + (o - ED["from"]) * (ED["newTo"] - ED["from"]) / (ED["to"] - ED["from"])
    return o - CUTS
PEAK = toNew(PEAK_OLD)
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
CUE_LOG = []

# ---------- 与 lib.ts 一致的打字时间 ----------
BASE = 1 / 14
def pause_of(ch):
    return 0.12 if ch in "，、：；" else 0.25 if ch in "。？！—" else 0
def prepare(c):
    import re
    raw = []; bold = False
    for m in re.finditer(r"<b>|</b>|[\s\S]", c["text"]):
        tok = m.group(0)
        if tok == "<b>": bold = True
        elif tok == "</b>": bold = False
        else: raw.append((tok, bold))
    gaps = [0 if i == 0 else BASE + pause_of(raw[i - 1][0]) for i in range(len(raw))]
    total = sum(gaps) + BASE
    lim = 0.4 * (c["e"] - c["s"])
    k = lim / total if total > lim else 1
    acc = c["s"] + 0.05; cts = []
    for i in range(len(raw)):
        acc += gaps[i] * k
        cts.append(c["s"] if c.get("slam") else acc)
    kt = next((cts[i] for i, r in enumerate(raw) if r[1]), -1)
    c["_txt"] = "".join(r[0] for r in raw); c["_ct"] = cts
    return kt
HL_DELAY = 0.05
KT = {}
for c in TL["cues"]:
    c["kt"] = prepare(c)
    if c.get("link"): KT[c["link"]] = c["kt"] + HL_DELAY
def CT(sub):  # 与 lib.ts 的 ctOf 一致
    for c in TL["cues"]:
        i = c["_txt"].find(sub)
        if i >= 0: return c["_ct"][i] + HL_DELAY
    raise KeyError(sub)

# ---------- 工具 ----------
def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x)
def lp(x, f):
    return sosfilt(butter(2, f / (SR / 2), output="sos"), x)
def hp(x, f):
    return sosfilt(butter(2, f / (SR / 2), btype="high", output="sos"), x)
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
G = 0.6  # 峰值以外整体约 -4.4 dB
def place(sig, t, gain=1.0, pan=0.0, name=None, g=None):
    gain *= G if g is None else g
    t = toNew(t)   # 下面的编排都用编排时间
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    lg = math.cos((pan + 1) * math.pi / 4); rg = math.sin((pan + 1) * math.pi / 4)  # 等功率声像
    L[i:i + len(sig)] += sig * lg; R[i:i + len(sig)] += sig * rg
    if name: CUE_LOG.append((t, name, gain, pan))
def place_pan_sweep(sig, t, gain, p0, p1, name=None):
    gain *= G
    t = toNew(t)
    i = int(t * SR); sig = sig[: N - i] * gain
    p = np.linspace(p0, p1, len(sig))
    L[i:i + len(sig)] += sig * np.cos((p + 1) * np.pi / 4); R[i:i + len(sig)] += sig * np.sin((p + 1) * np.pi / 4)
    if name: CUE_LOG.append((t, name, gain, (p0, p1)))

def noise(d): return rng.standard_normal(int(d * SR))
def paper_tap(d=0.06):  # 纸片落定
    return bp(noise(d), 800, 5000) * env(int(d * SR), 0.001, 0.015)
def wood(freq=520, d=0.25):  # 木质敲击
    n = int(d * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.02)) * env(n, 0.001, d / 5)
    return s
def marimba(freq, d=0.6):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.03)) * env(n, 0.002, 0.18)
def bell(freq, d=2.0):
    n = int(d * SR); t = np.arange(n) / SR
    parts = [(1, 1, 0.9), (2.76, 0.5, 0.4), (5.4, 0.25, 0.2), (8.9, 0.12, 0.12)]
    return sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / dd) for r, a, dd in parts) * np.minimum(1, t / 0.003)
def whoosh(d=0.45, f0=600, f1=3000):  # 纸张翻动：分块变中心频率的带通噪声
    n = int(d * SR); x = noise(d); out = np.zeros(n); blk = 1024
    for k in range(0, n, blk):
        fr = k / n; fc = f0 + (f1 - f0) * fr
        seg = x[max(0, k - 2048): k + blk]
        y = bp(seg, fc * 0.6, fc * 1.6)
        out[k:k + blk] = y[-len(out[k:k + blk]):]
    w = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return out * w
def riffle(d=0.07):  # 翻一页
    return bp(noise(d), 1500, 7000) * env(int(d * SR), 0.004, 0.025)
def pencil(d=0.05):
    return bp(noise(d), 2500, 9000) * env(int(d * SR), 0.001, 0.01)
def snip():
    n = int(0.12 * SR); t = np.arange(n) / SR
    click = bp(noise(0.12), 3000, 12000) * (np.exp(-t / 0.004) + 0.7 * np.exp(-np.maximum(t - 0.045, 0) / 0.006) * (t > 0.045))
    ring = 0.3 * np.sin(2 * np.pi * 4200 * t) * np.exp(-t / 0.03)
    return click + ring
def impact():
    d = 1.6; n = int(d * SR); t = np.arange(n) / SR
    f = 60 + 60 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    thud = lp(noise(d), 400) * np.exp(-t / 0.08) * 0.8
    return body + thud
def chord(freqs, d=2.5, g=1):
    return sum(bell(f, d) for f in freqs) * g / len(freqs)

def reverb(x, d=1.8, mix=0.18):
    n = int(d * SR); t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t / (d / 6)); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    return x * (1 - mix) + fftconvolve(x, ir)[: len(x)] * mix * 3

# ---------- 编排 ----------
# 转场：轻翻纸
place(whoosh(0.5, 500, 2500), 79.75, 0.22, 0, "转场 80s")

# 钩子：时钟匀速滴答（每 15 分钟一下，右侧）
for k in range(13):
    place(wood(1400, 0.08), 4.3 + k * (2.7 / 12), 0.22, 0.65, "时钟滴答" if k == 0 else None)
place(marimba(659), KT["read"], 0.35, 0.4, "已读")
# 计数器每加一次，翻一页
cnt_times = [4.6 + k / 16 * (KT["count"] - 4.6) for k in range(17)]
for k, t in enumerate(cnt_times):
    place(riffle(), t, 0.4, 0.5, "翻看计数" if k == 0 else None)
place(paper_tap(0.08), 8.4, 0.5, -0.1, "念头气泡")

# 标题卡
place_pan_sweep(whoosh(0.6, 400, 2500), 10.3, 0.35, -0.8, 0, "纸条滑入")
place(wood(300, 0.3), 11.0, 0.45, -0.1)
place_pan_sweep(whoosh(0.6, 400, 2500), 11.0, 0.35, 0.8, 0)
place(wood(260, 0.3), 11.7, 0.45, 0.1, "标题落定")

# 关键词：轻铅笔点
for c in TL["cues"]:
    if c["kt"] >= 0 and not c.get("slam"):
        place(pencil(), c["kt"], 0.28, 0, None)
CUE_LOG.append((0, "关键词铅笔点 ×%d" % sum(1 for c in TL["cues"] if c["kt"] >= 0 and not c.get("slam")), 0.28, 0))

# 命名
place(wood(392, 0.4), KT["label"], 0.5, 0, "课题分离 贴上")
place(paper_tap(0.1), 22.9, 0.45, 0, "问句卡")
place(paper_tap(0.1), 27.4, 0.35, -0.3); place(paper_tap(0.1), 27.5, 0.35, 0.4)
place(marimba(440), KT["him"], 0.3, 0.5, "箭头→他")
place(paper_tap(0.1), KT["hw"], 0.4, -0.1, "作业本")
scrib = bp(noise(2.6), 2000, 8000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7 * np.arange(int(2.6 * SR)) / SR))) * 0.25
place(scrib * np.minimum(1, np.linspace(0, 6, len(scrib))) * np.minimum(1, np.linspace(6, 0, len(scrib))), KT["hw"], 0.25, -0.2, "写作业沙沙")

# 机制：左右分声道
place(marimba(523), KT["mine"], 0.4, -0.6, "你的课题 (左)")
place(marimba(392), KT["his"], 0.4, 0.6, "他的课题 (右)")
place(whoosh(0.5, 300, 1800), 43.1, 0.35, 0, "成绩单滑入")
place(impact()[: int(0.4 * SR)] * 0.6 + 0, KT["report"] + 0.2, 0.5, 0.3, "不及格 盖章")
creak = bp(noise(4.4), 120, 600) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * np.arange(int(4.4 * SR)) / SR))
creak *= np.minimum(1, np.linspace(0, 8, len(creak))) * np.minimum(1, np.linspace(8, 0, len(creak)))
place(creak, 47.6, 0.25, 0.1, "绳子绷紧")
place(impact()[: int(0.4 * SR)] * 0.6, KT["pull"] + 0.2, 0.5, 0.5, "控制不了 盖章")

# 代价：下行音
place(paper_tap(0.1), 52.3, 0.3, 0, "界线")
place_pan_sweep(whoosh(0.6, 2500, 600), KT["in"], 0.4, 0.7, -0.5, "闯进来 R→L")
for i, (t, f) in enumerate([(CT("“考公吧"), 494), (CT("“该结婚了"), 440), (CT("“听我的"), 392)]):
    place_pan_sweep(whoosh(0.45, 2000, 700), t, 0.25, 0.7, -0.6)
    place(marimba(f), t + 0.45, 0.4, -0.5, "气泡 %d" % (i + 1))
place_pan_sweep(whoosh(0.6, 600, 2500), KT["out"], 0.4, -0.5, 0.7, "闯过去 L→R")
for i, (f, sub) in enumerate([(370, "讨好"), (330, "操心"), (294, "替人")]):
    place(marimba(f), CT(sub) + 0.4, 0.4, 0.6, "越界标签 %d" % (i + 1))
rus = bp(noise(2.6), 300, 2000) * np.minimum(1, np.linspace(0, 3, int(2.6 * SR)))
place(rus, 64.6, 0.2, 0, "红线缠绕")

# 峰值：爬升截断 + 滴答随绳圈角速度加速
rd = PEAK_OLD - 67.0; n = int(rd * SR); tt = np.arange(n) / SR
riser = np.zeros(n); x = noise(rd); blk = 1024
for k in range(0, n, blk):
    fc = 300 + 3000 * (k / n) ** 2
    seg = x[max(0, k - 2048): k + blk]; y = bp(seg, fc * 0.7, fc * 1.4)
    riser[k:k + blk] = y[-len(riser[k:k + blk]):]
riser *= (tt / rd) ** 2
place(riser, 67.0, 0.55, 0, "爬升（峰值处截断）")
w0, w1 = 10, 120
def theta(T): return w0 * T + (w1 - w0) * T * T / (2 * rd)
T = 0.0; nxt = 90
while T < rd:
    if theta(T) >= nxt:
        place(wood(1600, 0.06), 67 + T, 0.18 + 0.12 * T / rd, 0)
        nxt += 90
    T += 1 / 1000
CUE_LOG.append((67.0, "绳圈滴答（θ 每 90° 一下，加速）", 0.2, 0))
place(snip(), PEAK_OLD - 0.06, 0.9, -0.1, "剪刀", g=1)
place(impact(), PEAK_OLD, 1.0, 0, "峰值冲击", g=1)
# 分拣：上行五声音阶，按左右分声道
scale = [523, 587, 659, 784, 880, 1047]
for i in range(6):
    side = -0.6 if i % 2 == 0 else 0.6
    place(marimba(scale[i], 0.5), 75.0 + i * 0.12 + 0.5, 0.3, side, "分拣" if i == 0 else None)
place(chord([523, 659, 784], 3, 1), KT["clear"], 0.35, 0, "清楚（大三和弦）")

# 出口：上行
place(marimba(523), KT["allin"], 0.35, -0.5, "全力以赴"); place(marimba(659), KT["allin"] + 0.12, 0.35, -0.5)
place(wood(700, 0.2), KT["support"] + 0.45, 0.4, 0, "放下水杯")
for i in range(6):
    place(wood(380 + 40 * (i % 2), 0.12), CT("马带到水边") + i * 0.24, 0.25, 0.6, "马蹄" if i == 0 else None)
drip = np.sin(2 * np.pi * (900 + 900 * np.exp(-np.arange(int(0.15 * SR)) / SR / 0.02)) * np.arange(int(0.15 * SR)) / SR) * env(int(0.15 * SR), 0.001, 0.03)
place(drip, 93.3, 0.4, 0.3, "喝水 水滴"); place(drip, 93.7, 0.3, 0.3)
glide_n = int(0.8 * SR); gt = np.arange(glide_n) / SR
glide = np.sin(2 * np.pi * np.cumsum(440 + 220 * gt / 0.8) / SR) * np.sin(np.pi * gt / 0.8) * 0.5
place_pan_sweep(glide, KT["choice"], 0.3, -0.5, 0.5, "选择权 滑向右")

# 结尾：放松
place(wood(220, 0.3), KT["phone"] + 0.45, 0.45, 0.3, "手机扣下")
sh = bp(noise(2.0), 4000, 10000) * np.sin(np.pi * np.linspace(0, 1, int(2 * SR)))
place(sh, 102.9, 0.12, 0.3, "断线飘落")
ex = bp(noise(1.6), 200, 1200) * np.sin(np.pi * np.linspace(0, 1, int(1.6 * SR))) ** 2
place(ex, KT["you"], 0.25, 0, "伸懒腰 呼气")
place(chord([392, 494, 587], 3.5), KT["you"] + 0.3, 0.3, 0, "大三和弦")

# 片尾
place(wood(262, 0.4), 112.6, 0.4, 0, "片名落定")
place(chord([262, 330, 392, 523], 5), 113.0, 0.3, 0, "片尾和弦")

# ---------- v3 新增：底噪、钟声、转场、细碎拟音 ----------
# 房间底噪：整片极低，夜晚场景（钩子、结尾）略高；峰值后 1.5s 静音
n = N; tt = np.arange(n) / SR
brown = np.cumsum(rng.standard_normal(n)); brown = hp(brown - brown.mean(), 40); brown = lp(brown, 320)
brown /= np.abs(brown).max()
lvl = np.full(n, 0.035)
for a0, a1, v in [(0, toNew(10), 0.06), (toNew(98), toNew(112), 0.06)]:
    m = (tt >= a0) & (tt < a1); lvl[m] = v
gap = (tt >= PEAK) & (tt < PEAK + 1.5); lvl[gap] = 0
lvl = np.convolve(lvl, np.ones(4800) / 4800, mode="same")
L += brown * lvl * G; R += brown * lvl * G
CUE_LOG.append((0, "房间底噪（夜晚段略高，峰值后静音）", 0.035, 0))
# 钟摆：钩子每秒一下，结尾放慢到 1.6 秒一下（首尾呼应）
for k in range(10):
    place(wood(1900, 0.05), 0.2 + k * 1.0, 0.12, 0.7, "钟摆 bed" if k == 0 else None)
for k in range(9):
    place(wood(1700, 0.05), 98.3 + k * 1.6, 0.1, 0.7, "钟摆 bed（慢）" if k == 0 else None)
# 发送消息
place(whoosh(0.3, 1500, 4000), 0.3, 0.3, 0.4, "消息发出")
place(marimba(784, 0.4), 0.62, 0.3, 0.4); place(marimba(1047, 0.4), 0.72, 0.3, 0.4)
# 镜头拉远
place(whoosh(1.0, 3000, 500), 5.2, 0.3, 0.2, "镜头拉远")
# 纸片转场：整张纸扫过 + 盖满时一声纸拍
for at, pan0, pan1 in [(10, 0.8, -0.8), (18, 0, 0), (34, -0.8, 0.8), (52, -0.6, 0.6), (98, 0.8, -0.8), (112, 0, 0)]:
    place_pan_sweep(whoosh(0.9, 500, 3500), at - 0.45 if at not in (10, 18) else at - 0.45, 0.4, pan0, pan1, f"纸片转场 {at}")
    place(paper_tap(0.12), at, 0.45, 0)
# 面板、红线、灯、姿态
place(paper_tap(0.1), 34.2, 0.35, -0.6, "两个面板落定"); place(paper_tap(0.1), 34.35, 0.35, 0.6)
for t0, pan in [(27.6, 0.2), (34.4, 0), (64.6, 0)]:
    place(bp(noise(0.8), 3000, 9000) * np.sin(np.pi * np.linspace(0, 1, int(0.8 * SR))), t0, 0.12, pan, "红线拉出" if t0 == 27.6 else None)
place(wood(2400, 0.04), 99.0, 0.25, -0.6, "台灯开关")
for t0, pan in [(KT["hw"], -0.3), (47.6, -0.4), (64.4, 0), (80.6, -0.5), (85.3, -0.2), (100.5, 0)]:
    place(bp(noise(0.35), 400, 2500) * np.sin(np.pi * np.linspace(0, 1, int(0.35 * SR))), t0, 0.18, pan, "姿态摩擦" if t0 == 47.6 else None)

# ---------- 主输出 ----------
mixd = np.stack([reverb(L), reverb(R)])
# 峰值后 1.2 秒持续声更稀：混响尾巴也在冲击之后
mixd = np.stack([hp(ch, 30) for ch in mixd])
mixd = np.tanh(mixd * 1.2) / 1.2
mixd *= 10 ** (-3 / 20) / np.abs(mixd).max()
fade = int(1.2 * SR); mixd[:, -fade:] *= np.linspace(1, 0, fade)
wavfile.write(OUT, SR, (mixd.T * 32767).astype(np.int16))

import io; sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
print("cue 表：")
for t, name, g, p in sorted(CUE_LOG):
    print(f"  {t:7.2f}s  {name:<22} gain={g:<5} pan={p}")

# 波形包络图（PIL）
from PIL import Image, ImageDraw
mono = np.abs(mixd).max(axis=0)
hop = SR // 50
envl = mono[: len(mono) // hop * hop].reshape(-1, hop).max(axis=1)
Wd, Hd, top = 1600, 300, 0.75
img = Image.new("RGB", (Wd, Hd), "white"); d = ImageDraw.Draw(img)
X = lambda t: int(t / DUR * (Wd - 1))
for i, v in enumerate(envl):
    x = X(i / 50); d.line([(x, Hd - 1), (x, Hd - 1 - int(min(v, top) / top * (Hd - 30)))], fill="#5f7896")
for name, (a, b) in TL["scenes"].items():
    a = toNew(a); d.line([(X(a), 0), (X(a), Hd)], fill="#999999"); d.text((X(a) + 3, 3), name, fill="black")
d.line([(X(PEAK), 0), (X(PEAK), Hd)], fill="#b8383a", width=2); d.text((X(PEAK) + 3, 16), "PEAK", fill="#b8383a")
img.save(ENV_PNG)

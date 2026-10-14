import timeline from "./timeline.json";

// 风格令牌：场景、封面都从这里取值，不在场景里写死颜色
export const STYLE = {
  bg: { paper: "#efe6d4", cool: "#e4e1da", warm: "#f3e4c8", edge: "#5a4330" },
  roles: {
    stuck: "#5f7896", // 困住 / 他的课题
    act: "#2f8a6e", // 出路 / 你的课题
    key: "#d0692a", // 强调
    worse: "#b8383a", // 恶化 / 红线
    ink: "#2b2420",
    dim: "#8a7f70",
  },
  card: "#fbf6ea",
  figure: { me: "#34302c", him: "#5f7896", look: "doll" as "silhouette" | "doll" | "pin" | "bean" },
  shadow: "#3d2b1c",
  font: {
    cjk: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
    serif: "'Noto Serif SC', 'SimSun', serif",
  },
} as const;

export type Role = keyof typeof STYLE.roles;

export const FPS = timeline.fps;
export const DUR = timeline.dur;
export const PEAK = timeline.peak;
export const SCENES = timeline.scenes as unknown as Record<string, [number, number]>;

// 剪辑：场景代码按"编排时间"写，成片里把标题卡 10–18s 压成 10–15s，之后整体前移
export const EDIT = timeline.edit;
const CUT = EDIT.to - EDIT.newTo;
export const DUR_OUT = DUR - CUT;
export const toOld = (t: number) =>
  t < EDIT.from ? t : t < EDIT.newTo ? EDIT.from + ((t - EDIT.from) * (EDIT.to - EDIT.from)) / (EDIT.newTo - EDIT.from) : t + CUT;
export const toNew = (o: number) =>
  o < EDIT.from ? o : o < EDIT.to ? EDIT.from + ((o - EDIT.from) * (EDIT.newTo - EDIT.from)) / (EDIT.to - EDIT.from) : o - CUT;

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const sm = (x: number) => x * x * (3 - 2 * x);
export const eo = (x: number) => 1 - Math.pow(1 - x, 3);
export const ei = (x: number) => x * x * x;
export const eio = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const win = (t: number, a: number, b: number, fi = 0.8, fo = 0.8) =>
  sm(prog(t, a, a + fi)) * (1 - sm(prog(t, b - fo, b)));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

// ---------- 字幕：逐字时间表 ----------
export type Cue = {
  s: number;
  e: number;
  text: string;
  link?: string;
  role?: Role;
  slam?: boolean;
};
export type CueChar = { ch: string; bold: boolean; ct: number };
export type PreparedCue = Cue & { chars: CueChar[]; kt: number; typedEnd: number };

const BASE = 1 / 14; // 约 14 字/秒
const pauseOf = (ch: string) =>
  "，、：；".includes(ch) ? 0.12 : "。？！—".includes(ch) ? 0.25 : 0;

export const prepareCue = (c: Cue): PreparedCue => {
  const raw: { ch: string; bold: boolean }[] = [];
  let bold = false;
  const re = /<b>|<\/b>|[\s\S]/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(c.text))) {
    if (m[0] === "<b>") bold = true;
    else if (m[0] === "</b>") bold = false;
    else raw.push({ ch: m[0], bold });
  }
  // 原始节奏：每字 BASE，标点后停顿
  const gaps = raw.map((r, i) => (i === 0 ? 0 : BASE + pauseOf(raw[i - 1].ch)));
  const total = gaps.reduce((a, b) => a + b, 0) + BASE;
  const limit = 0.4 * (c.e - c.s);
  const k = total > limit ? limit / total : 1;
  let acc = c.s + 0.05;
  const chars = raw.map((r, i) => {
    acc += gaps[i] * k;
    return { ...r, ct: c.slam ? c.s : acc };
  });
  const firstBold = chars.find((x) => x.bold);
  return {
    ...c,
    chars,
    kt: firstBold ? firstBold.ct : -1,
    typedEnd: chars.length ? chars[chars.length - 1].ct + 0.08 : c.s,
  };
};

export const CUES: PreparedCue[] = (timeline.cues as Cue[]).map(prepareCue);

// 关键词联动：字先出，画面后应。延迟 50ms，按 30fps 取整后误差 ≤ 83ms（< 100ms）
export const HL_DELAY = 0.05;
export const hl = (t: number, id: string) => {
  let v = 0;
  for (const c of CUES) {
    if (c.link === id && c.kt >= 0) {
      const a = c.kt + HL_DELAY;
      // 起势带 35% 底：关键词后的第一帧就明显可见（≤ 50ms + 1 帧 = 83ms）
      const rise = t >= a ? 0.35 + 0.65 * eo(prog(t, a, a + 0.15)) : 0;
      v = Math.max(v, rise * (1 - sm(prog(t, c.kt + 0.7, c.kt + 1.2))));
    }
  }
  return v;
};
// 画面反应时刻 = 关键词首字出现 + HL_DELAY
export const kt = (id: string) => (CUES.find((c) => c.link === id)?.kt ?? 0) + HL_DELAY;
// 句中某个短语首字出现 + HL_DELAY（给逐项出现的气泡、标签对齐用）
export const ctOf = (sub: string) => {
  for (const c of CUES) {
    const txt = c.chars.map((x) => x.ch).join("");
    const i = txt.indexOf(sub);
    if (i >= 0) return c.chars[i].ct + HL_DELAY;
  }
  throw new Error(`字幕里找不到：${sub}`);
};

// 全片张力：驱动暗角（注意力收窄），峰值后打开
export const tension = (t: number) => {
  if (t >= PEAK) return 0.25 * (1 - sm(prog(t, PEAK, PEAK + 2.5)));
  return (
    0.15 +
    0.15 * sm(prog(t, 0, 10)) -
    0.1 * sm(prog(t, 10, 18)) +
    0.1 * sm(prog(t, 43, 52)) +
    0.6 * sm(prog(t, 52, PEAK))
  );
};

// 确定性伪随机
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

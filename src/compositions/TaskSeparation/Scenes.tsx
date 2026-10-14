import React from "react";
import { PEAK, STYLE, clamp, ctOf, eo, hl, kt, mix, prog, rnd, sm, win } from "./lib";
import { Arrow, Card, Figure, POSES, Phone, Scissors, Txt, blendPose, hexMix } from "./paper";
import { HorseToy } from "./horses";

const R = STYLE.roles;

// 分段取值：pts = [[时刻, 值], ...]，相邻值之间平滑过渡
const steps = (t: number, pts: [number, number][], d = 0.35) => {
  let v = pts[0][1];
  for (let i = 1; i < pts.length; i++) v = mix(v, pts[i][1], sm(prog(t, pts[i][0], pts[i][0] + d)));
  return v;
};

const hhmm = (minutes: number) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const Clock: React.FC<{ x: number; y: number; minutes: number; warm?: number }> = ({ x, y, minutes, warm = 0 }) => {
  const [hh, mm] = hhmm(minutes).split(":");
  return (
    <Card x={x} y={y} w={170} h={74} fill={hexMix("#2f2b29", "#5a3f2a", warm)} rot={2}>
      <Txt x={0} y={2} size={40} weight={900} color="#f3e9d6" spacing={2}>
        {hh}:{mm}
      </Txt>
    </Card>
  );
};

const Desk: React.FC<{ lamp: number }> = ({ lamp }) => (
  <g>
    {/* 台灯光：lamp 0 冷 → 1 暖 */}
    <polygon points="390,150 250,440 560,440" fill={hexMix("#f7f3ea", "#ffd68a", lamp)} opacity={0.35 + 0.25 * lamp} />
    <g filter="url(#cut)">
      <rect x={300} y={430} width={680} height={22} rx={4} fill="#a8825c" />
      <rect x={330} y={452} width={20} height={110} fill="#8d6a48" />
      <rect x={930} y={452} width={20} height={110} fill="#8d6a48" />
      <rect x={384} y={150} width={10} height={280} fill="#4b4540" />
      <polygon points="350,120 430,120 446,160 334,160" fill={hexMix("#5f7896", "#d0692a", lamp)} />
    </g>
  </g>
);

// 桌子前挡板：画在人物之后，挡住桌后的下半身（人坐在桌后，不穿模）
const DeskFront: React.FC = () => (
  <g filter="url(#cut)">
    <rect x={300} y={432} width={680} height={20} rx={4} fill="#a8825c" />
    <rect x={318} y={452} width={644} height={120} fill="#96724e" />
    <line x1={330} y1={500} x2={950} y2={500} stroke="#7d5c3c" strokeWidth={3} opacity={0.6} />
  </g>
);

// ============ 钩子 0–10 ============
export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 0, 10.0, 0.2, 0.02); // 10s 处由纸片转场硬切
  if (op <= 0) return null;
  const minutes = 23 * 60 + 180 * prog(t, 4.3, 7.0); // 匀速：困住
  const sent = eo(prog(t, 0.35, 0.7));
  const wraps = sm(prog(t, 4.6, 5.0)) + sm(prog(t, kt("count"), kt("count") + 0.3));
  const readOn = sm(prog(t, kt("read"), kt("read") + 0.15));
  const N = t < 4.6 ? 0 : Math.min(17, 1 + Math.floor(16 * prog(t, 4.6, kt("count"))));
  const lines = Math.floor(N / 3);
  const thought = eo(prog(t, 8.4, 8.8));
  const hand: [number, number] = [560 + 56, 560 - 156];
  return (
    <g opacity={op}>
      <Desk lamp={0} />
      <Figure x={560} y={560} pose={POSES.slump} t={t} wraps={wraps} />
      <DeskFront />
      <Clock x={1090} y={110} minutes={minutes} />
      {/* 红线：手 → 手机 */}
      {N > 0 ? (
        <path
          d={`M${hand[0]},${hand[1]} C700,${470 + 8 * Math.sin(t * 1.3)} 760,${420 + 6 * Math.sin(t * 1.1 + 1)} 830,${330}`}
          fill="none"
          stroke={R.worse}
          strokeWidth={4}
          filter="url(#hs)"
        />
      ) : null}
      <Phone x={860} y={290} scale={0.95} rot={3} readOn={readOn} readGlow={hl(t, "read")} sent={sent} clock={hhmm(minutes)} />
      {Array.from({ length: lines }).map((_, i) => (
        <line
          key={i}
          x1={780}
          y1={318 + i * 22}
          x2={945}
          y2={330 + i * 22 + (i % 2) * 10}
          stroke={R.worse}
          strokeWidth={4}
          filter="url(#hs)"
        />
      ))}
      {N > 0 && t > 5.4 ? (
        <Card x={1080} y={430} w={190} h={70} rot={-3} glow={hl(t, "count")} opacity={sm(prog(t, 5.4, 5.8))}>
          <Txt x={0} y={2} size={30} weight={900}>
            翻了 <tspan fill={R.key}>{N}</tspan> 遍
          </Txt>
        </Card>
      ) : null}
      {thought > 0 ? (
        <g transform={`translate(610,190) scale(${thought})`}>
          <Card x={0} y={0} w={300} h={70} r={30}>
            <Txt x={0} y={2} size={28} weight={700}>
              我是不是说错话了？
            </Txt>
          </Card>
          <circle cx={50} cy={58} r={9} fill={STYLE.card} filter="url(#hs)" />
          <circle cx={66} cy={78} r={6} fill={STYLE.card} filter="url(#hs)" />
        </g>
      ) : null}
    </g>
  );
};

// ============ 提问 10–18 ============
export const TitleCard: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 10, 18, 0.02, 0.02);
  if (op <= 0) return null;
  const a = eo(prog(t, 10.3, 11.0));
  const b = eo(prog(t, 11.0, 11.7));
  const tag = sm(prog(t, 10.1, 10.7));
  return (
    <g opacity={op}>
      <path
        d={`M100,360 C380,${300 + 30 * Math.sin(t)} 860,${420 - 30 * Math.sin(t)} 1180,350`}
        fill="none"
        stroke={R.worse}
        strokeWidth={4}
        opacity={tag}
      />
      <Card x={mix(-500, 630, a)} y={300} w={780} h={116} rot={-1.5}>
        <Txt x={0} y={2} size={66} weight={900}>
          为什么<tspan fill={R.key}>别人的事</tspan>，
        </Txt>
      </Card>
      <Card x={mix(1800, 670, b)} y={440} w={560} h={116} rot={1.2}>
        <Txt x={0} y={2} size={66} weight={900}>
          总在消耗我？
        </Txt>
      </Card>
    </g>
  );
};

// ============ 命名 + 反直觉 18–34 ============
export const Naming: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 18, 34, 0.02, 0.02);
  if (op <= 0) return null;
  const lab = eo(prog(t, kt("label"), kt("label") + 0.35));
  const up = eio2(prog(t, 22.6, 23.3));
  const q = eo(prog(t, 22.9, 23.5));
  const qShrink = eio2(prog(t, 27.1, 27.7));
  const figs = eo(prog(t, 27.4, 28.0));
  const arrowK = eo(prog(t, kt("him"), kt("him") + 0.5));
  const hw = eo(prog(t, kt("hw"), kt("hw") + 0.35));
  const writing = sm(prog(t, kt("hw"), kt("hw") + 0.4));
  const pose = blendPose(POSES.upright, POSES.slump, writing);
  const scribble = writing * Math.sin(t * 14) * 6;
  pose.haR = [pose.haR[0] + scribble, pose.haR[1] + 6 * writing];
  return (
    <g opacity={op}>
      <g transform={`translate(640,${mix(270, 112, up)}) scale(${mix(1, 0.62, up) * (0.6 + 0.4 * lab)})`} opacity={lab}>
        <Card x={0} y={0} w={460} h={160} glow={hl(t, "label")}>
          <Txt x={0} y={-16} size={80} weight={900}>
            课题分离
          </Txt>
          <Txt x={0} y={50} size={22} weight={500} color={R.dim} spacing={2} opacity={1 - up}>
            Separation of Tasks · 阿德勒心理学
          </Txt>
        </Card>
      </g>
      {q > 0 ? (
        <g transform={`translate(640,${mix(330, 245, qShrink)}) scale(${mix(1, 0.84, qShrink)})`} opacity={q}>
          <Card x={0} y={(1 - q) * 30} w={700} h={104} rot={-0.8} glow={hl(t, "q")}>
            <Txt x={0} y={2} size={42} weight={900}>
              这件事的<tspan fill={R.key}>后果</tspan>，最终由谁承担？
            </Txt>
          </Card>
        </g>
      ) : null}
      {figs > 0 ? (
        <g opacity={figs}>
          {/* 红线：你 → 他，拴着 */}
          <path
            d={`M${380 + pose.haR[0]},${560 + pose.haR[1]} C560,${560 + 10 * Math.sin(t * 1.2)} 760,${540 - 8 * Math.sin(t)} ${900 - 26},${560 - 116}`}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - sm(prog(t, 27.6, 28.6))}
            fill="none"
            stroke={R.worse}
            strokeWidth={4}
            filter="url(#hs)"
          />
          <Figure x={380} y={560} pose={pose} t={t} wraps={2 + sm(prog(t, kt("hw"), kt("hw") + 0.3))} />
          <Txt x={290} y={460} size={34} weight={900}>
            你
          </Txt>
          <Figure x={900} y={560} pose={POSES.upright} t={t + 1} color={STYLE.figure.him} flip glow={hl(t, "him")} glowColor={R.stuck} />
          <Txt x={990} y={460} size={34} weight={900} color={R.stuck}>
            他
          </Txt>
          <Arrow x1={700} y1={300} x2={860} y2={330} color={R.stuck} k={arrowK} />
        </g>
      ) : null}
      {hw > 0 ? (
        <Card x={530} y={470} w={180} h={116} rot={-6} opacity={hw} glow={hl(t, "hw")}>
          <Txt x={0} y={-30} size={28} weight={900} color={R.stuck}>
            他的作业
          </Txt>
          {[0, 1, 2].map((i) => (
            <line key={i} x1={-66} y1={4 + i * 18} x2={i === 2 ? 20 * writing : 66} y2={4 + i * 18} stroke={R.dim} strokeWidth={2} />
          ))}
        </Card>
      ) : null}
    </g>
  );
};
const eio2 = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

// ============ 机制 34–52 ============
const Panel: React.FC<{
  x: number; title: string; color: string; items: string[]; op: number; glow: number;
}> = ({ x, title, color, items, op, glow }) => (
  <g opacity={op}>
    <Card x={x} y={300} w={440} h={350} stroke={color} glow={glow} glowColor={color}>
      <Txt x={0} y={-128} size={42} weight={900} color={color}>
        {title}
      </Txt>
      <line x1={-170} y1={-92} x2={170} y2={-92} stroke={color} strokeWidth={3} />
    </Card>
    {items.map((it, i) => (
      <Card key={it} x={x} y={260 + i * 78} w={300} h={58} rot={(i % 2 ? 1 : -1) * 1.2} fill={color}>
        <Txt x={0} y={2} size={28} weight={700} color="#fff">
          {it}
        </Txt>
      </Card>
    ))}
  </g>
);

export const Mechanism: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 34, 52, 0.02, 0.02);
  if (op <= 0) return null;
  const fL = steps(t, [[0, 1], [38.7, 0.28], [43, 0]]);
  const fR = steps(t, [[0, 1], [34.9, 0.28], [38.7, 1], [43, 0]]);
  const rep = win(t, 43.1, 47.5, 0.4, 0.4);
  const repY = eo(prog(t, 43.1, 43.6));
  const stamp = eo(prog(t, kt("report"), kt("report") + 0.2));
  const pull = win(t, 47.5, 52.4, 0.4, 0.5);
  const jit = Math.sin(t * 43) * 1.5;
  const pStamp = eo(prog(t, kt("pull"), kt("pull") + 0.2));
  return (
    <g opacity={op}>
      <Panel x={370} title="你的课题" color={R.act} items={["发不发消息", "说什么、怎么说", "今晚睡不睡"]} op={fL} glow={hl(t, "mine")} />
      <Panel x={910} title="他的课题" color={R.stuck} items={["回不回", "什么时候回", "他怎么想"]} op={fR} glow={hl(t, "his")} />
      {/* 红线：心思从你的格子拴到他的格子里 */}
      <path
        d={`M588,${440 + 4 * Math.sin(t * 1.2)} C650,${480 + 12 * Math.sin(t)} 690,${300 - 10 * Math.sin(t * 0.8)} 762,262`}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - sm(prog(t, 34.4, 35.2))}
        fill="none"
        stroke={R.worse}
        strokeWidth={4}
        opacity={Math.max(fL, fR) * (1 - sm(prog(t, 42.8, 43.2)))}
        filter="url(#hs)"
      />
      {rep > 0 ? (
        <g opacity={rep} transform={`translate(0,${(1 - repY) * 300})`}>
          <Card x={640} y={300} w={460} h={330} rot={-2} glow={hl(t, "report")} glowColor={R.worse}>
            <Txt x={0} y={-120} size={40} weight={900}>
              我的成绩单
            </Txt>
            <line x1={-180} y1={-88} x2={180} y2={-88} stroke={R.ink} strokeWidth={2} />
            {[
              ["他回了吗？", "没有"],
              ["回得快吗？", "不快"],
              ["语气热情吗？", "不知道"],
            ].map(([a, b], i) => (
              <g key={a}>
                <Txt x={-170} y={-46 + i * 54} size={28} weight={500} anchor="start">
                  {a}
                </Txt>
                <Txt x={170} y={-46 + i * 54} size={28} weight={900} anchor="end" color={R.worse}>
                  {b}
                </Txt>
              </g>
            ))}
          </Card>
          {stamp > 0 ? (
            <g transform={`translate(790,448) rotate(-12) scale(${1.6 - 0.6 * stamp})`} opacity={stamp}>
              <rect x={-90} y={-36} width={180} height={72} rx={8} fill="none" stroke={R.worse} strokeWidth={6} />
              <Txt x={0} y={2} size={42} weight={900} color={R.worse}>
                不及格
              </Txt>
            </g>
          ) : null}
        </g>
      ) : null}
      {pull > 0 ? (
        <g opacity={pull}>
          <Card x={940} y={380} w={260} h={150} fill={R.stuck}>
            <Txt x={0} y={2} size={36} weight={900} color="#fff">
              他的反应
            </Txt>
          </Card>
          <line x1={330 + 36 + jit} y1={530 - 158} x2={810} y2={380} stroke={R.worse} strokeWidth={6} filter="url(#hs)" />
          <Figure x={330 + jit} y={530} pose={POSES.pull} t={t} wraps={3} />
          {pStamp > 0 ? (
            <g transform={`translate(940,250) rotate(8) scale(${1.6 - 0.6 * pStamp})`} opacity={pStamp}>
              <rect x={-110} y={-34} width={220} height={68} rx={8} fill={STYLE.card} stroke={R.worse} strokeWidth={5} />
              <Txt x={0} y={2} size={38} weight={900} color={R.worse}>
                控制不了
              </Txt>
            </g>
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

// ============ 代价 52–67 ============
const BUBBLES = [
  { text: "考公吧", at: ctOf("“考公吧"), to: [210, 190] },
  { text: "该结婚了", at: ctOf("“该结婚了"), to: [450, 190] },
  { text: "听我的没错", at: ctOf("“听我的"), to: [210, 285] },
] as const;
const TAGS = [
  { text: "讨好", at: ctOf("讨好"), to: [800, 200] },
  { text: "操心", at: ctOf("操心"), to: [1040, 200] },
  { text: "替人做决定", at: ctOf("替人"), to: [1060, 290] },
] as const;
const TANGLE = [
  "M210,190 C500,80 800,320 1040,200",
  "M450,190 C620,420 900,120 1060,290",
  "M210,285 C420,520 760,520 880,420",
  "M400,420 C560,260 700,600 800,200",
  "M1060,290 C800,520 400,120 210,190",
];

export const Cost: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 52, 67.3, 0.02, 0.3);
  if (op <= 0) return null;
  const line = sm(prog(t, 52.3, 52.9));
  const inK = eo(prog(t, kt("in"), kt("in") + 0.6));
  const outK = eo(prog(t, kt("out"), kt("out") + 0.6));
  const tired = sm(prog(t, 64.4, 65.4));
  const pose = blendPose(POSES.upright, POSES.droop, tired);
  return (
    <g opacity={op}>
      <line x1={640} y1={80} x2={640} y2={540} stroke={R.dim} strokeWidth={3} strokeDasharray="12 10" opacity={line} />
      <Txt x={320} y={100} size={30} weight={900} color={R.act} opacity={line}>
        你的
      </Txt>
      <Txt x={960} y={100} size={30} weight={900} color={R.stuck} opacity={line}>
        别人的
      </Txt>
      {TANGLE.map((d, i) => {
        const k = sm(prog(t, 64.6 + i * 0.3, 65.6 + i * 0.3));
        if (k <= 0) return null;
        return (
          <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} fill="none" stroke={R.worse} strokeWidth={4} filter="url(#hs)" />
        );
      })}
      <Figure x={400} y={540} pose={pose} t={t} glow={hl(t, "tired")} glowColor={R.worse} wraps={3 + sm(prog(t, 64.4, 65))} />
      <Figure x={880} y={540} pose={pose} t={t + 1.3} color={STYLE.figure.him} flip />
      <g opacity={1 - 0.5 * sm(prog(t, 60.6, 61))}>
        <Arrow x1={820} y1={400} x2={470} y2={400} color={R.worse} k={inK} />
      </g>
      <Arrow x1={470} y1={470} x2={820} y2={470} color={R.worse} k={outK} />
      {BUBBLES.map((b, i) => {
        const k = eo(prog(t, b.at, b.at + 0.5));
        if (k <= 0) return null;
        return (
          <Card key={b.text} x={mix(1000, b.to[0], k)} y={mix(240 + i * 40, b.to[1], k)} w={190} h={64} r={28} fill={R.stuck} rot={(i - 1) * 3}>
            <Txt x={0} y={2} size={28} weight={700} color="#fff">
              “{b.text}”
            </Txt>
          </Card>
        );
      })}
      {TAGS.map((b, i) => {
        const k = eo(prog(t, b.at, b.at + 0.45));
        if (k <= 0) return null;
        return (
          <Card key={b.text} x={mix(400, b.to[0], k)} y={mix(330, b.to[1], k)} w={b.text.length > 3 ? 190 : 120} h={58} fill={STYLE.figure.me} rot={(1 - i) * 3}>
            <Txt x={0} y={2} size={28} weight={700} color="#fff">
              {b.text}
            </Txt>
          </Card>
        );
      })}
    </g>
  );
};

// ============ 峰值 67–80 ============
const SORT = [
  { text: "发不发消息", side: -1, row: 0 },
  { text: "回不回消息", side: 1, row: 0 },
  { text: "考不考公", side: -1, row: 1 },
  { text: "他怎么想", side: 1, row: 1 },
  { text: "今晚睡不睡", side: -1, row: 2 },
  { text: "爸妈的担心", side: 1, row: 2 },
];

// 团块里卡片的位置与绳圈角度：匀加速旋转（解析积分），峰值后定格
const ringAngle = (t: number) => {
  const T = clamp(t - 67, 0, PEAK - 67);
  const w0 = 10, w1 = 120, Tend = PEAK - 67;
  return w0 * T + ((w1 - w0) * T * T) / (2 * Tend);
};

// 线团：卡片歪斜堆叠（边缘相叠、文字不压），越勒越紧
const KNOT = { x: 790, y: 300 };
const KNOT_POS: [number, number, number][] = [
  [-140, -82, -10], [108, -90, 8], [-128, 2, 6], [120, -2, -9], [-100, 86, -5], [130, 82, 11],
];
// 乱线：3.4 圈、半径带噪声的闭合曲线，用中点二次曲线平滑
const scribble = (R: number, rot: number) => {
  const pts: [number, number][] = [];
  const n = 58;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 * 3.4 + (rot * Math.PI) / 180;
    const r = R * (0.72 + 0.42 * rnd(i + 40));
    pts.push([KNOT.x + Math.cos(a) * r * 1.25, KNOT.y + Math.sin(a) * r * 0.6]);
  }
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${mid(pts[0], pts[1]).join(",")}`;
  for (let i = 1; i < n; i++) d += ` Q${pts[i].join(",")} ${mid(pts[i], pts[(i + 1) % n]).join(",")}`;
  return d;
};

export const Peak: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 67, 80.4, 0.3, 0.6);
  if (op <= 0) return null;
  const tight = sm(prog(t, 67, PEAK));
  const after = t >= PEAK;
  // 峰值后定格到大字句结束，再松开、分拣
  const frozen = after && t < 74.6;
  const tf = frozen ? PEAK : t;
  const theta = ringAngle(tf);
  const loosen = sm(prog(t, 74.6, 75.3));
  const dim = after ? mix(1, 0.15, sm(prog(t, PEAK, PEAK + 0.15))) : 1;
  const sortK = (i: number) => eo(prog(t, 75.0 + i * 0.12, 75.9 + i * 0.12));
  const cardOp = after ? mix(dim, 1, sm(prog(t, 74.5, 75.0))) : 1;
  const board = sm(prog(t, 75.0, 75.6));

  // 小人：沿用上一场的位置和姿态，手腕四圈红线
  const pose = blendPose(POSES.droop, POSES.upright, sm(prog(t, 74.6, 75.2)));
  const figOp = 1 - sm(prog(t, 75.0, 75.5));
  const W: [number, number] = [400 + pose.haR[0], 540 + pose.haR[1]];
  const K: [number, number] = [KNOT.x - 190, KNOT.y + 30];
  const C: [number, number] = [mix(W[0], K[0], 0.45), mix(W[1], K[1], 0.45)]; // 剪断点靠近手腕，刀刃不碰线团
  const tremble = after ? 0 : Math.sin(t * 23) * 2.5 * tight;
  const sag = mix(42, 6, tight);

  // 剪刀：峰值前 0.15s 合拢
  const scRot = 90; // 剪刀从正上方竖直落下，剪在小人和线团之间的空隙
  const dir = [Math.cos((scRot * Math.PI) / 180), Math.sin((scRot * Math.PI) / 180)];
  const scIn = eo(prog(t, 70.2, 70.8));
  const reach = 95 * 1.5; // 刀刃在局部 x=95 处与线相交，乘缩放
  const piv: [number, number] = [C[0] - reach * dir[0] - (1 - scIn) * 260 * dir[0], C[1] - reach * dir[1] - (1 - scIn) * 260 * dir[1]];
  // 张口 ±13°：刀刃不扫到小人和卡片
  const scOpen = 0.55 * (t < 70.85 ? 1 : 1 - prog(t, 70.85, PEAK));
  const scOp = sm(prog(t, 70.2, 70.4)) * (1 - sm(prog(t, PEAK + 0.4, PEAK + 0.9)));

  // 剪断后：手腕那头弹回，线团那头垂落
  const recoil = after ? eo(prog(t, PEAK, PEAK + 0.35)) : 0;
  const drop = after ? eo(prog(t, PEAK, PEAK + 0.5)) : 0;
  const E1: [number, number] = [mix(C[0] - 6, W[0] + 18, recoil), mix(C[1], W[1] - 10, recoil)];
  const E2: [number, number] = [C[0] + 6, C[1] + 70 * drop];
  const knotR = mix(250, 205, tight) * (1 + 0.5 * loosen);

  return (
    <g opacity={op}>
      <g opacity={board}>
        <line x1={640} y1={80} x2={640} y2={470} stroke={hl(t, "clear") > 0.05 ? R.act : R.dim} strokeWidth={3 + 3 * hl(t, "clear")} strokeDasharray="12 10" />
        <Txt x={360} y={110} size={40} weight={900} color={R.act}>
          你的课题
        </Txt>
        <Txt x={920} y={110} size={40} weight={900} color={R.stuck}>
          他的课题
        </Txt>
      </g>
      {/* 乱线：在卡片后面，越勒越紧；松开时散开淡出 */}
      <path d={scribble(knotR, theta * 0.25)} fill="none" stroke={R.worse} strokeWidth={4} opacity={cardOp * (1 - loosen)} filter="url(#hs)" />
      {/* 你 → 线团 的那根线 */}
      <g opacity={figOp}>
        {!after ? (
          <path
            d={`M${W.join(",")} Q${(W[0] + K[0]) / 2},${(W[1] + K[1]) / 2 + sag + tremble} ${K.join(",")}`}
            fill="none"
            stroke={R.worse}
            strokeWidth={5}
            filter="url(#hs)"
          />
        ) : (
          <g filter="url(#hs)">
            <path d={`M${W.join(",")} Q${mix(C[0], W[0], 0.5)},${mix(C[1], W[1], 0.5) + 30 * recoil} ${E1.join(",")}`} fill="none" stroke={R.worse} strokeWidth={5} />
            <path d={`M${E2.join(",")} Q${(C[0] + K[0]) / 2},${(C[1] + K[1]) / 2 + 50 * drop} ${K.join(",")}`} fill="none" stroke={R.worse} strokeWidth={5} opacity={cardOp * (1 - loosen)} />
          </g>
        )}
        <Figure x={400} y={540} pose={pose} t={tf} wraps={4} />
      </g>
      {SORT.map((c, i) => {
        const [ox, oy, orot] = KNOT_POS[i];
        const sq = mix(1, 0.9, tight);
        const jx = after ? 0 : Math.sin(t * 9 + i) * 2.5 * tight;
        const cx = KNOT.x + ox * sq * (1 + 0.3 * loosen) + jx;
        const cy = KNOT.y + oy * sq * (1 + 0.3 * loosen);
        const k = sortK(i);
        const tx = c.side < 0 ? 360 : 920;
        const ty = 200 + c.row * 88;
        const color = c.side < 0 ? R.act : R.stuck;
        const bind = (1 - loosen) * (1 - k);
        return (
          <Card
            key={c.text}
            x={mix(cx, tx, k)}
            y={mix(cy, ty, k)}
            w={mix(220, 260, k)}
            h={62}
            rot={mix(orot * (1 + 0.4 * tight), (rnd(i + 9) - 0.5) * 4, k)}
            fill={k > 0.5 ? color : STYLE.card}
            opacity={cardOp}
            still={!after || frozen}
          >
            <Txt x={0} y={2} size={30} weight={700} color={k > 0.5 ? "#fff" : R.ink}>
              {c.text}
            </Txt>
            {/* 卡角缠线：只压在角上，不碰文字 */}
            {bind > 0.01 ? (
              <g stroke={R.worse} strokeWidth={4} opacity={bind}>
                <line x1={-118} y1={-15} x2={-90} y2={-39} />
                <line x1={-114} y1={-5} x2={-82} y2={-35} />
                <line x1={84} y1={37} x2={118} y2={9} />
              </g>
            ) : null}
          </Card>
        );
      })}
      {scOp > 0 ? <Scissors x={piv[0]} y={piv[1]} open={scOpen} scale={1.5} rot={scRot} /> : null}
      {/* 峰值闪白 */}
      <rect width={1280} height={720} fill="#fffdf6" opacity={0.75 * (1 - sm(prog(t, PEAK, PEAK + 0.45))) * (after ? 1 : 0)} />
    </g>
  );
};

// ============ 出口 80–98 ============
export const Exit: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 80, 98, 0.5, 0.02);
  if (op <= 0) return null;
  const fL = steps(t, [[0, 1], [85.1, 0.55]]);
  const fR = steps(t, [[0, 0.28], [85.1, 1]]);
  const allin = eo(prog(t, kt("allin"), kt("allin") + 0.3));
  const offerK = sm(prog(t, 85.3, 86.3));
  const meX = mix(300, 470, eo(prog(t, 85.2, 86.4)));
  const pose = blendPose(POSES.strong, POSES.offer, offerK);
  const cupDown = eo(prog(t, kt("support"), kt("support") + 0.5));
  const horseScene = win(t, 89.7, 98.4, 0.5, 0.6);
  const people = 1 - sm(prog(t, 89.5, 90.0));
  const horseX = mix(1080, 900, eo(prog(t, ctOf("马带到水边"), ctOf("马带到水边") + 1.4)));
  const drink = sm(prog(t, 93.1, 93.9));
  const choiceK = eo(prog(t, kt("choice"), kt("choice") + 0.8));
  return (
    <g opacity={op}>
      <line x1={640} y1={80} x2={640} y2={500} stroke={R.dim} strokeWidth={3} strokeDasharray="12 10" />
      <Txt x={320} y={100} size={36} weight={900} color={R.act} opacity={fL}>
        你的课题
      </Txt>
      <Txt x={960} y={100} size={36} weight={900} color={R.stuck} opacity={fR}>
        他的课题
      </Txt>
      <g opacity={people}>
        <Figure x={meX} y={500} pose={pose} t={t} opacity={fL} glow={hl(t, "allin")} glowColor={R.act} />
        {allin > 0 ? (
          <g transform={`translate(330,170) rotate(-5) scale(${1.5 - 0.5 * allin})`} opacity={allin * fL}>
            <Card x={0} y={0} w={240} h={76} fill={R.act}>
              <Txt x={0} y={2} size={40} weight={900} color="#fff">
                全力以赴
              </Txt>
            </Card>
          </g>
        ) : null}
        <Figure x={980} y={500} pose={POSES.upright} t={t + 2} color={STYLE.figure.him} flip opacity={fR} />
        {/* 一杯水：放在界线上，不越过去 */}
        {offerK > 0 ? (
          <g transform={`translate(${mix(meX + 82, 640, cupDown)},${mix(500 - 168, 380, cupDown)})`} opacity={offerK}>
            {hl(t, "support") > 0.01 ? (
              <circle r={44} fill="none" stroke={R.act} strokeWidth={4} opacity={hl(t, "support")} />
            ) : null}
            <g filter="url(#cut)">
              <path d="M-18,-26 L18,-26 L13,24 L-13,24 Z" fill="#e8eef3" stroke={R.stuck} strokeWidth={2} />
              <path d="M-15,-8 L15,-8 L13,24 L-13,24 Z" fill="#9fb8cf" />
            </g>
            <Txt x={0} y={52} size={24} weight={700} color={R.act}>
              支持
            </Txt>
          </g>
        ) : null}
      </g>
      {horseScene > 0 ? (
        <g opacity={horseScene}>
          <Figure x={460} y={500} pose={POSES.upright} t={t} />
          <ellipse cx={770} cy={472} rx={120} ry={22} fill="#9fb8cf" filter="url(#hs)" />
          {[0, 1].map((i) => {
            const g = hl(t, "drink");
            return g > 0.01 ? (
              <ellipse key={i} cx={770} cy={472} rx={120 + 20 * g + i * 16} ry={22 + 6 * g + i * 5} fill="none" stroke={R.key} strokeWidth={4} opacity={Math.min(1, 2 * g) * (1 - i * 0.4)} />
            ) : null;
          })}
          <HorseToy x={horseX} y={484} head={drink} />
          {choiceK > 0 ? (
            <Card x={mix(460, 900, choiceK)} y={mix(250, 260, choiceK)} w={180} h={66} rot={mix(-6, 3, choiceK)} fill={R.act} glow={hl(t, "choice")} glowColor={R.act}>
              <Txt x={0} y={2} size={34} weight={900} color="#fff">
                选择权
              </Txt>
            </Card>
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

// ============ 结尾 98–112 ============
export const Ending: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 98, 112, 0.02, 0.02);
  if (op <= 0) return null;
  const lamp = sm(prog(t, 99, 108));
  // 手机以底边为轴向前倒下：先压扁到 0，翻到背面后摊平成一块薄片，落桌时轻弹一下
  const tipP = prog(t, kt("phone"), kt("phone") + 0.45);
  const tip = tipP * tipP;
  const land = prog(t, kt("phone") + 0.45, kt("phone") + 0.75);
  const sy = tip < 0.5 ? Math.cos(Math.PI * tip) : 0.09 * eo((tip - 0.5) * 2) + (land > 0 ? 0.04 * Math.sin(Math.PI * land) * (1 - land) : 0);
  const back = tip >= 0.5;
  const upK = sm(prog(t, 100.5, 102.5));
  const stretchK = sm(prog(t, kt("you"), kt("you") + 0.8)) * (1 - sm(prog(t, 110.2, 111.2)));
  const pose = blendPose(blendPose(POSES.slump, POSES.upright, upK), POSES.stretch, stretchK);
  const fall = prog(t, 102.9, 106.5);
  return (
    <g opacity={op}>
      <Desk lamp={lamp} />
      <Figure x={560} y={560} pose={pose} t={t} glow={hl(t, "you")} glowColor={R.act} />
      <DeskFront />
      <Clock x={1090} y={110} minutes={120} warm={lamp} />
      {/* 断掉的红线飘落 */}
      {fall < 1
        ? [0, 1].map((i) => (
            <path
              key={i}
              d={i ? "M0,0 C30,-20 60,20 90,0" : "M0,0 C-25,25 -50,-10 -80,10"}
              transform={`translate(${740 + i * 80 + fall * 40 * (i ? 1 : -1)},${330 + fall * 230}) rotate(${fall * (i ? 70 : -60)})`}
              fill="none"
              stroke={hl(t, "string") > 0.05 ? R.stuck : R.worse}
              strokeWidth={4 + 6 * hl(t, "string")}
              opacity={(1 - fall) * (t > 98 ? 1 : 0)}
            />
          ))
        : null}
      {/* 底边贴着桌面（y=432）：竖直方向缩放，背面朝上趴下 */}
      <g transform={`translate(860,432) scale(1,${Math.max(0.001, sy)}) translate(0,${-150 * 0.95})`}>
        <Phone x={0} y={0} scale={0.95} rot={back ? 0 : 3 * (1 - tip * 2)} flip={back ? 1 : 0} readOn={1} readGlow={0} />
      </g>
      {back ? <ellipse cx={860} cy={436} rx={86} ry={6} fill={STYLE.shadow} opacity={0.18} /> : null}
      {hl(t, "phone") > 0.01 ? (
        <ellipse cx={860} cy={418} rx={110} ry={40} fill="none" stroke={R.key} strokeWidth={4} opacity={hl(t, "phone")} />
      ) : null}
    </g>
  );
};

// ============ 片尾 112–122 ============
export const Outro: React.FC<{ t: number }> = ({ t }) => {
  const op = win(t, 112, 119.2, 0.02, 1.2);
  if (op <= 0) return null;
  const a = eo(prog(t, 112.3, 113.1));
  const gap = eo(prog(t, 112.6, 113.6));
  return (
    <g opacity={op}>
      <line x1={120} y1={250} x2={mix(640, 380, gap)} y2={250} stroke={R.worse} strokeWidth={4 + 4 * hl(t, "ask")} />
      <line x1={mix(640, 900, gap)} y1={250} x2={1160} y2={250} stroke={R.worse} strokeWidth={4 + 4 * hl(t, "ask")} />
      <g transform={`translate(640,250) scale(${0.85 + 0.15 * a})`} opacity={a}>
        <Card x={0} y={0} w={460} h={150} rot={-1}>
          <Txt x={0} y={0} size={100} weight={900} serif>
            课题分离
          </Txt>
        </Card>
      </g>
      <Txt x={640} y={365} size={24} weight={500} color={R.dim} spacing={8} opacity={a}>
        SEPARATION OF TASKS
      </Txt>
      <Txt x={640} y={480} size={22} weight={500} color={R.dim} opacity={sm(prog(t, 113.5, 114.3))}>
        参考：岸见一郎、古贺史健《被讨厌的勇气》；A. Adler 个体心理学
      </Txt>
    </g>
  );
};

import React, { createContext, useContext } from "react";
import { STYLE, mix, PEAK, prog, rnd, sm, tension } from "./lib";

// 当前编排时间：卡片微动等需要 t 的小部件从这里取，仍是 t 的纯函数
export const TimeCtx = createContext(0);

// 纸片质感的公共部件：滤镜、纸底、卡片、文字、剪纸小人等

export const Defs: React.FC = () => (
  <defs>
    {/* 剪纸：边缘轻微不规则 + 硬投影 */}
    <filter id="cut" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" result="d" />
      <feOffset in="d" dx="4" dy="5" result="o" />
      <feFlood floodColor={STYLE.shadow} floodOpacity="0.28" />
      <feComposite in2="o" operator="in" result="s" />
      <feMerge>
        <feMergeNode in="s" />
        <feMergeNode in="d" />
      </feMerge>
    </filter>
    {/* 只有投影，不扰动边缘（给细线、文字底） */}
    <filter id="hs" x="-20%" y="-20%" width="140%" height="140%">
      <feOffset in="SourceAlpha" dx="3" dy="4" result="o" />
      <feFlood floodColor={STYLE.shadow} floodOpacity="0.25" />
      <feComposite in2="o" operator="in" result="s" />
      <feMerge>
        <feMergeNode in="s" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="2" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.33  0 0 0 0 0.25  0 0 0 0 0.16  0.32 0 0 0 -0.08"
      />
    </filter>
    {/* 只在图形内部的纸纹（转场纸用） */}
    <filter id="grainIn" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.33  0 0 0 0 0.25  0 0 0 0 0.16  0.32 0 0 0 -0.08" result="g" />
      <feComposite in="g" in2="SourceAlpha" operator="in" />
    </filter>
    <filter id="paperBlotch" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="9" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.2  0.22 0 0 0 -0.06"
      />
    </filter>
    <radialGradient id="vig" cx="50%" cy="48%" r="75%">
      <stop offset="45%" stopColor={STYLE.bg.edge} stopOpacity="0" />
      <stop offset="100%" stopColor={STYLE.bg.edge} stopOpacity="1" />
    </radialGradient>
  </defs>
);

const hexMix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mix(v, pb[i], k))).join(",")})`;
};
export { hexMix };

// 纸底：峰值前偏冷灰，峰值后转暖
export const Background: React.FC<{ t: number }> = ({ t }) => {
  const pre = hexMix(STYLE.bg.paper, STYLE.bg.cool, 0.6 * sm(prog(t, 40, PEAK)));
  const color = t < PEAK ? pre : hexMix(STYLE.bg.paper, STYLE.bg.warm, sm(prog(t, PEAK + 1, PEAK + 5)));
  return (
    <g>
      <rect width={1280} height={720} fill={color} />
      <rect width={1280} height={720} filter="url(#paperBlotch)" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const w = 220 + rnd(i) * 260, h = 120 + rnd(i + 7) * 160;
        const x = ((rnd(i + 3) * 1600 - t * (6 + 4 * rnd(i + 5))) % 1700 + 1700) % 1700 - 210;
        const y = 40 + rnd(i + 11) * 600;
        return (
          <polygon
            key={i}
            points={`${x},${y} ${x + w},${y + 12 * rnd(i + 1)} ${x + w - 14},${y + h} ${x + 10},${y + h - 10 * rnd(i + 2)}`}
            fill={STYLE.bg.edge}
            opacity={0.045}
            transform={`rotate(${(rnd(i + 4) - 0.5) * 16} ${x + w / 2} ${y + h / 2})`}
          />
        );
      })}
      <rect width={1280} height={720} filter="url(#paperGrain)" />
    </g>
  );
};

// 注意力收窄：纸边暗角随张力收紧
export const Vignette: React.FC<{ t: number }> = ({ t }) => {
  const k = tension(t);
  return <rect width={1280} height={720} fill="url(#vig)" opacity={0.18 + 0.55 * k} />;
};

export const Txt: React.FC<{
  x: number;
  y: number;
  size?: number;
  weight?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  serif?: boolean;
  opacity?: number;
  spacing?: number;
  children: React.ReactNode;
}> = ({ x, y, size = 28, weight = 700, color = STYLE.roles.ink, anchor = "middle", serif, opacity = 1, spacing = 0, children }) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fontWeight={weight}
    fill={color}
    textAnchor={anchor}
    dominantBaseline="central"
    fontFamily={serif ? STYLE.font.serif : STYLE.font.cjk}
    opacity={opacity}
    letterSpacing={spacing}
  >
    {children}
  </text>
);

// 剪纸卡片：不透明底 + 硬投影；文字放在滤镜外保持清晰
export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  rot?: number;
  r?: number;
  glow?: number; // 联动提示强度 0..1
  glowColor?: string;
  opacity?: number;
  children?: React.ReactNode;
  still?: boolean;
}> = ({ x, y, w, h, fill = STYLE.card, stroke, rot = 0, r = 6, glow = 0, glowColor = STYLE.roles.key, opacity = 1, still, children }) => {
  const t = useContext(TimeCtx);
  const s = 1 + 0.06 * glow;
  // 纸片轻摆：每张卡相位不同
  const seed = (x * 0.013 + y * 0.021) % 6.28;
  const sway = still ? 0 : 0.7 * Math.sin(t * 1.1 + seed);
  const bob = still ? 0 : 1.6 * Math.sin(t * 0.9 + seed * 1.7);
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${rot + sway}) scale(${s})`} opacity={opacity}>
      {glow > 0.01 ? (
        <rect x={-w / 2 - 9} y={-h / 2 - 9} width={w + 18} height={h + 18} rx={r + 8} fill="none" stroke={glowColor} strokeWidth={5} opacity={glow} />
      ) : null}
      <g filter="url(#cut)">
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 : 0} />
      </g>
      {children}
    </g>
  );
};

// ---------- 剪纸小人 ----------
type P = [number, number];
export type Pose = {
  hip: P; back: P; sh: P; head: P;
  elL: P; haL: P; elR: P; haR: P;
  knL: P; ftL: P; knR: P; ftR: P;
};
export const POSES: Record<string, Pose> = {
  upright: {
    hip: [0, -110], back: [0, -155], sh: [0, -198], head: [0, -234],
    elL: [-22, -158], haL: [-26, -116], elR: [22, -158], haR: [26, -116],
    knL: [-12, -55], ftL: [-18, 0], knR: [12, -55], ftR: [18, 0],
  },
  slump: {
    hip: [0, -108], back: [20, -150], sh: [16, -184], head: [30, -206],
    elL: [26, -146], haL: [52, -152], elR: [34, -148], haR: [56, -156],
    knL: [-10, -55], ftL: [-16, 0], knR: [12, -55], ftR: [16, 0],
  },
  droop: {
    hip: [0, -108], back: [14, -152], sh: [10, -186], head: [22, -212],
    elL: [-6, -146], haL: [-4, -104], elR: [22, -146], haR: [26, -104],
    knL: [-10, -55], ftL: [-16, 0], knR: [12, -55], ftR: [16, 0],
  },
  stretch: {
    hip: [0, -110], back: [0, -156], sh: [0, -200], head: [0, -238],
    elL: [-30, -236], haL: [-42, -272], elR: [30, -236], haR: [42, -272],
    knL: [-12, -55], ftL: [-18, 0], knR: [12, -55], ftR: [18, 0],
  },
  pull: {
    hip: [-6, -104], back: [-22, -148], sh: [-34, -186], head: [-46, -218],
    elL: [2, -168], haL: [34, -160], elR: [6, -162], haR: [38, -156],
    knL: [8, -54], ftL: [24, 0], knR: [-18, -52], ftR: [-30, 0],
  },
  offer: {
    hip: [0, -110], back: [4, -155], sh: [6, -198], head: [10, -234],
    elL: [-20, -158], haL: [-24, -116], elR: [40, -172], haR: [82, -168],
    knL: [-12, -55], ftL: [-18, 0], knR: [12, -55], ftR: [18, 0],
  },
  strong: {
    hip: [0, -112], back: [0, -158], sh: [0, -202], head: [0, -240],
    elL: [-34, -176], haL: [-20, -150], elR: [34, -176], haR: [20, -150],
    knL: [-16, -56], ftL: [-26, 0], knR: [16, -56], ftR: [26, 0],
  },
};
export const blendPose = (a: Pose, b: Pose, k: number): Pose => {
  const out = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((key) => {
    out[key] = [mix(a[key][0], b[key][0], k), mix(a[key][1], b[key][1], k)];
  });
  return out;
};

export type FigureLook = "silhouette" | "doll" | "pin" | "bean";
const SKIN = "#f2cfa6";
const HAIR = "#3a2a22";
const SHOE = "#4a3a30";

export const Figure: React.FC<{
  x: number;
  y: number;
  pose: Pose;
  t: number;
  color?: string;
  scale?: number;
  flip?: boolean;
  opacity?: number;
  glow?: number;
  glowColor?: string;
  look?: FigureLook;
  wraps?: number; // 手腕上缠了几圈红线（贯穿全片的隐喻）
}> = ({ x, y, pose, t, color = STYLE.figure.me, scale = 1, flip, opacity = 1, glow = 0, glowColor = STYLE.roles.key, look = STYLE.figure.look, wraps = 0 }) => {
  const br = Math.sin(t * 2.4) * 1.6; // 呼吸
  const up = (p: P, k = 1): P => [p[0], p[1] + br * k];
  const sh = up(pose.sh), head = up(pose.head), back = up(pose.back, 0.5);
  const elL = up(pose.elL, 0.8), elR = up(pose.elR, 0.8), haL = up(pose.haL, 0.6), haR = up(pose.haR, 0.6);
  const seg = (pts: P[], w: number, c = color) => (
    <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const torso = (w: number, c = color) => (
    <path d={`M${pose.hip.join(",")} Q${back.join(",")} ${sh.join(",")}`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
  );
  // 脸朝 +x：眼睛、腮红放在头的右前方
  const face = (hx: number, hy: number, r: number) => (
    <g>
      <circle cx={hx + r * 0.22} cy={hy - r * 0.05} r={r * 0.11} fill={HAIR} />
      <circle cx={hx + r * 0.62} cy={hy - r * 0.05} r={r * 0.11} fill={HAIR} />
      <ellipse cx={hx + r * 0.42} cy={hy + r * 0.32} rx={r * 0.16} ry={r * 0.09} fill="#e8957a" opacity={0.8} />
    </g>
  );
  const shoe = (f: P) => <ellipse cx={f[0] + 6} cy={f[1] - 4} rx={13} ry={7} fill={SHOE} />;
  let body: React.ReactNode;
  if (look === "doll") {
    // 圆头玩偶：大圆头 + 发帽 + 粗短四肢 + 鞋
    body = (
      <g>
        {seg([pose.hip, pose.knL, pose.ftL], 22, "#5b5048")}
        {seg([pose.hip, pose.knR, pose.ftR], 22, "#5b5048")}
        {shoe(pose.ftL)}
        {shoe(pose.ftR)}
        {torso(50)}
        {seg([sh, elL, haL], 18)}
        {seg([sh, elR, haR], 18)}
        <circle cx={haL[0]} cy={haL[1]} r={9} fill={SKIN} />
        <circle cx={haR[0]} cy={haR[1]} r={9} fill={SKIN} />
        <circle cx={head[0]} cy={head[1] - 6} r={31} fill={SKIN} />
        <path d={`M${head[0] - 32},${head[1] - 4} A32,32 0 0 1 ${head[0] + 30},${head[1] - 16} Q${head[0] + 6},${head[1] - 20} ${head[0] - 8},${head[1] - 4} Z`} fill={HAIR} />
        {face(head[0], head[1] - 2, 30)}
      </g>
    );
  } else if (look === "pin") {
    // 纸偶：分片剪纸 + 关节铆钉
    const rivet = (p: P) => <circle cx={p[0]} cy={p[1]} r={4.5} fill="#c9a227" stroke="#8a6d10" strokeWidth={1.5} />;
    body = (
      <g>
        {seg([pose.hip, pose.knL], 20, "#5b5048")}
        {seg([pose.knL, pose.ftL], 18, "#5b5048")}
        {seg([pose.hip, pose.knR], 20, "#5b5048")}
        {seg([pose.knR, pose.ftR], 18, "#5b5048")}
        {shoe(pose.ftL)}
        {shoe(pose.ftR)}
        {torso(46)}
        {seg([sh, elL], 17)}
        {seg([elL, haL], 15)}
        {seg([sh, elR], 17)}
        {seg([elR, haR], 15)}
        <circle cx={haL[0]} cy={haL[1]} r={8} fill={SKIN} />
        <circle cx={haR[0]} cy={haR[1]} r={8} fill={SKIN} />
        <circle cx={head[0]} cy={head[1] - 4} r={28} fill={SKIN} />
        <path d={`M${head[0] - 29},${head[1] - 2} A29,29 0 0 1 ${head[0] + 27},${head[1] - 14} L${head[0] - 6},${head[1] - 10} Z`} fill={HAIR} />
        {face(head[0], head[1], 27)}
        {[pose.knL, pose.knR, pose.hip, sh, elL, elR].map((p, i) => <g key={i}>{rivet(p)}</g>)}
      </g>
    );
  } else if (look === "bean") {
    // 豆豆人：身子和头连成一颗豆，细短手脚
    const top: P = [head[0], head[1] + 6];
    body = (
      <g>
        {seg([pose.hip, pose.knL, pose.ftL], 13)}
        {seg([pose.hip, pose.knR, pose.ftR], 13)}
        {shoe(pose.ftL)}
        {shoe(pose.ftR)}
        <path d={`M${pose.hip[0]},${pose.hip[1] - 10} Q${back[0]},${back[1]} ${top.join(",")}`} fill="none" stroke={color} strokeWidth={78} strokeLinecap="round" />
        {seg([sh, elL, haL], 12, "#5b5048")}
        {seg([sh, elR, haR], 12, "#5b5048")}
        <circle cx={top[0] + 6} cy={top[1] - 4} r={13} fill="#fff" />
        <circle cx={top[0] + 28} cy={top[1] - 4} r={13} fill="#fff" />
        <circle cx={top[0] + 10} cy={top[1] - 3} r={6} fill={HAIR} />
        <circle cx={top[0] + 32} cy={top[1] - 3} r={6} fill={HAIR} />
      </g>
    );
  } else {
    body = (
      <g>
        {seg([pose.hip, pose.knL, pose.ftL], 17)}
        {seg([pose.hip, pose.knR, pose.ftR], 17)}
        {torso(42)}
        {seg([sh, elL, haL], 15)}
        {seg([sh, elR, haR], 15)}
        <circle cx={head[0]} cy={head[1]} r={25} fill={color} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`} opacity={opacity}>
      {glow > 0.01 ? (
        <ellipse cx={pose.back[0]} cy={-125} rx={70} ry={140} fill="none" stroke={glowColor} strokeWidth={5} opacity={glow} />
      ) : null}
      <g filter="url(#cut)">{body}</g>
      {wraps > 0
        ? Array.from({ length: Math.ceil(wraps) }).map((_, i) => (
            <ellipse
              key={i}
              cx={haR[0] - 2 + i * 3}
              cy={haR[1] - 10 + i * 6}
              rx={13}
              ry={5}
              transform={`rotate(-25 ${haR[0]} ${haR[1]})`}
              fill="none"
              stroke={STYLE.roles.worse}
              strokeWidth={3.5}
              opacity={Math.min(1, wraps - i)}
            />
          ))
        : null}
    </g>
  );
};

// 手机卡片
export const Phone: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rot?: number;
  flip?: number; // 0 正面 → 1 扣下（背面）
  readGlow?: number;
  readOn?: number;
  sent?: number; // 0 → 1：消息气泡发出
  clock?: string;
  children?: React.ReactNode;
}> = ({ x, y, scale = 1, rot = 0, flip = 0, readGlow = 0, readOn = 0, sent = 1, clock, children }) => {
  const sx = Math.cos(flip * Math.PI);
  const back = sx < 0;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale * Math.max(0.02, Math.abs(sx))},${scale})`}>
      <g filter="url(#cut)">
        <rect x={-80} y={-150} width={160} height={300} rx={20} fill={back ? "#3a3634" : "#2f2b29"} />
        {back ? null : <rect x={-68} y={-128} width={136} height={258} rx={8} fill="#f6f1e6" />}
      </g>
      {back ? (
        <circle cx={-44} cy={-112} r={10} fill="#55504c" />
      ) : (
        <g>
          <rect x={-68} y={-128} width={136} height={30} fill="#e3dccd" />
          <Txt x={0} y={-113} size={14} color={STYLE.roles.dim} weight={500}>
            他
          </Txt>
          {clock ? (
            <Txt x={-60} y={-113} size={11} color={STYLE.roles.dim} weight={700} anchor="start">
              {clock}
            </Txt>
          ) : null}
          <g transform={`translate(6,${-54 + 30 * (1 - sent)}) scale(${0.6 + 0.4 * sent})`} opacity={sent}>
            <g filter="url(#hs)">
              <rect x={-58} y={-30} width={116} height={60} rx={10} fill={STYLE.roles.act} />
            </g>
            <Txt x={0} y={-10} size={15} color="#fff" weight={500}>
              今天那件事，
            </Txt>
            <Txt x={0} y={12} size={15} color="#fff" weight={500}>
              我是不是…
            </Txt>
          </g>
          <g opacity={readOn} transform={`translate(38,-2) scale(${1 + 0.3 * readGlow})`}>
            <Txt x={0} y={0} size={22} weight={700} color={readGlow > 0.05 ? STYLE.roles.key : STYLE.roles.dim}>
              已读
            </Txt>
          </g>
          {children}
        </g>
      )}
    </g>
  );
};

// 剪刀：open 0 合拢 → 1 张开
export const Scissors: React.FC<{ x: number; y: number; open: number; scale?: number; rot?: number }> = ({ x, y, open, scale = 1, rot = 0 }) => {
  const a = 24 * open;
  const blade = (sign: number) => (
    <g transform={`rotate(${sign * a})`}>
      <path d={`M0,0 L150,${-8 * sign} L150,${2 * sign} Z`} fill="#c9ccd1" stroke="#6d7177" strokeWidth={2} />
      <path d={`M0,0 L-40,${18 * sign}`} stroke={STYLE.roles.worse} strokeWidth={10} strokeLinecap="round" />
      <ellipse cx={-62} cy={28 * sign} rx={26} ry={18} fill="none" stroke={STYLE.roles.worse} strokeWidth={10} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`} filter="url(#cut)">
      {blade(1)}
      {blade(-1)}
      <circle r={6} fill="#6d7177" />
    </g>
  );
};

// 剪纸小马
export const Horse: React.FC<{ x: number; y: number; head: number; color?: string }> = ({ x, y, head, color = "#8a6a4a" }) => (
  <g transform={`translate(${x},${y})`} filter="url(#cut)">
    <rect x={-58} y={-112} width={12} height={62} rx={5} fill={color} />
    <rect x={-34} y={-112} width={12} height={62} rx={5} fill={color} />
    <rect x={24} y={-112} width={12} height={62} rx={5} fill={color} />
    <rect x={46} y={-112} width={12} height={62} rx={5} fill={color} />
    <ellipse cx={0} cy={-120} rx={70} ry={32} fill={color} />
    <path d="M62,-130 Q96,-128 92,-90" stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" />
    {/* 脖子与头，head: 0 抬头 → 1 低头够到水 */}
    <g transform={`translate(-52,-136) rotate(${-30 - 75 * head})`}>
      <rect x={-15} y={-84} width={30} height={90} rx={13} fill={color} />
      <g transform="translate(0,-80) rotate(-70)">
        <rect x={-15} y={-58} width={30} height={64} rx={14} fill={color} />
        <polygon points="-10,4 -2,-14 6,4" fill={color} />
      </g>
    </g>
  </g>
);

export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; k?: number; w?: number }> = ({ x1, y1, x2, y2, color, k = 1, w = 7 }) => {
  if (k <= 0.001) return null;
  const xe = mix(x1, x2, k), ye = mix(y1, y2, k);
  const ang = Math.atan2(ye - y1, xe - x1);
  const hs = 20;
  return (
    <g filter="url(#hs)">
      <line x1={x1} y1={y1} x2={xe} y2={ye} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <polygon
        points={`${xe + Math.cos(ang) * 6},${ye + Math.sin(ang) * 6} ${xe - Math.cos(ang - 0.5) * hs},${ye - Math.sin(ang - 0.5) * hs} ${xe - Math.cos(ang + 0.5) * hs},${ye - Math.sin(ang + 0.5) * hs}`}
        fill={color}
      />
    </g>
  );
};

export const pulse = (t: number, a: number) => sm(prog(t, a, a + 0.3)) * (1 - sm(prog(t, a + 0.5, a + 1.2)));

// 纸片转场：一整张撕边纸扫过画面，完全盖住时切场景
export type WipeKind = "sweepL" | "sweepR" | "strips" | "diag";
const tornEdge = (x: number, y0: number, y1: number, seed: number, dir: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 18; i++) {
    const y = mix(y0, y1, i / 18);
    pts.push(`${x + dir * (rnd(seed + i) * 26)},${y}`);
  }
  return pts;
};
export const Wipe: React.FC<{ t: number; at: number; kind: WipeKind; dur?: number }> = ({ t, at, kind, dur = 0.9 }) => {
  const p = prog(t, at - dur / 2, at + dur / 2);
  if (kind !== "strips" && (p <= 0 || p >= 1)) return null;
  if (kind === "strips" && (t < at - 0.6 || t > at + 0.6)) return null;
  const paper = STYLE.card;
  if (kind === "strips") {
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          // 匀速下落，五条错开 0.05s；at 前后约 0.07s 内五条同时盖满
          const q = prog(t, at - 0.6 + i * 0.05, at + 0.4 + i * 0.05);
          const top = mix(-1500, 760, q);
          const x0 = i * 256 - 6;
          return (
            <g key={i} filter="url(#hs)">
              <rect x={x0} y={top} width={268} height={1480} fill={i % 2 ? paper : STYLE.bg.paper} />
              <rect x={x0} y={top} width={268} height={1480} fill="#000" filter="url(#grainIn)" />
            </g>
          );
        })}
      </g>
    );
  }
  // 横扫 / 斜扫：宽 2600 的纸，匀速穿过，约 0.3s 完全覆盖
  const W = 2600;
  const dir = kind === "sweepR" ? 1 : -1;
  const left = dir < 0 ? mix(1300, -W - 20, p) : mix(-W - 20, 1300, p);
  const rot = kind === "diag" ? -12 : 0;
  const lead = tornEdge(left, -300, 1020, 11, -1);
  const trail = tornEdge(left + W, 1020, -300, 37, 1);
  return (
    <g transform={`rotate(${rot} 640 360)`} filter="url(#hs)">
      <polygon points={[...lead, ...trail].join(" ")} fill={paper} />
      <polygon points={[...lead, ...trail].join(" ")} fill="#000" filter="url(#grainIn)" />
    </g>
  );
};

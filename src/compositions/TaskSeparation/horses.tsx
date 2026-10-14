import React from "react";
import { STYLE } from "./lib";

// 小马造型候选。都面朝左，原点在两前蹄与后蹄中间的地面；head: 0 抬头 → 1 低头喝水
type HorseProps = { x: number; y: number; head: number; scale?: number };

const BROWN = "#8a6a4a";
const DARK = "#5e4630";

// A：剪影马 —— 和剪纸小人同一种语言：单色剪影、硬投影
export const HorseSilhouette: React.FC<HorseProps> = ({ x, y, head, scale = 1 }) => {
  const leg = (lx: number, back = false) => (
    <path
      key={lx}
      d={`M${lx - 8},-104 L${lx + 8},-104 L${lx + (back ? 7 : 5)},-14 L${lx + 9},0 L${lx - 9},0 L${lx - 6},-14 Z`}
      fill={BROWN}
    />
  );
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} filter="url(#cut)">
      {leg(-50)}
      {leg(-30)}
      {leg(38, true)}
      {leg(58, true)}
      <path d="M72,-132 C104,-128 110,-96 98,-64 C94,-90 86,-110 68,-116 Z" fill={DARK} />
      <path d="M-72,-118 C-74,-152 58,-160 78,-128 C88,-104 64,-90 4,-92 C-46,-92 -70,-98 -72,-118 Z" fill={BROWN} />
      <g transform={`translate(-58,-132) rotate(${-8 - 112 * head})`}>
        <path d="M-16,8 L16,8 L6,-66 L-16,-62 Z" fill={BROWN} />
        <path d="M6,-66 L14,-60 L22,2 L14,6 Z" fill={DARK} />
        <g transform={`translate(-4,-62) rotate(${48 * head}) translate(4,62)`}>
        <path d="M-4,-58 C-20,-80 -62,-82 -80,-66 C-88,-58 -82,-46 -68,-46 C-48,-48 -26,-46 -6,-42 Z" fill={BROWN} />
        <path d="M-6,-70 L0,-92 L6,-66 Z" fill={BROWN} />
        <circle cx={-26} cy={-64} r={3} fill={DARK} />
        </g>
      </g>
    </g>
  );
};

// B：折纸马 —— 两种明度的三角面，像折出来的纸
export const HorseOrigami: React.FC<HorseProps> = ({ x, y, head, scale = 1 }) => {
  const L = "#b08458", M = "#94704a", D = "#765838";
  const tri = (pts: number[][], fill: string, k: number) => (
    <polygon key={k} points={pts.map((p) => p.join(",")).join(" ")} fill={fill} />
  );
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} filter="url(#cut)">
      {tri([[-54, -100], [-38, -100], [-46, 0]], D, 1)}
      {tri([[-36, -100], [-22, -100], [-28, 0]], M, 2)}
      {tri([[38, -98], [54, -98], [48, 0]], D, 3)}
      {tri([[54, -98], [68, -102], [64, 0]], M, 4)}
      {tri([[70, -136], [104, -118], [86, -76]], D, 5)}
      {tri([[-62, -140], [72, -136], [-54, -98]], L, 6)}
      {tri([[72, -136], [64, -96], [-54, -98]], M, 7)}
      <g transform={`translate(-56,-136) rotate(${-4 - 112 * head})`}>
        {tri([[-8, 6], [20, 2], [-18, -72]], L, 8)}
        {tri([[20, 2], [-18, -72], [2, -70]], M, 9)}
        <g transform={`translate(-8,-71) rotate(${50 * head}) translate(8,71)`}>
        {tri([[-18, -72], [-76, -50], [-12, -48]], D, 10)}
        {tri([[-18, -72], [-12, -48], [2, -70]], M, 11)}
        {tri([[-16, -72], [-8, -94], [-4, -70]], D, 12)}
        </g>
      </g>
    </g>
  );
};

// C：圆润玩具马 —— 胖身子、短腿、绿色鞍布，最可爱
export const HorseToy: React.FC<HorseProps> = ({ x, y, head, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} filter="url(#cut)">
    {[-40, -16, 18, 42].map((lx) => (
      <g key={lx}>
        <rect x={lx - 10} y={-78} width={20} height={70} rx={9} fill={BROWN} />
        <rect x={lx - 11} y={-12} width={22} height={12} rx={4} fill={DARK} />
      </g>
    ))}
    <path d="M58,-112 C88,-118 96,-92 84,-70 C80,-86 72,-98 58,-100 Z" fill={DARK} />
    <ellipse cx={0} cy={-100} rx={66} ry={38} fill={BROWN} />
    <rect x={-18} y={-136} width={44} height={36} rx={8} fill={STYLE.roles.act} />
    <line x1={-12} y1={-104} x2={20} y2={-104} stroke="#fff" strokeWidth={2} strokeDasharray="4 4" />
    <g transform={`translate(-48,-120) rotate(${-6 - 110 * head})`}>
      <rect x={-16} y={-58} width={32} height={66} rx={14} fill={BROWN} />
      <path d="M8,-58 L22,-48 L12,-40 L24,-30 L12,-22 L22,-12 L8,-6 Z" fill={DARK} />
      <g transform={`translate(0,-56) rotate(${50 * head}) translate(0,56)`}>
      <rect x={-70} y={-84} width={74} height={44} rx={22} fill={BROWN} />
      <ellipse cx={-60} cy={-58} rx={18} ry={14} fill="#a8865f" />
      <circle cx={-64} cy={-60} r={2.5} fill={DARK} />
      <circle cx={-30} cy={-68} r={4} fill={DARK} />
      <path d="M-14,-82 L-6,-102 L2,-80 Z" fill={BROWN} />
      </g>
    </g>
  </g>
);

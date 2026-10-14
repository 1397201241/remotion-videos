import React from "react";
import { AbsoluteFill } from "remotion";
import { STYLE } from "./lib";
import { Background, Card, Defs, Figure, POSES, Phone, Scissors, Txt } from "./paper";

const R = STYLE.roles;

// 封面：layout "34" = 1080×1440 上下排；"43" = 1440×1080 左图右字
export const TaskSeparationCover: React.FC<{ layout: "34" | "43" }> = ({ layout }) => {
  const W = layout === "34" ? 1080 : 1440;
  const H = layout === "34" ? 1440 : 1080;
  const tall = layout === "34";
  // 画面区（角色 + 手机 + 红线 + 剪刀）的原点与缩放
  // 画面局部包围盒约 x 150..900, y 155..560
  const art = tall ? { x: 52 - 150 * 1.3, y: 790 - 155 * 1.3, s: 1.3 } : { x: 40 - 150 * 0.85, y: 380 - 155 * 0.85, s: 0.85 };
  const big = tall ? 120 : 92;
  // 文字区
  const tx = tall ? W / 2 : 1050;
  const ty = tall ? 150 : 210;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs />
        <g transform={`scale(${W / 1280},${H / 720})`}>
          <Background t={0} />
        </g>
        {/* 大标题 */}
        <Card x={tx} y={ty + 170} w={big * 5.6} h={big * 1.3} rot={-1.5}>
          <Txt x={0} y={4} size={big} weight={900}>
            已读不回，
          </Txt>
        </Card>
        <Card x={tx + 20} y={ty + 170 + big * 1.5} w={big * 6.4} h={big * 1.3} rot={1.2}>
          <Txt x={0} y={4} size={big} weight={900}>
            是<tspan fill={R.key}>谁</tspan>的课题？
          </Txt>
        </Card>
        {/* 概念胶囊 */}
        <g transform={`translate(${tx},${ty + 190 + big * 2.9})`}>
          <rect x={-300} y={-38} width={600} height={76} rx={38} fill={R.act} filter="url(#hs)" />
          <Txt x={0} y={2} size={36} weight={900} color="#fff">
            课题分离 · Separation of Tasks
          </Txt>
        </g>
        {/* 画面区 */}
        <g transform={`translate(${art.x},${art.y}) scale(${art.s})`}>
          <path d="M416,404 C520,470 590,430 640,340" fill="none" stroke={R.worse} strokeWidth={5} filter="url(#hs)" />
          <Figure x={360} y={560} pose={POSES.slump} t={0} />
          <Phone x={700} y={290} scale={0.95} rot={4} readOn={1} readGlow={1} />
          <Scissors x={520} y={430} open={0.8} scale={0.85} rot={-30} />
          <Card x={300} y={195} w={300} h={70} r={30}>
            <Txt x={0} y={2} size={28}>
              我是不是说错话了？
            </Txt>
          </Card>
          <Card x={800} y={490} w={200} h={80} rot={-4}>
            <Txt x={0} y={2} size={34} weight={900}>
              翻了 <tspan fill={R.key}>17</tspan> 遍
            </Txt>
          </Card>
        </g>
        {/* 底部片名 */}
        <Txt x={tall ? W / 2 : tx} y={H - 100} size={36} weight={900} serif color={R.ink} spacing={10}>
          课题分离
        </Txt>
      </svg>
    </AbsoluteFill>
  );
};

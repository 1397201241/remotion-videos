import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const TEXT = "刹车踏板断裂？";
const FONT =
  "'PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', sans-serif";

export const Hook: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, #1a0006 0%, #000000 70%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* 逐字弹出 */}
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "baseline",
        }}
      >
        {Array.from(TEXT).map((char, i) => {
          const startFrame = i * 3;
          const opacity = interpolate(
            frame,
            [startFrame, startFrame + 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const y = interpolate(
            frame,
            [startFrame, startFrame + 12],
            [60, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          // 最后几帧抖动
          const shake =
            frame > 40 && frame % 3 === 0 ? (i % 2 === 0 ? 6 : -6) : 0;
          return (
            <span
              key={`${char}-${i}`}
              style={{
                fontSize: 180,
                fontWeight: 900,
                color: primaryColor,
                fontFamily: FONT,
                opacity,
                transform: `translateY(${y + shake}px)`,
                textShadow: `0 0 48px ${primaryColor}aa, 0 0 16px ${primaryColor}`,
                lineHeight: 1,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* 副标题 */}
      <div
        style={{
          marginTop: 80,
          fontSize: 56,
          color: "#FFFFFF",
          fontFamily: FONT,
          opacity: interpolate(frame, [28, 45], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          letterSpacing: 12,
          fontWeight: 500,
        }}
      >
        电 车 场 景
      </div>

      {/* 底部扫描线 */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: interpolate(frame, [0, 60], [0, 1920], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          width: 80,
          height: 6,
          background: primaryColor,
          boxShadow: `0 0 24px ${primaryColor}`,
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  );
};

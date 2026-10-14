import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const FONT =
  "'PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', sans-serif";

export const Crisis: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const frame = useCurrentFrame();

  // 警告闪烁
  const flash = frame % 14 < 7;

  // 入场
  const warningOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 危险提示文字
  const dangerOpacity = interpolate(frame, [40, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 仪表盘指示
  const dashOpacity = interpolate(frame, [60, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center top, #2a0000 0%, #000000 80%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* 警告三角 SVG */}
      <svg
        width={280}
        height={250}
        viewBox="0 0 280 250"
        style={{
          opacity: warningOpacity * (flash ? 1 : 0.4),
          marginBottom: 40,
          filter: `drop-shadow(0 0 32px ${primaryColor}aa)`,
        }}
      >
        <polygon
          points="140,20 270,240 10,240"
          fill="none"
          stroke={primaryColor}
          strokeWidth={14}
          strokeLinejoin="round"
        />
        <line
          x1="140"
          y1="90"
          x2="140"
          y2="170"
          stroke={primaryColor}
          strokeWidth={18}
          strokeLinecap="round"
        />
        <circle cx="140" cy="210" r="11" fill={primaryColor} />
      </svg>

      {/* 主警告文字 */}
      <div
        style={{
          fontSize: 128,
          fontWeight: 900,
          color: flash ? primaryColor : "#FFFFFF",
          fontFamily: FONT,
          opacity: warningOpacity,
          letterSpacing: 8,
        }}
      >
        刹车系统故障
      </div>

      {/* 副提示 */}
      <div
        style={{
          marginTop: 56,
          fontSize: 64,
          color: "#FFAA44",
          fontFamily: FONT,
          opacity: dangerOpacity,
          fontWeight: 700,
        }}
      >
        制动正在失效
      </div>

      {/* 模拟档位指示 */}
      <div
        style={{
          marginTop: 80,
          display: "flex",
          gap: 32,
          opacity: dashOpacity,
        }}
      >
        {["P", "R", "N", "D"].map((g, i) => {
          const isP = i === 0;
          return (
            <div
              key={g}
              style={{
                fontSize: 56,
                padding: "12px 32px",
                border: `4px solid ${isP ? primaryColor : "#444444"}`,
                color: isP ? primaryColor : "#666666",
                borderRadius: 12,
                fontFamily: "monospace",
                fontWeight: 800,
                background: isP ? `${primaryColor}15` : "transparent",
                boxShadow: isP ? `0 0 24px ${primaryColor}aa` : "none",
              }}
            >
              {g}
            </div>
          );
        })}
      </div>

      {/* 底部提示文字 */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          fontSize: 40,
          color: "#888888",
          fontFamily: FONT,
          opacity: interpolate(frame, [70, 115], [0, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          letterSpacing: 4,
        }}
      >
        —— 别 慌，记 住 4 步 ——
      </div>
    </AbsoluteFill>
  );
};

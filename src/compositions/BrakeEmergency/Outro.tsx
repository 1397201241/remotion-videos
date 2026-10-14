import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";

const FONT =
  "'PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', sans-serif";

export const Outro: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const frame = useCurrentFrame();

  const textOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [10, 55], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.back(1.4),
  });

  const subtitleOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const footerOpacity = interpolate(frame, [55, 80], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, ${primaryColor}55 0%, #000000 70%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* 中心大字 */}
      <div
        style={{
          fontSize: 220,
          fontWeight: 900,
          color: primaryColor,
          fontFamily: FONT,
          opacity: textOpacity,
          transform: `scale(${scale})`,
          textShadow: `0 0 64px ${primaryColor}cc, 0 0 24px ${primaryColor}`,
          letterSpacing: 16,
          lineHeight: 1,
        }}
      >
        安全第一
      </div>

      {/* 副标题 */}
      <div
        style={{
          fontSize: 64,
          color: "#FFFFFF",
          marginTop: 64,
          fontFamily: FONT,
          opacity: subtitleOpacity,
          letterSpacing: 8,
        }}
      >
        驾驶无小事 · 平安每段路
      </div>

      {/* 底部 footer */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          fontSize: 36,
          color: "#FFFFFF90",
          fontFamily: FONT,
          opacity: footerOpacity,
          letterSpacing: 6,
        }}
      >
        电 车 应 急 指 南 · 危 机 时 刻 救 你 一 命
      </div>

      {/* 四角发光 */}
      {[
        { top: 60, left: 60 },
        { top: 60, right: 60 },
        { bottom: 60, left: 60 },
        { bottom: 60, right: 60 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            ...pos,
            width: 24,
            height: 24,
            border: `3px solid ${primaryColor}`,
            opacity: footerOpacity,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

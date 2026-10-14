import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const FONT =
  "'PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', sans-serif";

type Step = {
  num: string;
  title: string;
  subtitle: string;
};

const STEPS: Step[] = [
  {
    num: "01",
    title: "立即抢挂 P 档",
    subtitle: "电子驻车优先于机械刹车",
  },
  {
    num: "02",
    title: "长按 P 档强制驻车",
    subtitle: "持续按压 2 至 3 秒激活紧急制动",
  },
  {
    num: "03",
    title: "开启双闪警示",
    subtitle: "提示后方车辆注意避让",
  },
  {
    num: "04",
    title: "撤离到安全区域",
    subtitle: "车后方 150 米处设置警示牌",
  },
];

const PER_STEP = 120; // 4 seconds each at 30fps

export const Steps: React.FC<{ primaryColor: string }> = ({ primaryColor }) => {
  const frame = useCurrentFrame();

  const currentIndex = Math.min(Math.floor(frame / PER_STEP), STEPS.length - 1);
  const stepFrame = frame - currentIndex * PER_STEP;
  const step = STEPS[currentIndex];

  // 标题入场
  const titleOpacity = interpolate(stepFrame, [8, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleX = interpolate(stepFrame, [8, 28], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 副标题入场
  const subtitleOpacity = interpolate(stepFrame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 进度条
  const progressOpacity = interpolate(stepFrame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 切换出场
  const exitOpacity = interpolate(stepFrame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #0a1929 0%, #16213e 50%, #0a1929 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 120px",
        opacity: exitOpacity,
      }}
    >
      {/* 巨大背景数字 */}
      <div
        style={{
          fontSize: 720,
          fontWeight: 900,
          color: `${primaryColor}22`,
          position: "absolute",
          right: -40,
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "monospace",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {step.num}
      </div>

      {/* STEP 标签 */}
      <div
        style={{
          fontSize: 64,
          color: primaryColor,
          fontWeight: 800,
          letterSpacing: 16,
          fontFamily: "monospace",
          position: "relative",
          zIndex: 2,
          opacity: interpolate(stepFrame, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        STEP {step.num}
      </div>

      {/* 主标题 */}
      <div
        style={{
          fontSize: 156,
          fontWeight: 900,
          color: "#FFFFFF",
          marginTop: 36,
          fontFamily: FONT,
          opacity: titleOpacity,
          transform: `translateX(${titleX}px)`,
          position: "relative",
          zIndex: 2,
          lineHeight: 1.1,
          letterSpacing: 4,
          textShadow: `0 8px 24px rgba(0,0,0,0.5)`,
        }}
      >
        {step.title}
      </div>

      {/* 副标题 */}
      <div
        style={{
          fontSize: 60,
          color: "#B0C4DE",
          marginTop: 56,
          fontFamily: FONT,
          opacity: subtitleOpacity,
          position: "relative",
          zIndex: 2,
          fontWeight: 400,
        }}
      >
        {step.subtitle}
      </div>

      {/* 4 格进度指示 */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 120,
          display: "flex",
          gap: 16,
          opacity: progressOpacity,
        }}
      >
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 80,
              height: 10,
              background: i === currentIndex ? primaryColor : "#FFFFFF30",
              borderRadius: 5,
              boxShadow:
                i === currentIndex ? `0 0 16px ${primaryColor}aa` : "none",
            }}
          />
        ))}
      </div>

      {/* 当前步骤标签 */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          right: 120,
          fontSize: 36,
          color: "#FFFFFF80",
          fontFamily: FONT,
          opacity: progressOpacity,
          letterSpacing: 4,
        }}
      >
        {currentIndex + 1} / 4
      </div>

      {/* 顶部 STEP 进度 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
          height: 6,
          background: primaryColor,
          boxShadow: `0 0 24px ${primaryColor}aa`,
        }}
      />
    </AbsoluteFill>
  );
};

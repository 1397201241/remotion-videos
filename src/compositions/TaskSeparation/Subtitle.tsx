import React from "react";
import { CUES, STYLE, eo, prog, sm } from "./lib";

// 逐字打出的字幕：整句宽度固定（未出现的字透明占位），关键词变色 + 弹一下 + 下划线扫过
export const Subtitle: React.FC<{ t: number }> = ({ t }) => {
  const cue = CUES.find((c) => t >= c.s && t < c.e);
  if (!cue) return null;
  const fadeOut = 1 - sm(prog(t, cue.e - 0.35, cue.e));
  const keyColor = STYLE.roles[cue.role ?? "key"];

  let last = -1;
  cue.chars.forEach((c, i) => {
    if (c.ct <= t) last = i;
  });
  const typing = t < cue.typedEnd;
  const cursorOn =
    !cue.slam && (typing || (t < cue.typedEnd + 1 && Math.floor(t * 2.2) % 2 === 0));

  // 峰值句：整句砸出
  const slamK = cue.slam ? eo(prog(t, cue.s, cue.s + 0.18)) : 1;
  const slamScale = cue.slam ? 1.5 - 0.5 * slamK : 1;

  const boldIdx = cue.chars.map((c, i) => (c.bold ? i : -1)).filter((i) => i >= 0);
  const kStart = boldIdx[0] ?? -1;
  const kEnd = boldIdx[boldIdx.length - 1] ?? -1;
  const sweep = cue.kt >= 0 ? eo(prog(t, cue.kt, cue.kt + 0.5)) : 0;

  const spans: React.ReactNode[] = [];
  let group: React.ReactNode[] = [];
  cue.chars.forEach((c, i) => {
    // 峰值句整句一次砸出：第一帧就满字
    const k = cue.slam ? 1 : eo(prog(t, c.ct, c.ct + 0.08));
    const colorK = c.bold ? (cue.slam ? 1 : sm(prog(t, cue.kt, cue.kt + 0.25))) : 0;
    const bump = c.bold ? 1 + 0.12 * (1 - eo(prog(t, c.ct, c.ct + 0.35))) * (k > 0 ? 1 : 0) : 1;
    const span = (
      <span
        key={i}
        style={{
          display: "inline-block",
          opacity: k,
          transform: `translateY(${4 * (1 - k)}px) scale(${bump})`,
          color: c.bold && colorK > 0.5 ? keyColor : STYLE.roles.ink,
          fontWeight: c.bold ? 900 : 700,
          position: "relative",
        }}
      >
        {c.ch}
        {i === last && cursorOn ? (
          <span
            style={{
              position: "absolute",
              right: -5,
              top: "12%",
              width: 3,
              height: "76%",
              background: STYLE.roles.ink,
            }}
          />
        ) : null}
      </span>
    );
    if (i >= kStart && i <= kEnd && kStart >= 0) {
      group.push(span);
      if (i === kEnd) {
        spans.push(
          <span key={`k${i}`} style={{ position: "relative", display: "inline-block" }}>
            {group}
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: -2,
                height: 5,
                width: `${sweep * 100}%`,
                background: keyColor,
                borderRadius: 3,
              }}
            />
          </span>
        );
        group = [];
      }
    } else spans.push(span);
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: cue.slam ? 215 : 600, // 峰值句放高一点，不挡定格的小人
        display: "flex",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          fontFamily: STYLE.font.cjk,
          fontSize: cue.slam ? 64 : 36,
          lineHeight: 1.3,
          padding: cue.slam ? "18px 44px" : "8px 26px",
          background: STYLE.card,
          boxShadow: `5px 6px 0 rgba(61,43,28,0.25)`,
          transform: `translateY(-50%) rotate(-0.6deg) scale(${slamScale})`,
          whiteSpace: "nowrap",
          color: STYLE.roles.ink,
          border: cue.slam ? `4px solid ${STYLE.roles.worse}` : "none",
        }}
      >
        {spans}
      </div>
    </div>
  );
};

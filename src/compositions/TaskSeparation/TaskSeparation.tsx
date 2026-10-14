import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles } from "remotion";
import { FPS, PEAK, clamp, eio, mix, prog, toNew, toOld } from "./lib";
import { Background, Defs, TimeCtx, Vignette, Wipe, WipeKind } from "./paper";
import { Cost, Ending, Exit, Hook, Mechanism, Naming, Outro, Peak, TitleCard } from "./Scenes";
import { Subtitle } from "./Subtitle";

// 镜头关键帧（编排时间）：[t, 缩放, 焦点x, 焦点y]，相邻关键帧之间 ease-in-out
type Key = [number, number, number, number];
const CAM: Record<string, Key[]> = {
  hook: [[0, 2.6, 885, 300], [5.2, 2.6, 885, 300], [6.3, 1, 640, 360], [10, 1.04, 680, 350]],
  title: [[10, 1, 640, 360], [18, 1.05, 640, 370]],
  naming: [[18, 1, 640, 360], [34, 1.05, 640, 340]],
  mech: [[34, 1, 640, 360], [52, 1.05, 620, 360]],
  cost: [[52, 1, 640, 360], [64.4, 1.04, 645, 330], [67.3, 1.05, 650, 330]],
  peak: [[67, 1.05, 650, 330], [PEAK, 1.1, 660, 320], [75, 1.1, 660, 320], [76.2, 1, 640, 360], [80, 1.02, 640, 350]],
  exit: [[80, 1.02, 640, 350], [98, 1.06, 640, 330]],
  end: [[98, 1.08, 640, 330], [112, 1, 640, 360]],
  outro: [[112, 1.05, 640, 360], [119, 1, 640, 360]],
};
const camAt = (keys: Key[], t: number) => {
  if (t <= keys[0][0]) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const k = eio(prog(t, keys[i - 1][0], keys[i][0]));
      return keys[i].map((v, j) => mix(keys[i - 1][j], v, k)) as Key;
    }
  }
  return keys[keys.length - 1];
};
const Cam: React.FC<{ t: number; name: string; children: React.ReactNode }> = ({ t, name, children }) => {
  const [, s, fx, fy] = camAt(CAM[name], t);
  // 峰值冲击：0.25s 内衰减的轻微震动
  const d = t >= PEAK ? clamp(1 - (t - PEAK) / 0.25) : 0;
  const sx = name === "peak" ? 7 * d * Math.sin((t - PEAK) * 90) : 0;
  const sy = name === "peak" ? 5 * d * Math.cos((t - PEAK) * 70) : 0;
  return <g transform={`translate(${640 + sx},${360 + sy}) scale(${s}) translate(${-fx},${-fy})`}>{children}</g>;
};

// 纸片转场（成片时间）：场景在编排时间里于这些点硬切，纸张完全盖住时切换
const WIPES: [number, WipeKind][] = [
  [10, "sweepL"],
  [18, "strips"],
  [34, "sweepR"],
  [52, "diag"],
  [98, "sweepL"],
  [112, "strips"],
];

// 《课题分离》：所有画面都是 t 的纯函数；tOut 为成片时间，t 为编排时间
export const TaskSeparation: React.FC = () => {
  const tOut = useCurrentFrame() / FPS;
  const t = toOld(tOut);
  const hasSfx = getStaticFiles().some((f) => f.name === "task-separation-sfx.wav");
  return (
    <TimeCtx.Provider value={t}>
      <AbsoluteFill>
        <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute" }}>
          <Defs />
          <Background t={t} />
          <Cam t={t} name="hook"><Hook t={t} /></Cam>
          <Cam t={t} name="title"><TitleCard t={t} /></Cam>
          <Cam t={t} name="naming"><Naming t={t} /></Cam>
          <Cam t={t} name="mech"><Mechanism t={t} /></Cam>
          <Cam t={t} name="cost"><Cost t={t} /></Cam>
          <Cam t={t} name="peak"><Peak t={t} /></Cam>
          <Cam t={t} name="exit"><Exit t={t} /></Cam>
          <Cam t={t} name="end"><Ending t={t} /></Cam>
          <Cam t={t} name="outro"><Outro t={t} /></Cam>
          <Vignette t={t} />
          {WIPES.map(([at, kind]) => (
            <Wipe key={at} t={tOut} at={toNew(at)} kind={kind} />
          ))}
        </svg>
        <Subtitle t={t} />
        {hasSfx ? <Audio src={staticFile("task-separation-sfx.wav")} /> : null}
      </AbsoluteFill>
    </TimeCtx.Provider>
  );
};

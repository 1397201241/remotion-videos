import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Hook } from "./Hook";
import { Crisis } from "./Crisis";
import { Steps } from "./Steps";
import { Outro } from "./Outro";

export type BrakeEmergencyProps = {
  readonly primaryColor?: string;
};

// Hook   60 frames = 2s
// Crisis 120 frames = 4s
// Steps  480 frames = 16s  (4 x 120 = 4 x 4s)
// Outro  90 frames = 3s
// Total  750 frames = 25s @ 30fps
const HOOK_FRAMES = 60;
const CRISIS_FRAMES = 120;
const STEPS_FRAMES = 480;
const OUTRO_FRAMES = 90;

export const BrakeEmergency: React.FC<BrakeEmergencyProps> = ({
  primaryColor = "#FF4444",
}) => {
  const color = primaryColor;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Sequence from={0} durationInFrames={HOOK_FRAMES} name="Hook">
        <Hook primaryColor={color} />
      </Sequence>

      <Sequence
        from={HOOK_FRAMES}
        durationInFrames={CRISIS_FRAMES}
        name="Crisis"
      >
        <Crisis primaryColor={color} />
      </Sequence>

      <Sequence
        from={HOOK_FRAMES + CRISIS_FRAMES}
        durationInFrames={STEPS_FRAMES}
        name="Steps"
      >
        <Steps primaryColor={color} />
      </Sequence>

      <Sequence
        from={HOOK_FRAMES + CRISIS_FRAMES + STEPS_FRAMES}
        durationInFrames={OUTRO_FRAMES}
        name="Outro"
      >
        <Outro primaryColor={color} />
      </Sequence>
    </AbsoluteFill>
  );
};

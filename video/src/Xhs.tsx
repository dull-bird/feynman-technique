import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "./components/Chalk";
import { GapScene, StepsScene } from "./scenes/xhs/StepsGapScene";
import { HookScene } from "./scenes/xhs/HookScene";
import { PainScene, StandardScene } from "./scenes/xhs/PainStandardScene";
import { ProductScene } from "./scenes/xhs/ProductScene";
import {
  CtaScene,
  RecordScene,
  RulesScene,
} from "./scenes/xhs/RulesRecordCtaScene";
import timeline from "./timeline.xhs.json";

// 小红书竖屏版（1080x1920）：旁白驱动，窗口由 narration/build_xhs.mjs 反推
const SCENES: Record<string, React.FC> = {
  hook: HookScene,
  pain: PainScene,
  standard: StandardScene,
  steps: StepsScene,
  gap: GapScene,
  product: ProductScene,
  rules: RulesScene,
  record: RecordScene,
  cta: CtaScene,
};

export const FeynmanXhs: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1A2E26" }}>
      <Audio src={staticFile("narration-xhs.mp3")} />
      {timeline.scenes.map((s) => {
        const Scene = SCENES[s.id];
        return (
          <Sequence
            key={s.id}
            from={s.startFrame}
            durationInFrames={s.durationFrames}
          >
            {/* 封面帧必须第 0 帧完整可见：hook 场景不做淡入 */}
            <SceneFade
              durationInFrames={s.durationFrames}
              fadeIn={s.id === "hook" ? 0 : 5}
              fadeOut={5}
            >
              <Scene />
            </SceneFade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "./components/Chalk";
import {
  Act1Scene,
  Act2Scene,
  Act3Scene,
  Act4Scene,
  Act5Scene,
} from "./scenes/xhs2/ActScenes";
import { HookScene, PretendScene } from "./scenes/xhs2/HookPretendScene";
import {
  CtaScene,
  SystemScene,
  UsageScene,
} from "./scenes/xhs2/SystemUsageCtaScene";
import {
  RevealScene,
  VerdictScene,
} from "./scenes/xhs2/VerdictRevealScene";
import timeline from "./timeline.xhs2.json";

// 小红书竖屏版 v2（1080x1920）：真实双 AI 对话主线，旁白驱动
const SCENES: Record<string, React.FC> = {
  hook: HookScene,
  pretend: PretendScene,
  act1: Act1Scene,
  act2: Act2Scene,
  act3: Act3Scene,
  act4: Act4Scene,
  act5: Act5Scene,
  verdict: VerdictScene,
  reveal: RevealScene,
  system: SystemScene,
  usage: UsageScene,
  cta: CtaScene,
};

export const FeynmanXhs: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1A2E26" }}>
      <Audio src={staticFile("narration-xhs2.mp3")} />
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

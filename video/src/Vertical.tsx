import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "./components/Chalk";
import {
  GapScene,
  MethodScene,
  PrepareScene,
  StandardScene,
} from "./scenes/vert/VertBasicScene";
import {
  DisciplineScene,
  StepsScene,
  SystemScene,
  UsageScene,
} from "./scenes/vert/VertFlowScene";
import {
  CardScene,
  EndingScene,
  GalleryScene,
  NLScene,
} from "./scenes/vert/VertRestScene";
import timeline from "./timeline.zh.json";

// 官网横版内容的原生竖屏重排（1080x1920）：旁白与 timeline.zh.json 完全复用
const SCENES: Record<string, React.FC> = {
  method: MethodScene,
  standard: StandardScene,
  steps: StepsScene,
  gap: GapScene,
  system: SystemScene,
  usage: UsageScene,
  discipline: DisciplineScene,
  prepare: PrepareScene,
  card: CardScene,
  gallery: GalleryScene,
  ending: EndingScene,
};

export const FeynmanVertical: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1A2E26" }}>
      <Audio src={staticFile("narration.mp3")} />
      {timeline.scenes.map((s) => {
        if (s.id === "nl") {
          return (
            <Sequence
              key={s.id}
              from={s.startFrame}
              durationInFrames={s.durationFrames}
            >
              <SceneFade durationInFrames={s.durationFrames}>
                <NLScene durationInFrames={s.durationFrames} />
              </SceneFade>
            </Sequence>
          );
        }
        const Scene = SCENES[s.id];
        return (
          <Sequence
            key={s.id}
            from={s.startFrame}
            durationInFrames={s.durationFrames}
          >
            {/* 封面帧必须第 0 帧完整可见：method 场景不做淡入 */}
            <SceneFade
              durationInFrames={s.durationFrames}
              fadeIn={s.id === "method" ? 0 : 5}
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

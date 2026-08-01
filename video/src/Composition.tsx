import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "./components/Chalk";
import { CoreScene } from "./scenes/v3/CoreScene";
import { DemoScene } from "./scenes/v3/DemoScene";
import { EndingScene } from "./scenes/v3/EndingScene";
import { ExportScene } from "./scenes/v3/ExportScene";
import { GalleryScene } from "./scenes/v3/GalleryScene";
import { HookScene } from "./scenes/v3/HookScene";
import { InstallScene } from "./scenes/v3/InstallScene";
import { IntroScene } from "./scenes/v3/IntroScene";
import { MemoryScene } from "./scenes/v3/MemoryScene";
import { RecordScene } from "./scenes/v3/RecordScene";
import { Workflow1Scene } from "./scenes/v3/Workflow1Scene";
import { Workflow2Scene } from "./scenes/v3/Workflow2Scene";
import { COLORS } from "./theme";
import timeline from "./timeline.json";

// 旁白驱动的场景注册表：窗口由 narration/build_v3.mjs 按实测音长反推
const SCENES: Record<string, React.FC> = {
  hook: HookScene,
  intro: IntroScene,
  core: CoreScene,
  demo: DemoScene,
  install: InstallScene,
  workflow1: Workflow1Scene,
  workflow2: Workflow2Scene,
  record: RecordScene,
  memory: MemoryScene,
  export: ExportScene,
  gallery: GalleryScene,
  ending: EndingScene,
};

export const FeynmanIntro: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board }}>
      {/* 中文配音（阿里云 NLS TTS，stanley） */}
      <Audio src={staticFile("narration.mp3")} />

      {timeline.scenes.map((s) => {
        const Scene = SCENES[s.id];
        return (
          <Sequence
            key={s.id}
            from={s.startFrame}
            durationInFrames={s.durationFrames}
          >
            <SceneFade durationInFrames={s.durationFrames}>
              <Scene />
            </SceneFade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

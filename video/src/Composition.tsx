import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "./components/Chalk";
import { StepScene } from "./scenes/StepScene";
import { EndingScene } from "./scenes/v2/EndingScene";
import { FeynmanScene } from "./scenes/v2/FeynmanScene";
import { HookScene } from "./scenes/v2/HookScene";
import { MistakesScene } from "./scenes/v2/MistakesScene";
import { OverviewScene } from "./scenes/v2/OverviewScene";
import { PracticeScene } from "./scenes/v2/PracticeScene";
import { SkillScene } from "./scenes/v2/SkillScene";
import { Step1Scene } from "./scenes/v2/Step1Scene";
import { Step2Scene } from "./scenes/v2/Step2Scene";
import { TransferScene } from "./scenes/v2/TransferScene";
import { WhyScene } from "./scenes/v2/WhyScene";
import { COLORS } from "./theme";
import timeline from "./timeline.json";

// 旁白驱动的场景注册表：窗口由 narration/build_v2.mjs 按实测音长反推
const SCENES: Record<string, React.FC> = {
  hook: HookScene,
  feynman: FeynmanScene,
  overview: OverviewScene,
  step1: Step1Scene,
  step2: Step2Scene,
  step3: () => (
    <StepScene
      num="03"
      title="识别盲区"
      sub="卡壳不是失败，是路线图"
      circleLast={2}
    />
  ),
  step4: () => (
    <StepScene num="04" title="删掉术语" sub="你妈能听懂吗？听不懂，就重写" />
  ),
  why: WhyScene,
  transfer: TransferScene,
  mistakes: MistakesScene,
  practice: PracticeScene,
  skill: SkillScene,
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

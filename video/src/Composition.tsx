import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "./components/Chalk";
import { LoopScene } from "./scenes/LoopScene";
import { InstallScene } from "./scenes/InstallScene";
import { PainScene } from "./scenes/PainScene";
import { StepScene } from "./scenes/StepScene";
import { TitleScene } from "./scenes/TitleScene";
import { UsageScene } from "./scenes/UsageScene";
import { COLORS } from "./theme";

// 30s @ 30fps = 900 帧
export const FeynmanIntro: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board }}>
      {/* 中文配音（阿里云 NLS TTS，stanley） */}
      <Audio src={staticFile("narration.mp3")} />

      {/* 0–4s 片头 */}
      <Sequence durationInFrames={120}>
        <SceneFade durationInFrames={120}>
          <TitleScene />
        </SceneFade>
      </Sequence>

      {/* 4–8s 痛点 */}
      <Sequence from={120} durationInFrames={120}>
        <SceneFade durationInFrames={120}>
          <PainScene />
        </SceneFade>
      </Sequence>

      {/* 8–13s 第一步 */}
      <Sequence from={240} durationInFrames={150}>
        <SceneFade durationInFrames={150}>
          <StepScene
            num="01"
            title="写下概念"
            sub="把学到的东西，用自己的话写在一页纸上"
          />
        </SceneFade>
      </Sequence>

      {/* 13–17s 第二步 */}
      <Sequence from={390} durationInFrames={120}>
        <SceneFade durationInFrames={120}>
          <StepScene
            num="02"
            title="讲给外行"
            sub="假装讲给一个完全不懂的人听"
          />
        </SceneFade>
      </Sequence>

      {/* 17–21s 第三步（红笔圈出盲区） */}
      <Sequence from={510} durationInFrames={120}>
        <SceneFade durationInFrames={120}>
          <StepScene
            num="03"
            title="识别盲区"
            sub="讲不清的地方，就是你的盲区"
            circleLast={2}
          />
        </SceneFade>
      </Sequence>

      {/* 21–25s 第四步 */}
      <Sequence from={630} durationInFrames={120}>
        <SceneFade durationInFrames={120}>
          <StepScene
            num="04"
            title="简化类比"
            sub="用一个生活类比，把它讲到最简单"
          />
        </SceneFade>
      </Sequence>

      {/* 25–30s 闭环 + 结尾字幕 */}
      <Sequence from={750} durationInFrames={150}>
        <SceneFade durationInFrames={150}>
          <LoopScene />
        </SceneFade>
      </Sequence>

      {/* 30–37s 安装 */}
      <Sequence from={900} durationInFrames={210}>
        <SceneFade durationInFrames={210}>
          <InstallScene />
        </SceneFade>
      </Sequence>

      {/* 37–45s 使用 + 落版 */}
      <Sequence from={1110} durationInFrames={240}>
        <SceneFade durationInFrames={240} fadeOut={14}>
          <UsageScene />
        </SceneFade>
      </Sequence>
    </AbsoluteFill>
  );
};

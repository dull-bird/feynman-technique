import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "./components/Chalk";
import { CardScene } from "./scenes/v4/CardScene";
import { DisciplineScene } from "./scenes/v4/DisciplineScene";
import { EndingScene } from "./scenes/v4/EndingScene";
import { GalleryScene } from "./scenes/v4/GalleryScene";
import { GapScene } from "./scenes/v4/GapScene";
import { MethodScene } from "./scenes/v4/MethodScene";
import { NLScene } from "./scenes/v4/NLScene";
import { PrepareScene } from "./scenes/v4/PrepareScene";
import { StandardScene } from "./scenes/v4/StandardScene";
import { StepsScene } from "./scenes/v4/StepsScene";
import { SystemScene } from "./scenes/v4/SystemScene";
import { UsageScene } from "./scenes/v4/UsageScene";
import { COLORS } from "./theme";
import timelineEn from "./timeline.en.json";
import timelineZh from "./timeline.zh.json";

// 旁白驱动的场景注册表：窗口由 narration/build_v4.mjs 按实测音长反推
const SCENES: Record<string, React.FC<{ lang: "zh" | "en" }>> = {
  method: MethodScene,
  standard: StandardScene,
  steps: StepsScene,
  gap: GapScene,
  system: SystemScene,
  usage: UsageScene,
  discipline: DisciplineScene,
  prepare: PrepareScene,
  nl: NLScene,
  card: CardScene,
  gallery: GalleryScene,
  ending: EndingScene,
};

type Timeline = typeof timelineZh;

const Video: React.FC<{ lang: "zh" | "en"; timeline: Timeline }> = ({
  lang,
  timeline,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.board }}>
      <Audio
        src={staticFile(lang === "en" ? "narration-en.mp3" : "narration.mp3")}
      />
      {timeline.scenes.map((s) => {
        const Scene = SCENES[s.id];
        return (
          <Sequence
            key={s.id}
            from={s.startFrame}
            durationInFrames={s.durationFrames}
          >
            <SceneFade durationInFrames={s.durationFrames}>
              {s.id === "nl" ? (
                // nl 窗口内部按 56% 拆分：前半真实 report，后半导出
                <NLScene lang={lang} durationInFrames={s.durationFrames} />
              ) : (
                <Scene lang={lang} />
              )}
            </SceneFade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const FeynmanIntro: React.FC = () => (
  <Video lang="zh" timeline={timelineZh} />
);

export const FeynmanIntroEn: React.FC = () => (
  <Video lang="en" timeline={timelineEn} />
);

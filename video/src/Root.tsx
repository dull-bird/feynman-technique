import { Composition } from "remotion";
import { FeynmanIntro, FeynmanIntroEn } from "./Composition";
import "./index.css";
import timelineEn from "./timeline.en.json";
import timelineZh from "./timeline.zh.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FeynmanIntro"
        component={FeynmanIntro}
        durationInFrames={timelineZh.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FeynmanIntroEn"
        component={FeynmanIntroEn}
        durationInFrames={timelineEn.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

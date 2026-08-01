import { Composition } from "remotion";
import { FeynmanIntro } from "./Composition";
import "./index.css";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FeynmanIntro"
        component={FeynmanIntro}
        durationInFrames={timeline.totalFrames}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

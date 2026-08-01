import { Composition } from "remotion";
import { FeynmanIntro } from "./Composition";
import "./index.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FeynmanIntro"
        component={FeynmanIntro}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

/** intro：产品名 + agent skill 徽章 + 灵感来源引用 */
export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const cardIn = interpolate(frame, [f(0.4), f(1.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const lineIn = interpolate(frame, [f(4.4), f(5.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const citeIn = interpolate(frame, [f(6.6), f(7.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 46,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          opacity: cardIn,
          translate: `0 ${(1 - cardIn) * 26}px`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            color: COLORS.board,
            backgroundColor: COLORS.yellow,
            borderRadius: 10,
            padding: "8px 22px",
            letterSpacing: 2,
          }}
        >
          agent skill
        </div>
        <ChalkChars
          text="费曼学习法陪练"
          delay={f(1.0)}
          stagger={5}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 138,
            color: COLORS.chalk,
            letterSpacing: 8,
          }}
        />
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 54,
          color: COLORS.chalk,
          letterSpacing: 3,
          opacity: lineIn,
        }}
      >
        把整个方法，做成了一场对话
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 32,
          color: COLORS.sage,
          letterSpacing: 2,
          borderLeft: `4px solid ${COLORS.sage}`,
          paddingLeft: 20,
          opacity: citeIn,
        }}
      >
        灵感来源：YouTube 费曼学习法视频
      </div>
    </div>
  );
};

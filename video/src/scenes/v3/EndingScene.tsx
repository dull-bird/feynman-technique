import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

/** ending：别再收藏方法了 + 行动号召 + 网址 */
export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const ctaIn = interpolate(frame, [f(1.8), f(2.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const urlIn = interpolate(frame, [f(3.4), f(4.2)], [0, 1], {
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
        gap: 40,
      }}
    >
      <ChalkChars
        text="别再收藏方法了"
        delay={f(0.3)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 64,
          color: COLORS.sage,
          letterSpacing: 4,
        }}
      />

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 100,
          color: COLORS.chalk,
          letterSpacing: 5,
          opacity: ctaIn,
          translate: `0 ${(1 - ctaIn) * 24}px`,
        }}
      >
        挑一个你自以为懂的概念，
        <span style={{ color: COLORS.yellow }}>开始讲</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: urlIn,
        }}
      >
        <svg width={72} height={72} viewBox="0 0 120 120">
          <path
            d="M 60 14 A 46 46 0 1 1 59.9 14"
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={8}
            strokeLinecap="round"
          />
          <path d="M 60 2 L 78 14 L 60 26 Z" fill={COLORS.yellow} />
        </svg>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 46,
            color: COLORS.yellow,
            letterSpacing: 2,
          }}
        >
          dull-bird.github.io/feynman-technique
        </span>
      </div>
    </div>
  );
};

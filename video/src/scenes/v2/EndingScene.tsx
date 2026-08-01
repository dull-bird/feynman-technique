import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

/** ending：金句落版 + 网址 */
export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const quoteIn = interpolate(frame, [f(3.6), f(4.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const urlIn = interpolate(frame, [f(6.4), f(7.2)], [0, 1], {
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
        gap: 42,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 52,
          color: COLORS.sage,
          letterSpacing: 3,
        }}
      >
        <ChalkChars
          text="目标不是成为房间里最聪明的人"
          delay={f(0.4)}
          stagger={3}
        />
      </div>

      {/* 小闭环图标 */}
      <svg width={110} height={110} viewBox="0 0 120 120" style={{ opacity: quoteIn }}>
        <path
          d="M 60 14 A 46 46 0 1 1 59.9 14"
          fill="none"
          stroke={COLORS.yellow}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <path d="M 60 2 L 78 14 L 60 26 Z" fill={COLORS.yellow} />
      </svg>

      <div
        style={{
          fontFamily: HAND,
          fontSize: 88,
          color: COLORS.chalk,
          letterSpacing: 6,
          opacity: quoteIn,
          translate: `0 ${(1 - quoteIn) * 22}px`,
        }}
      >
        真正的理解，才是你的竞争优势
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 44,
          color: COLORS.yellow,
          letterSpacing: 2,
          opacity: urlIn,
        }}
      >
        dull-bird.github.io/feynman-technique
      </div>
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

/** hook：收藏救不了「我以为我懂」→ 它逼你讲出来 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const strike = interpolate(frame, [f(1.6), f(2.3)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.6, 0, 0.3, 1),
  });
  const circle = interpolate(frame, [f(5.6), f(6.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.5, 0, 0.3, 1),
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
        gap: 56,
      }}
    >
      <div
        style={{
          position: "relative",
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 76,
          color: COLORS.sage,
          letterSpacing: 4,
          opacity: interpolate(frame, [f(0.4), f(1.0)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          padding: "0 14px",
        }}
    >
        收藏的学习方法再多
        <svg
          width={640}
          height={36}
          viewBox="0 0 640 36"
          style={{
            position: "absolute",
            left: -10,
            top: "50%",
            marginTop: -16,
            rotate: "-2deg",
          }}
        >
          <path
            d="M 8 20 Q 200 10 380 18 T 632 16"
            fill="none"
            stroke={COLORS.red}
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - strike}
          />
        </svg>
      </div>

      <ChalkChars
        text="也救不了「我以为我懂」"
        delay={f(2.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 104,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />

      <div
        style={{
          position: "relative",
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 88,
          color: COLORS.yellow,
          letterSpacing: 4,
          opacity: interpolate(frame, [f(4.4), f(5.0)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          padding: "0 24px",
        }}
      >
        它逼你把知识讲出来
        <svg
          width={320}
          height={150}
          viewBox="0 0 320 150"
          style={{
            position: "absolute",
            right: -60,
            top: "50%",
            marginTop: -78,
            rotate: "-3deg",
            pointerEvents: "none",
          }}
        >
          <path
            d="M 160 12 C 246 8 304 40 302 76 C 300 116 232 140 154 138 C 80 136 16 112 16 72 C 16 34 84 10 168 12"
            fill="none"
            stroke={COLORS.red}
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - circle}
          />
        </svg>
      </div>
    </div>
  );
};

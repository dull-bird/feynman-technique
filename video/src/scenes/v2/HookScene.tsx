import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const ILLUSIONS = ["划重点", "刷教程", "边看边点头"];

/** hook：你并没有真正理解——三个幻觉被红笔划掉，最后「脑子一片空白」 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30); // 秒→帧

  const dim = interpolate(frame, [f(7.6), f(8.4)], [1, 0.3], {
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
        gap: 72,
      }}
    >
      <ChalkChars
        text="你只是自以为懂了"
        delay={f(0.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 104,
          color: COLORS.chalk,
          letterSpacing: 6,
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 110,
          opacity: dim,
        }}
      >
        {ILLUSIONS.map((text, i) => {
          const strike = interpolate(
            frame,
            [f(3.2 + i * 1.1), f(3.9 + i * 1.1)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.6, 0, 0.3, 1),
            },
          );
          const opacity = interpolate(
            frame,
            [f(2.4 + i * 0.5), f(2.9 + i * 0.5)],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={text}
              style={{
                position: "relative",
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 72,
                color: COLORS.chalk,
                letterSpacing: 4,
                opacity,
                padding: "0 12px",
              }}
            >
              {text}
              <svg
                width={360}
                height={36}
                viewBox="0 0 360 36"
                style={{
                  position: "absolute",
                  left: -8,
                  top: "50%",
                  marginTop: -16,
                  rotate: "-2deg",
                }}
              >
                <path
                  d="M 8 20 Q 120 10 210 18 T 352 16"
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
          );
        })}
      </div>

      <ChalkChars
        text="要讲给别人听时，脑子一片空白"
        delay={f(8.6)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 88,
          color: COLORS.yellow,
          letterSpacing: 4,
        }}
      />
    </div>
  );
};

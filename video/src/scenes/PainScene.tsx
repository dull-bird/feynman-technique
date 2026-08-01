import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../components/Chalk";
import { COLORS, SERIF } from "../theme";

/** 4–8s：痛点场景——划重点、反复阅读被红笔划掉，出现「熟悉感 ≠ 理解」 */
export const PainScene: React.FC = () => {
  const frame = useCurrentFrame();

  const items = ["划重点", "反复阅读"];

  const dim = interpolate(frame, [78, 92], [1, 0.3], {
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
        gap: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 44,
          opacity: dim,
        }}
      >
        {items.map((text, i) => {
          const strike = interpolate(
            frame,
            [34 + i * 16, 52 + i * 16],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.6, 0, 0.3, 1),
            },
          );
          const opacity = interpolate(frame, [4 + i * 10, 18 + i * 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={text}
              style={{
                position: "relative",
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 96,
                color: COLORS.chalk,
                letterSpacing: 6,
                opacity,
                padding: "0 16px",
              }}
            >
              {text}
              <svg
                width={440}
                height={40}
                viewBox="0 0 440 40"
                style={{
                  position: "absolute",
                  left: -10,
                  top: "50%",
                  marginTop: -18,
                  rotate: "-2deg",
                }}
              >
                <path
                  d="M 8 22 Q 140 12 250 20 T 432 18"
                  fill="none"
                  stroke={COLORS.red}
                  strokeWidth={8}
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
        text="熟悉感 ≠ 理解"
        delay={84}
        stagger={5}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 110,
          color: COLORS.yellow,
          letterSpacing: 6,
        }}
      />
    </div>
  );
};

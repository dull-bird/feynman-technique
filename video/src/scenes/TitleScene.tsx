import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../components/Chalk";
import { COLORS, HAND, SERIF } from "../theme";

/** 0–4s：片头标题 */
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  // 黄色粉笔下划线，从左向右画出
  const underline = interpolate(frame, [28, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const subOpacity = interpolate(frame, [48, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [48, 66], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
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
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: 14,
          color: COLORS.sage,
          opacity: interpolate(frame, [6, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        THE FEYNMAN TECHNIQUE
      </div>

      <div style={{ position: "relative", padding: "0 20px" }}>
        <ChalkChars
          text="费曼学习法"
          delay={8}
          stagger={7}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 168,
            color: COLORS.chalk,
            letterSpacing: 8,
          }}
        />
        <svg
          width={760}
          height={24}
          viewBox="0 0 760 24"
          style={{ position: "absolute", left: 20, bottom: -18 }}
        >
          <path
            d="M 6 14 Q 190 6 380 13 T 754 11"
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - underline}
          />
        </svg>
      </div>

      <div
        style={{
          fontFamily: HAND,
          fontSize: 56,
          color: COLORS.yellow,
          opacity: subOpacity,
          translate: `0 ${subY}px`,
        }}
      >
        把「我以为我懂」变成「我知道我懂」
      </div>
    </div>
  );
};

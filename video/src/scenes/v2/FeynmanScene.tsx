import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, SERIF } from "../../theme";

/** feynman：人物介绍——诺贝尔奖徽章 + 奶奶测试金句 */
export const FeynmanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const quoteIn = interpolate(frame, [f(3.6), f(4.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const subIn = interpolate(frame, [f(8.6), f(9.2)], [0, 1], {
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
        gap: 44,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <ChalkChars
          text="理查德·费曼"
          delay={f(0.4)}
          stagger={5}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 118,
            color: COLORS.chalk,
            letterSpacing: 6,
          }}
        />
        <div
          style={{
            fontFamily: HAND,
            fontSize: 46,
            color: COLORS.yellow,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 16,
            padding: "10px 22px",
            rotate: "-3deg",
            opacity: interpolate(frame, [f(2.0), f(2.6)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          1965 诺贝尔奖
        </div>
      </div>

      <div
        style={{
          fontFamily: HAND,
          fontSize: 72,
          color: COLORS.yellow,
          letterSpacing: 4,
          opacity: quoteIn,
          translate: `0 ${(1 - quoteIn) * 24}px`,
        }}
      >
        「我能不能解释到让奶奶都听懂？」
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 50,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: subIn,
        }}
      >
        真正的掌握，是剥掉所有杂音，直到真相显而易见
      </div>
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const T = {
  zh: { items: ["划重点", "反复阅读"], verdict: "熟悉感 ≠ 理解" },
  en: { items: ["Highlighting", "Re-reading"], verdict: "Familiarity ≠ Understanding" },
};

/** standard：熟悉感 ≠ 理解（两个幻觉被划掉） */
export const StandardScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];

  const dim = interpolate(frame, [f(7.2), f(8.0)], [1, 0.3], {
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
          gap: 40,
          opacity: dim,
        }}
      >
        {t.items.map((text, i) => {
          const strike = interpolate(
            frame,
            [f(3.0 + i * 1.4), f(3.7 + i * 1.4)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.6, 0, 0.3, 1),
            },
          );
          const w = text.length * (lang === "zh" ? 88 : 52) + 60;
          return (
            <div
              key={text}
              style={{
                position: "relative",
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 84,
                color: COLORS.chalk,
                letterSpacing: lang === "zh" ? 6 : 2,
                opacity: interpolate(
                  frame,
                  [f(1.0 + i * 0.8), f(1.6 + i * 0.8)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                ),
                padding: "0 16px",
              }}
            >
              {text}
              <svg
                width={w}
                height={36}
                viewBox={`0 0 ${w} 36`}
                style={{
                  position: "absolute",
                  left: -10,
                  top: "50%",
                  marginTop: -16,
                  rotate: "-2deg",
                }}
              >
                <path
                  d={`M 8 20 Q ${w * 0.35} 10 ${w * 0.6} 18 T ${w - 8} 16`}
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
        text={t.verdict}
        delay={f(8.4)}
        stagger={lang === "zh" ? 5 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 110 : 84,
          color: COLORS.yellow,
          letterSpacing: lang === "zh" ? 6 : 2,
        }}
      />
    </div>
  );
};

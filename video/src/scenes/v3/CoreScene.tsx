import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const RULES = ["一次只追一个问题", "每个问题引用你的原话", "卡壳的地方 = 盲区"];

/** core：你讲，它问 + 三条规则 */
export const CoreScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <ChalkChars
          text="你讲"
          delay={f(0.5)}
          stagger={8}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 168,
            color: COLORS.chalk,
            letterSpacing: 6,
          }}
        />
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 96,
            color: COLORS.yellow,
            opacity: interpolate(frame, [f(1.6), f(2.2)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          ·
        </div>
        <ChalkChars
          text="它问"
          delay={f(2.2)}
          stagger={8}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 168,
            color: COLORS.yellow,
            letterSpacing: 6,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 44 }}>
        {RULES.map((r, i) => {
          const o = interpolate(
            frame,
            [f(5.2 + i * 1.8), f(6.0 + i * 1.8)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          );
          return (
            <div
              key={r}
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 42,
                color: COLORS.chalk,
                border: `2px solid ${COLORS.sage}66`,
                backgroundColor: "#122119",
                borderRadius: 16,
                padding: "20px 34px",
                letterSpacing: 2,
                opacity: o,
                translate: `0 ${(1 - o) * 20}px`,
              }}
            >
              {r}
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 44,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(11.6), f(12.4)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        AI 扮演零基础但逻辑严谨的听众
      </div>
    </div>
  );
};

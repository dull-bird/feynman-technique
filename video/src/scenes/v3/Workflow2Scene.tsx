import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const DOCS = ["方案评审", "设计文档"];

/** workflow2：评审/文档之后，让它追问你 */
export const Workflow2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
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
        gap: 52,
      }}
    >
      <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        {DOCS.map((t, i) => (
          <div
            key={t}
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 52,
              color: COLORS.chalk,
              border: `2px solid ${COLORS.sage}66`,
              backgroundColor: "#122119",
              borderRadius: 16,
              padding: "20px 36px",
              letterSpacing: 3,
              opacity: fade(0.6 + i * 0.6, 1.2 + i * 0.6),
            }}
          >
            {t}
          </div>
        ))}
        <div
          style={{
            fontFamily: KAITI,
            fontSize: 44,
            color: COLORS.sage,
            opacity: fade(1.8, 2.4),
          }}
        >
          之后——
        </div>
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 56,
          color: COLORS.chalk,
          border: `3px solid ${COLORS.yellow}`,
          borderRadius: 22,
          borderBottomLeftRadius: 6,
          padding: "26px 44px",
          letterSpacing: 3,
          opacity: fade(2.8, 3.6),
          translate: `0 ${(1 - fade(2.8, 3.6)) * 24}px`,
        }}
      >
        为什么这么设计？取舍是什么？
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 36,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 72,
          letterSpacing: 4,
          opacity: fade(5.6, 6.4),
        }}
      >
        <span style={{ color: COLORS.sage, textDecoration: "line-through" }}>
          差不多懂了
        </span>
        <span style={{ color: COLORS.yellow }}>→</span>
        <ChalkChars
          text="真的讲清楚了"
          delay={f(6.6)}
          stagger={4}
          style={{ color: COLORS.yellow }}
        />
      </div>
    </div>
  );
};

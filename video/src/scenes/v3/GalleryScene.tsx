import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const DOMAINS = [
  { name: "金融", score: "4", note: "通过" },
  { name: "AI", score: "2 → 4", note: "回填" },
  { name: "数学", score: "4", note: "通过" },
  { name: "物理", score: "2", note: "翻车" },
  { name: "心理学", score: "4", note: "通过" },
];

/** gallery：五个领域的真实对话卡片 */
export const GalleryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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
        gap: 50,
      }}
    >
      <ChalkChars
        text="五个领域的真实对话"
        delay={f(0.3)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 92,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />

      <div style={{ display: "flex", gap: 32 }}>
        {DOMAINS.map((d, i) => {
          const s = spring({
            frame: frame - f(2.0) - i * 8,
            fps,
            config: { damping: 15, stiffness: 160, mass: 0.7 },
          });
          const failed = d.note === "翻车";
          return (
            <div
              key={d.name}
              style={{
                width: 300,
                borderRadius: 18,
                backgroundColor: "#122119",
                border: `2px solid ${failed ? COLORS.red : COLORS.sage}66`,
                padding: "28px 26px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 26}px`,
              }}
            >
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 48,
                  color: COLORS.chalk,
                  letterSpacing: 3,
                }}
              >
                {d.name}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 46,
                  color: failed ? COLORS.red : COLORS.yellow,
                }}
              >
                {d.score}
              </div>
              <div
                style={{
                  fontFamily: KAITI,
                  fontSize: 30,
                  color: COLORS.sage,
                }}
              >
                {d.note}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 44,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(5.8), f(6.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        有通过的，也有当场翻车的——点开就能读全程
      </div>
    </div>
  );
};

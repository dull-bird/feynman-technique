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

const T = {
  zh: {
    head: "五个领域的真实对话",
    domains: [
      { name: "金融", score: "4", note: "通过" },
      { name: "AI", score: "2 → 4", note: "回填" },
      { name: "数学", score: "4", note: "通过" },
      { name: "物理", score: "2", note: "翻车" },
      { name: "心理学", score: "4", note: "通过" },
    ],
    foot: "有通过的，也有当场翻车的",
  },
  en: {
    head: "Real conversations across five fields",
    domains: [
      { name: "Finance", score: "4", note: "Pass" },
      { name: "AI", score: "2 → 4", note: "Retook" },
      { name: "Math", score: "4", note: "Pass" },
      { name: "Physics", score: "2", note: "Crashed" },
      { name: "Psychology", score: "4", note: "Pass" },
    ],
    foot: "Some pass. Some crash and burn.",
  },
};

/** gallery：五个领域的真实对话卡片 */
export const GalleryScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];

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
        text={t.head}
        delay={f(0.4)}
        stagger={lang === "zh" ? 4 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 92 : 72,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <div style={{ display: "flex", gap: 32 }}>
        {t.domains.map((d, i) => {
          const s = spring({
            frame: frame - f(2.2) - i * 8,
            fps,
            config: { damping: 15, stiffness: 160, mass: 0.7 },
          });
          const failed = d.note === "翻车" || d.note === "Crashed";
          return (
            <div
              key={d.name}
              style={{
                width: 300,
                borderRadius: 18,
                backgroundColor: "#122119",
                border: `2px solid ${failed ? COLORS.red : COLORS.sage}66`,
                padding: "28px 20px",
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
                  fontSize: lang === "zh" ? 48 : 36,
                  color: COLORS.chalk,
                  letterSpacing: 2,
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
              <div style={{ fontFamily: KAITI, fontSize: 30, color: COLORS.sage }}>
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
          letterSpacing: 2,
          opacity: interpolate(frame, [f(6.0), f(6.8)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {t.foot}
      </div>
    </div>
  );
};

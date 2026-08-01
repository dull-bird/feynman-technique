import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const T = {
  zh: {
    head: "所有能力，自然语言发起",
    q1: "「我最近有没有进步？」",
    a1: "评分走势",
    q2: "「导出到 Obsidian」",
    a2: "学习笔记",
    foot: "不需要会编程",
  },
  en: {
    head: "Everything starts in plain language",
    q1: "\"Have I been improving?\"",
    a1: "Score trend",
    q2: "\"Export to Obsidian\"",
    a2: "Study notes",
    foot: "No programming required",
  },
};

/** nl：自然语言发起一切 */
export const NLScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];
  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  const rows = [
    { q: t.q1, a: t.a1, at: 2.2 },
    { q: t.q2, a: t.a2, at: 5.4 },
  ];

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

      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {rows.map((r) => (
          <div
            key={r.q}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              opacity: fade(r.at, r.at + 0.8),
            }}
          >
            <span
              style={{
                fontFamily: KAITI,
                fontSize: lang === "zh" ? 50 : 44,
                color: COLORS.chalk,
                backgroundColor: "#24453A",
                borderRadius: 18,
                padding: "18px 32px",
              }}
            >
              {r.q}
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 48,
                color: COLORS.yellow,
              }}
            >
              →
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: lang === "zh" ? 52 : 44,
                color: COLORS.yellow,
                border: `3px solid ${COLORS.yellow}`,
                borderRadius: 18,
                padding: "16px 32px",
              }}
            >
              {r.a}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 52,
          color: COLORS.sage,
          letterSpacing: 4,
          opacity: fade(8.6, 9.4),
        }}
      >
        {t.foot}
      </div>
    </div>
  );
};

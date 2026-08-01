import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const T = {
  zh: {
    title: "复习卡",
    rows: ["你的精炼解释", "一个类比", "三道迁移小测"],
    head: "每次通过，沉淀成复习卡",
  },
  en: {
    title: "Review Card",
    rows: ["Your polished explanation", "One analogy", "Three transfer quizzes"],
    head: "Every pass becomes a review card",
  },
};

/** card：复习卡 */
export const CardScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];

  const cardIn = spring({
    frame: frame - f(1.4),
    fps,
    config: { damping: 15, stiffness: 140, mass: 0.8 },
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

      <div
        style={{
          width: 860,
          borderRadius: 22,
          backgroundColor: "#F7F3E9",
          padding: "40px 52px",
          rotate: "-1.5deg",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          opacity: Math.min(1, Math.max(0, cardIn * 1.5)),
          scale: 0.7 + 0.3 * cardIn,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 56,
            color: COLORS.board,
            letterSpacing: 4,
            borderBottom: `3px solid ${COLORS.board}22`,
            paddingBottom: 18,
          }}
        >
          {t.title}
        </div>
        {t.rows.map((r, i) => (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 20,
              opacity: interpolate(
                frame,
                [f(2.6 + i * 0.9), f(3.2 + i * 0.9)],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 40,
                color: COLORS.red,
              }}
            >
              {`0${i + 1}`}
            </span>
            <span
              style={{
                fontFamily: KAITI,
                fontSize: 44,
                color: COLORS.board,
                letterSpacing: 2,
              }}
            >
              {r}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

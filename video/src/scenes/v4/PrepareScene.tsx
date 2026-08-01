import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const T = {
  zh: {
    head: "开场前，它先做功课",
    c1: "搜索查证新概念",
    c2: "翻你的历史记录",
    foot: "旧盲区在哪，这次就重点追问哪",
  },
  en: {
    head: "Before each session, it does its homework",
    c1: "Researches the new concept",
    c2: "Reviews your history",
    foot: "Old gaps get the hardest questions",
  },
};

/** prepare：开场前的功课 */
export const PrepareScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];
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
      <ChalkChars
        text={t.head}
        delay={f(0.4)}
        stagger={lang === "zh" ? 4 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 96 : 72,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <div style={{ display: "flex", gap: 48 }}>
        {[t.c1, t.c2].map((c, i) => (
          <div
            key={c}
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: lang === "zh" ? 52 : 42,
              color: COLORS.chalk,
              border: `2px solid ${COLORS.sage}66`,
              backgroundColor: "#122119",
              borderRadius: 18,
              padding: "24px 40px",
              letterSpacing: 2,
              opacity: fade(2.2 + i * 1.2, 3.0 + i * 1.2),
              translate: `0 ${(1 - fade(2.2 + i * 1.2, 3.0 + i * 1.2)) * 22}px`,
            }}
          >
            {c}
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 50,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: fade(5.2, 6.0),
        }}
      >
        {t.foot}
      </div>
    </div>
  );
};

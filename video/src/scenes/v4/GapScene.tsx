import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const T = {
  zh: {
    head: "方法很好，执行很难",
    q: "你上哪找一个随时待命、\n什么都不懂、还穷追不舍的听众？",
  },
  en: {
    head: "Great method, hard to practice",
    q: "Where do you find a listener who's always available,\nknows nothing, and never stops asking?",
  },
};

/** gap：执行之难 */
export const GapScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
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
        gap: 56,
      }}
    >
      <ChalkChars
        text={t.head}
        delay={f(0.4)}
        stagger={lang === "zh" ? 4 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 104 : 84,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />
      <div
        style={{
          fontFamily: KAITI,
          fontSize: lang === "zh" ? 52 : 44,
          color: COLORS.yellow,
          letterSpacing: 2,
          textAlign: "center",
          lineHeight: 1.6,
          whiteSpace: "pre-line",
          opacity: interpolate(frame, [f(2.4), f(3.2)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {t.q}
      </div>
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { BrandMark } from "../../components/BrandMark";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const T = {
  zh: {
    title: "费曼学习法",
    sub: "用「讲出来」检验「真懂」",
    note: "并非费曼本人发明，后人从他的教学里提炼",
    cite: "灵感来源：YouTube「费曼学习法」视频（链接见官网）",
  },
  en: {
    title: "The Feynman Technique",
    sub: "Test real understanding by explaining out loud",
    note: "Not invented by Feynman — distilled from how he taught",
    cite: "Inspired by the YouTube video (link on our site)",
  },
};

/** method：开场——logo + 方法名 + 来源标注 */
export const MethodScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
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
        gap: 38,
      }}
    >
      <div style={{ opacity: fade(0.3, 0.9) }}>
        <BrandMark size={110} />
      </div>

      <ChalkChars
        text={t.title}
        delay={f(0.8)}
        stagger={lang === "zh" ? 6 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 150 : 96,
          color: COLORS.chalk,
          letterSpacing: lang === "zh" ? 10 : 3,
        }}
      />

      <div
        style={{
          fontFamily: KAITI,
          fontSize: lang === "zh" ? 56 : 46,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: fade(3.2, 4.0),
        }}
      >
        {t.sub}
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 38,
          color: COLORS.chalk,
          letterSpacing: 2,
          opacity: fade(5.4, 6.2),
        }}
      >
        {t.note}
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 30,
          color: COLORS.sage,
          letterSpacing: 2,
          borderLeft: `4px solid ${COLORS.sage}`,
          paddingLeft: 18,
          opacity: fade(7.6, 8.4),
        }}
      >
        {t.cite}
      </div>
    </div>
  );
};

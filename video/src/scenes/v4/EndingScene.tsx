import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { BrandMark } from "../../components/BrandMark";
import { COLORS, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

const T = {
  zh: { cta: "挑一个你自以为懂的概念，开始讲" },
  en: { cta: "Pick a concept you think you know — start explaining" },
};

/** ending：logo + npx 命令 + CTA + 网址 */
export const EndingScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];

  const cmd = "$ npx skills add dull-bird/feynman-technique -g";
  const typed = Math.round(
    interpolate(frame, [f(1.2), f(2.8)], [0, cmd.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

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
      <div
        style={{
          opacity: interpolate(frame, [f(0.3), f(0.9)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <BrandMark size={100} />
      </div>

      <div
        style={{
          borderRadius: 16,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          padding: "22px 36px",
          fontFamily: MONO,
          fontSize: 36,
          whiteSpace: "pre",
        }}
      >
        <span style={{ color: COLORS.yellow }}>$</span>
        <span style={{ color: COLORS.chalk }}>{cmd.slice(1, typed)}</span>
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 84 : 60,
          color: COLORS.chalk,
          letterSpacing: lang === "zh" ? 4 : 1,
          textAlign: "center",
          opacity: interpolate(frame, [f(3.0), f(3.8)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {t.cta}
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 42,
          color: COLORS.yellow,
          letterSpacing: 2,
          opacity: interpolate(frame, [f(4.0), f(4.8)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        dull-bird.github.io/feynman-technique
      </div>
    </div>
  );
};

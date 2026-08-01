import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const T = {
  zh: {
    youSay: "你讲",
    itAsks: "它问",
    concept: "复利",
    question: "银行为什么平白给你钱？",
    pass: "讲透了 → 宣布通过",
    fail: "讲不透 → 指出盲区",
  },
  en: {
    youSay: "You explain",
    itAsks: "It asks",
    concept: "Compound interest",
    question: "Why would a bank just hand you money?",
    pass: "Nail it → declared a pass",
    fail: "Fall short → gap exposed",
  },
};

/** usage：你讲它问 + 复利示例 + 两种结局 */
export const UsageScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
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
        gap: 42,
        padding: "0 160px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 32 }}>
        <ChalkChars
          text={t.youSay}
          delay={f(0.4)}
          stagger={lang === "zh" ? 8 : 2}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 118,
            color: COLORS.chalk,
            letterSpacing: 5,
          }}
        />
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 72,
            color: COLORS.yellow,
          }}
        >
          ·
        </span>
        <ChalkChars
          text={t.itAsks}
          delay={f(1.4)}
          stagger={lang === "zh" ? 8 : 2}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 118,
            color: COLORS.yellow,
            letterSpacing: 5,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: fade(3.2, 4.0),
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 46,
            color: COLORS.chalk,
            backgroundColor: "#24453A",
            borderRadius: 16,
            padding: "16px 30px",
          }}
        >
          {t.concept}
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 52,
            color: COLORS.yellow,
          }}
        >
          →
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 46,
            color: COLORS.chalk,
            border: `2px solid ${COLORS.yellow}`,
            borderRadius: 16,
            padding: "16px 30px",
          }}
        >
          {t.question}
        </span>
      </div>

      <div style={{ display: "flex", gap: 44, marginTop: 10 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 42,
            color: COLORS.chalk,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 16,
            padding: "16px 30px",
            opacity: fade(6.4, 7.2),
          }}
        >
          {t.pass}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 42,
            color: COLORS.chalk,
            border: `3px solid ${COLORS.red}`,
            borderRadius: 16,
            padding: "16px 30px",
            opacity: fade(7.6, 8.4),
          }}
        >
          {t.fail}
        </div>
      </div>
    </div>
  );
};

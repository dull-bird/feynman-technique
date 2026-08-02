import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";
import { ReportPanel } from "./RecordScene";

const T = {
  zh: {
    head: "所有能力，自然语言发起",
    q1: "「我最近有没有进步？」",
    q2: "「导出到 Obsidian」",
    a2: "学习笔记",
    foot: "不需要会编程",
  },
  en: {
    head: "Everything starts in plain language",
    q1: "\"Have I been improving?\"",
    q2: "\"Export to Obsidian\"",
    a2: "Study notes",
    foot: "No programming required",
  },
};

/**
 * nl：窗口拆成两半——前半「我最近有没有进步？」+ 真实 report 面板（RecordScene 数据），
 * 后半「导出到 Obsidian」→ 学习笔记。旁白不变，视觉时间轴按 durationInFrames 56% 拆分。
 */
export const NLScene: React.FC<{
  lang: "zh" | "en";
  durationInFrames?: number;
}> = ({ lang, durationInFrames = 420 }) => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];
  const split = Math.round(durationInFrames * 0.56);

  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  const firstOut = interpolate(frame, [split - 12, split], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const secondIn = interpolate(frame, [split + 2, split + 14], [0, 1], {
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
        gap: 40,
      }}
    >
      <ChalkChars
        text={t.head}
        delay={f(0.4)}
        stagger={lang === "zh" ? 4 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 84 : 64,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <div style={{ position: "relative", width: 1920, height: 720 }}>
        {/* 前半：提问 + 真实 report */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
            opacity: firstOut,
          }}
        >
          <div
            style={{
              fontFamily: KAITI,
              fontSize: lang === "zh" ? 48 : 42,
              color: COLORS.chalk,
              backgroundColor: "#24453A",
              borderRadius: 18,
              padding: "16px 32px",
              opacity: fade(0.8, 1.5),
            }}
          >
            {t.q1}
          </div>
          <ReportPanel lang={lang} delaySec={1.8} />
        </div>

        {/* 后半：导出到 Obsidian */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            opacity: secondIn,
            translate: `0 ${(1 - secondIn) * 24}px`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
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
              {t.q2}
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
              {t.a2}
            </span>
          </div>

          <div
            style={{
              fontFamily: KAITI,
              fontSize: 52,
              color: COLORS.sage,
              letterSpacing: 4,
              opacity: interpolate(frame, [split + 34, split + 46], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {t.foot}
          </div>
        </div>
      </div>
    </div>
  );
};

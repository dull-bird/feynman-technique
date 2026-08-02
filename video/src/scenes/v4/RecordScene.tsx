import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

type Line = { text: string; color: string; highlight?: boolean };

const T: Record<"zh" | "en", { title: string; lines: Line[] }> = {
  zh: {
    title: "每次对话，自动落账",
    lines: [
      { text: "$ python3 scripts/feynman_log.py report", color: COLORS.yellow },
      { text: "== 总体 ==", color: COLORS.sage },
      {
        text: "对话次数：12 | 通过：8 | 通过率：67% | 平均评分：3.3/5",
        color: COLORS.chalk,
      },
      { text: "== 各概念 ==", color: COLORS.sage },
      {
        text: "- 注意力机制（Transformer）：2 次，评分 2 → 4，已掌握 ✅",
        color: COLORS.chalk,
        highlight: true,
      },
      { text: "  2026-08-01 18:45 | 7 轮 | 未通过 | 2/5", color: COLORS.sage },
      { text: "  2026-08-01 18:46 | 6 轮 | 通过   | 4/5", color: COLORS.sage },
      { text: "- 熵：1 次，评分 2，尚未通过", color: COLORS.red },
      {
        text: "- 贝叶斯定理 / 指数基金 / 认知失调：各 1 次，评分 4，已掌握 ✅",
        color: COLORS.chalk,
      },
    ],
  },
  en: {
    title: "Every conversation, automatically logged",
    lines: [
      { text: "$ python3 scripts/feynman_log.py report", color: COLORS.yellow },
      { text: "== Overall ==", color: COLORS.sage },
      {
        text: "Sessions: 12 | Passed: 8 | Pass rate: 67% | Avg score: 3.3/5",
        color: COLORS.chalk,
      },
      { text: "== By concept ==", color: COLORS.sage },
      {
        text: "- Attention Mechanism: 2 sessions, score 2 → 4, mastered ✅",
        color: COLORS.chalk,
        highlight: true,
      },
      { text: "  2026-08-01 18:45 | 7 rounds | failed | 2/5", color: COLORS.sage },
      { text: "  2026-08-01 18:46 | 6 rounds | passed | 4/5", color: COLORS.sage },
      { text: "- Entropy: 1 session, score 2, not passed", color: COLORS.red },
      {
        text: "- Bayes' Theorem / Index Funds / Cognitive Dissonance: 4 ✅",
        color: COLORS.chalk,
      },
    ],
  },
};

/** 终端报告面板（可复用，delaySec 控制首行出现时间） */
export const ReportPanel: React.FC<{
  lang: "zh" | "en";
  delaySec?: number;
}> = ({ lang, delaySec = 0.6 }) => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];

  const cardIn = interpolate(frame, [f(delaySec), f(delaySec + 0.8)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        width: 1520,
        borderRadius: 18,
        backgroundColor: "#122119",
        border: `2px solid ${COLORS.sage}44`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        padding: "30px 48px",
        fontFamily: MONO,
        fontSize: 30,
        lineHeight: 1.6,
        whiteSpace: "pre",
        opacity: cardIn,
        translate: `0 ${(1 - cardIn) * 24}px`,
      }}
    >
      {t.lines.map((l, i) => {
        const o = interpolate(
          frame,
          [f(delaySec + 1.0 + i * 0.5), f(delaySec + 1.5 + i * 0.5)],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              color: l.color,
              opacity: o,
              backgroundColor: l.highlight ? `${COLORS.yellow}22` : undefined,
              borderLeft: l.highlight
                ? `4px solid ${COLORS.yellow}`
                : "4px solid transparent",
              paddingLeft: 12,
              marginLeft: -16,
              borderRadius: 4,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
};

export const RecordScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
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
        gap: 44,
      }}
    >
      <ChalkChars
        text={t.title}
        delay={f(0.3)}
        stagger={lang === "zh" ? 4 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 92 : 64,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <ReportPanel lang={lang} delaySec={0.6} />
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

const LOG_LINES: { text: string; color: string }[] = [
  { text: "$ feynman_log.py report", color: COLORS.yellow },
  { text: "== 总体 ==", color: COLORS.sage },
  { text: "对话次数：6 | 通过：4 | 通过率：67% | 平均评分：3.3/5", color: COLORS.chalk },
  { text: "== 各概念 ==", color: COLORS.sage },
  { text: "- 注意力机制：2 次，评分 2 → 4，已掌握 ✅", color: COLORS.chalk },
  { text: "- 认知失调：1 次，评分 4，已掌握 ✅", color: COLORS.chalk },
  { text: "- 熵：1 次，评分 2，尚未通过", color: COLORS.red },
];

/** record：终端展示真实的 report 输出 */
export const RecordScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const cardIn = interpolate(frame, [f(0.6), f(1.4)], [0, 1], {
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
        gap: 44,
      }}
    >
      <ChalkChars
        text="每次对话，自动落账"
        delay={f(0.3)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 92,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />

      <div
        style={{
          width: 1420,
          borderRadius: 18,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          padding: "34px 48px",
          fontFamily: MONO,
          fontSize: 32,
          lineHeight: 1.75,
          whiteSpace: "pre",
          opacity: cardIn,
          translate: `0 ${(1 - cardIn) * 24}px`,
        }}
      >
        {LOG_LINES.map((l, i) => {
          const o = interpolate(
            frame,
            [f(1.6 + i * 0.7), f(2.1 + i * 0.7)],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div key={i} style={{ color: l.color, opacity: o }}>
              {l.text}
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 52,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(7.6), f(8.4)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        评分走势，就是理解的增长曲线
      </div>
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame } from "../xhs/HookScene";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

/** system：终端录屏——真实输出 A/B/C 逐行打出 */
const LINES: { text: string; color: string; highlight?: boolean }[] = [
  { text: "== 会话已开场：复利（准备文件 8 行已验收） ==", color: COLORS.yellow },
  { text: "== 准备清单 == 1.研究 2.拆解 3.定标", color: COLORS.chalk },
  {
    text: "== 历史联动 == 已掌握（可出迁移题）：Attention Mechanism、Bayes' Theorem…",
    color: COLORS.sage,
  },
  { text: "== 会话状态 == 复利 | 第 1/10 轮 | 盲区命中：causal-gap", color: COLORS.chalk },
  { text: "复利：1 次，评分 5，已掌握 ✅", color: COLORS.chalk, highlight: true },
  { text: "2026-08-02 23:04 | 8 轮 | 通过 | 5/5", color: COLORS.chalk, highlight: true },
  { text: "备注：[双agent实测]…完整接住了迁移检验", color: COLORS.sage },
];

export const SystemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  return (
    <BoardFrame>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 76,
          color: COLORS.chalk,
          letterSpacing: 4,
          marginBottom: 40,
          opacity: interpolate(frame, [f(0.3), f(0.9)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        不是聊天记录，是一整套系统
      </div>

      <div
        style={{
          width: 960,
          borderRadius: 16,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          padding: "28px 36px",
          fontFamily: MONO,
          fontSize: 27,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          opacity: interpolate(frame, [f(1.0), f(1.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {LINES.map((l, i) => {
          const o = interpolate(
            frame,
            [f(1.8 + i * 0.55), f(2.3 + i * 0.55)],
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
                paddingLeft: 10,
              }}
            >
              {l.text}
            </div>
          );
        })}
      </div>
    </BoardFrame>
  );
};

/** usage：一条命令 + 自然语言 */
export const UsageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  const cmd = "$ npx skills add dull-bird/feynman-technique -g";
  const typed = Math.round(
    interpolate(frame, [f(0.6), f(2.4)], [0, cmd.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <BoardFrame>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 84,
          color: COLORS.chalk,
          letterSpacing: 4,
          opacity: fade(0.3, 0.9),
        }}
      >
        你也想被拷问一次？
      </div>

      <div
        style={{
          marginTop: 44,
          borderRadius: 16,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          padding: "22px 32px",
          fontFamily: MONO,
          fontSize: 32,
          whiteSpace: "pre",
          opacity: fade(0.6, 1.2),
        }}
      >
        <span style={{ color: COLORS.yellow }}>$</span>
        <span style={{ color: COLORS.chalk }}>{cmd.slice(1, typed)}</span>
      </div>

      <div
        style={{
          marginTop: 40,
          fontFamily: KAITI,
          fontSize: 52,
          color: COLORS.chalk,
          backgroundColor: "#24453A",
          borderRadius: 20,
          padding: "20px 36px",
          opacity: fade(2.8, 3.5),
        }}
      >
        对它说：用费曼学习法，概念是 XX
      </div>

      <div
        style={{
          display: "flex",
          gap: 36,
          marginTop: 36,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 50,
          opacity: fade(5.2, 6.0),
        }}
      >
        <span
          style={{
            color: COLORS.yellow,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 16,
            padding: "14px 28px",
          }}
        >
          查进度
        </span>
        <span
          style={{
            color: COLORS.yellow,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 16,
            padding: "14px 28px",
          }}
        >
          导出笔记
        </span>
        <span style={{ color: COLORS.sage, alignSelf: "center", fontSize: 44, fontWeight: 600 }}>
          都是一句话
        </span>
      </div>
    </BoardFrame>
  );
};

/** cta：提问 + 实测预告 + 网址 */
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  return (
    <BoardFrame>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 92,
          color: COLORS.chalk,
          letterSpacing: 4,
          lineHeight: 1.5,
          textAlign: "center",
          opacity: fade(0.3, 1.0),
        }}
      >
        你最自以为懂的
        <br />
        概念是什么？
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: KAITI,
          fontSize: 52,
          color: COLORS.yellow,
          letterSpacing: 2,
          opacity: fade(1.8, 2.6),
        }}
      >
        我用它实测一轮，结果发出来
      </div>
      <div
        style={{
          marginTop: 48,
          fontFamily: MONO,
          fontSize: 38,
          color: COLORS.yellow,
          letterSpacing: 1,
          opacity: fade(3.0, 3.8),
        }}
      >
        dull-bird.github.io/feynman-technique
      </div>
    </BoardFrame>
  );
};

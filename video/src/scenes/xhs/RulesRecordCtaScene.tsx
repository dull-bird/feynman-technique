import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame, PaperFrame } from "./HookScene";

const INK = "#1A2E26";
const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

/** rules：一次只做一件事 */
export const RulesScene: React.FC = () => {
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
          fontSize: 104,
          color: COLORS.chalk,
          letterSpacing: 5,
          opacity: fade(0.3, 0.9),
        }}
      >
        一次只做一件事
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          marginTop: 56,
          width: 860,
        }}
      >
        {["引用你的原话", "问最关键的一个问题"].map((t, i) => (
          <div
            key={t}
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 62,
              color: COLORS.chalk,
              border: `3px solid ${COLORS.yellow}`,
              borderRadius: 20,
              padding: "24px 36px",
              textAlign: "center",
              letterSpacing: 3,
              opacity: fade(1.4 + i * 0.9, 2.0 + i * 0.9),
            }}
          >
            {t}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 52,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 56,
          opacity: fade(3.8, 4.4),
        }}
      >
        <span style={{ color: COLORS.red }}>卡壳 → 盲区</span>
        <span style={{ color: COLORS.sage }}>|</span>
        <span style={{ color: COLORS.yellow }}>讲通 → 通过</span>
      </div>
    </BoardFrame>
  );
};

/** record：学习记录册表格（纸张底） */
export const RecordScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  const rows = [
    { c: "注意力机制", r: "7 轮", s: "2 → 4", hot: true },
    { c: "熵", r: "8 轮", s: "2", hot: false },
    { c: "贝叶斯定理", r: "7 轮", s: "4", hot: false },
  ];

  return (
    <PaperFrame>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 88,
          color: INK,
          letterSpacing: 5,
          opacity: fade(0.3, 0.9),
        }}
      >
        学习记录册
      </div>

      <div
        style={{
          marginTop: 44,
          width: 900,
          borderRadius: 18,
          backgroundColor: "#FFFFFF",
          border: `2px solid ${INK}22`,
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
          padding: "24px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          opacity: fade(0.9, 1.5),
          translate: `0 ${(1 - fade(0.9, 1.5)) * 24}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 40,
            color: COLORS.sage,
            borderBottom: `2px solid ${INK}18`,
            paddingBottom: 12,
          }}
        >
          <span style={{ flex: 1.4 }}>概念</span>
          <span style={{ flex: 0.8 }}>轮数</span>
          <span style={{ flex: 0.8 }}>评分</span>
        </div>
        {rows.map((row, i) => (
          <div
            key={row.c}
            style={{
              display: "flex",
              alignItems: "baseline",
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 46,
              color: INK,
              opacity: fade(1.6 + i * 0.6, 2.1 + i * 0.6),
              backgroundColor: row.hot ? `${COLORS.yellow}33` : undefined,
              borderRadius: 8,
              padding: "6px 8px",
            }}
          >
            <span style={{ flex: 1.4 }}>{row.c}</span>
            <span style={{ flex: 0.8 }}>{row.r}</span>
            <span
              style={{
                flex: 0.8,
                fontWeight: 900,
                color: row.s === "2" ? COLORS.red : "#B8892D",
              }}
            >
              {row.s}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 44,
          fontFamily: KAITI,
          fontSize: 56,
          color: INK,
          letterSpacing: 3,
          opacity: fade(3.6, 4.2),
        }}
      >
        几轮 · 几分 · 盲区在哪 —— 进步看得见
      </div>
    </PaperFrame>
  );
};

/** cta：一条命令 + 提问 + 网址 */
export const CtaScene: React.FC = () => {
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
    interpolate(frame, [f(0.4), f(1.6)], [0, cmd.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <BoardFrame>
      <div
        style={{
          borderRadius: 16,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          padding: "22px 32px",
          fontFamily: MONO,
          fontSize: 32,
          whiteSpace: "pre",
          opacity: fade(0.2, 0.6),
        }}
      >
        <span style={{ color: COLORS.yellow }}>$</span>
        <span style={{ color: COLORS.chalk }}>{cmd.slice(1, typed)}</span>
      </div>

      <div
        style={{
          marginTop: 64,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 96,
          color: COLORS.chalk,
          letterSpacing: 5,
          lineHeight: 1.5,
          textAlign: "center",
          opacity: fade(1.6, 2.3),
          translate: `0 ${(1 - fade(1.6, 2.3)) * 24}px`,
        }}
      >
        你最自以为懂的
        <br />
        概念是什么？
      </div>

      <div
        style={{
          marginTop: 56,
          fontFamily: MONO,
          fontSize: 38,
          color: COLORS.yellow,
          letterSpacing: 1,
          opacity: fade(2.6, 3.2),
        }}
      >
        dull-bird.github.io/feynman-technique
      </div>
    </BoardFrame>
  );
};

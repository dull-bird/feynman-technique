import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrandMark } from "../../components/BrandMark";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame } from "../xhs/HookScene";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";
const INK = "#1A2E26";

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [Math.round(a * 30), Math.round(b * 30)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const REPORT_LINES: { text: string; color: string; highlight?: boolean }[] = [
  { text: "$ python3 scripts/feynman_log.py report", color: COLORS.yellow },
  { text: "== 总体 ==", color: COLORS.sage },
  { text: "对话次数：12 | 通过：8 | 通过率：67%", color: COLORS.chalk },
  { text: "平均评分：3.3/5", color: COLORS.chalk },
  { text: "== 各概念 ==", color: COLORS.sage },
  {
    text: "- 注意力机制：2 次，评分 2 → 4，已掌握 ✅",
    color: COLORS.chalk,
    highlight: true,
  },
  { text: "  2026-08-01 18:45 | 7 轮 | 未通过 | 2/5", color: COLORS.sage },
  { text: "  2026-08-01 18:46 | 6 轮 | 通过   | 4/5", color: COLORS.sage },
  { text: "- 熵：1 次，评分 2，尚未通过", color: COLORS.red },
  { text: "- 贝叶斯定理 / 指数基金 / 认知失调：评分 4 ✅", color: COLORS.chalk },
];

/** nl：前半真实 report，后半导出（56% 拆分，与横版一致） */
export const NLScene: React.FC<{ durationInFrames?: number }> = ({
  durationInFrames = 420,
}) => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const split = Math.round(durationInFrames * 0.56);

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
    <BoardFrame>
      <ChalkChars
        text="所有能力，自然语言发起"
        delay={f(0.4)}
        stagger={3}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 72,
          color: COLORS.chalk,
          letterSpacing: 3,
          marginBottom: 36,
          textAlign: "center",
        }}
      />

      <div style={{ position: "relative", width: 1080, height: 1050 }}>
        {/* 前半：提问 + 真实 report */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            opacity: firstOut,
          }}
        >
          <div
            style={{
              fontFamily: KAITI,
              fontSize: 48,
              color: COLORS.chalk,
              backgroundColor: "#24453A",
              borderRadius: 18,
              padding: "14px 30px",
              opacity: fade(frame, 0.8, 1.5),
            }}
          >
            「我最近有没有进步？」
          </div>
          <div
            style={{
              width: 940,
              borderRadius: 16,
              backgroundColor: "#122119",
              border: `2px solid ${COLORS.sage}44`,
              padding: "24px 32px",
              fontFamily: MONO,
              fontSize: 27,
              lineHeight: 1.62,
              whiteSpace: "pre-wrap",
              opacity: fade(frame, 1.6, 2.4),
              translate: `0 ${(1 - fade(frame, 1.6, 2.4)) * 24}px`,
            }}
          >
            {REPORT_LINES.map((l, i) => {
              const o = interpolate(
                frame,
                [f(2.6 + i * 0.45), f(3.1 + i * 0.45)],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <div
                  key={i}
                  style={{
                    color: l.color,
                    opacity: o,
                    backgroundColor: l.highlight
                      ? `${COLORS.yellow}22`
                      : undefined,
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 22,
            }}
          >
            <span
              style={{
                fontFamily: KAITI,
                fontSize: 54,
                color: COLORS.chalk,
                backgroundColor: "#24453A",
                borderRadius: 18,
                padding: "18px 34px",
              }}
            >
              「导出到 Obsidian」
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 52,
                color: COLORS.yellow,
              }}
            >
              ↓
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 64,
                color: COLORS.yellow,
                border: `3px solid ${COLORS.yellow}`,
                borderRadius: 18,
                padding: "20px 44px",
              }}
            >
              学习笔记
            </span>
          </div>
          <div
            style={{
              fontFamily: KAITI,
              fontSize: 54,
              color: COLORS.sage,
              letterSpacing: 4,
              opacity: interpolate(frame, [split + 34, split + 46], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            不需要会编程
          </div>
        </div>
      </div>
    </BoardFrame>
  );
};

/** card：复习卡（纸张卡竖版放大） */
export const CardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const cardIn = spring({
    frame: frame - f(1.4),
    fps,
    config: { damping: 15, stiffness: 140, mass: 0.8 },
  });

  return (
    <BoardFrame>
      <ChalkChars
        text="每次通过，沉淀成复习卡"
        delay={f(0.4)}
        stagger={3}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 76,
          color: COLORS.chalk,
          letterSpacing: 3,
          marginBottom: 48,
          textAlign: "center",
        }}
      />

      <div
        style={{
          width: 880,
          borderRadius: 22,
          backgroundColor: "#F7F3E9",
          padding: "40px 48px",
          rotate: "-1.5deg",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          opacity: Math.min(1, Math.max(0, cardIn * 1.5)),
          scale: 0.7 + 0.3 * cardIn,
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 64,
            color: INK,
            letterSpacing: 4,
            borderBottom: `3px solid ${INK}22`,
            paddingBottom: 20,
          }}
        >
          复习卡
        </div>
        {["你的精炼解释", "一个类比", "三道迁移小测"].map((r, i) => (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 22,
              opacity: fade(frame, 2.6 + i * 0.9, 3.2 + i * 0.9),
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 44,
                color: COLORS.red,
              }}
            >
              {`0${i + 1}`}
            </span>
            <span
              style={{
                fontFamily: KAITI,
                fontSize: 52,
                color: INK,
                letterSpacing: 2,
              }}
            >
              {r}
            </span>
          </div>
        ))}
      </div>
    </BoardFrame>
  );
};

/** gallery：五领域竖排行 */
export const GalleryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const domains = [
    { name: "金融", score: "4", note: "通过" },
    { name: "AI", score: "2 → 4", note: "回填" },
    { name: "数学", score: "4", note: "通过" },
    { name: "物理", score: "2", note: "翻车" },
    { name: "心理学", score: "4", note: "通过" },
  ];

  return (
    <BoardFrame>
      <ChalkChars
        text="五个领域的真实对话"
        delay={f(0.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 84,
          color: COLORS.chalk,
          letterSpacing: 4,
          marginBottom: 44,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          width: 860,
        }}
      >
        {domains.map((d, i) => {
          const s = spring({
            frame: frame - f(2.2) - i * 8,
            fps,
            config: { damping: 15, stiffness: 160, mass: 0.7 },
          });
          const failed = d.note === "翻车";
          return (
            <div
              key={d.name}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 26,
                borderRadius: 16,
                backgroundColor: "#122119",
                border: `2px solid ${failed ? COLORS.red : COLORS.sage}66`,
                padding: "18px 32px",
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 22}px`,
              }}
            >
              <span
                style={{
                  flex: 1.2,
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 52,
                  color: COLORS.chalk,
                  letterSpacing: 2,
                }}
              >
                {d.name}
              </span>
              <span
                style={{
                  flex: 1,
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 50,
                  color: failed ? COLORS.red : COLORS.yellow,
                }}
              >
                {d.score}
              </span>
              <span
                style={{
                  fontFamily: KAITI,
                  fontSize: 36,
                  color: COLORS.sage,
                }}
              >
                {d.note}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 40,
          fontFamily: KAITI,
          fontSize: 46,
          color: COLORS.sage,
          letterSpacing: 2,
          opacity: fade(frame, 6.6, 7.4),
        }}
      >
        有通过的，也有当场翻车的
      </div>
    </BoardFrame>
  );
};

/** ending：logo + 命令 + CTA + 网址 */
export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const cmd = "$ npx skills add dull-bird/feynman-technique -g";
  const typed = Math.round(
    interpolate(frame, [f(1.2), f(2.8)], [0, cmd.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <BoardFrame>
      <BrandMark size={130} />

      <div
        style={{
          marginTop: 36,
          borderRadius: 16,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          padding: "20px 30px",
          fontFamily: MONO,
          fontSize: 32,
          whiteSpace: "pre",
        }}
      >
        <span style={{ color: COLORS.yellow }}>$</span>
        <span style={{ color: COLORS.chalk }}>{cmd.slice(1, typed)}</span>
      </div>

      <div
        style={{
          marginTop: 48,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 76,
          color: COLORS.chalk,
          letterSpacing: 3,
          textAlign: "center",
          lineHeight: 1.55,
          opacity: fade(frame, 3.0, 3.8),
        }}
      >
        挑一个你自以为懂的概念
        <br />
        <span style={{ color: COLORS.yellow }}>开始讲</span>
      </div>

      <div
        style={{
          marginTop: 44,
          fontFamily: MONO,
          fontSize: 36,
          color: COLORS.yellow,
          letterSpacing: 1,
          opacity: fade(frame, 4.2, 5.0),
        }}
      >
        dull-bird.github.io/feynman-technique
      </div>
    </BoardFrame>
  );
};

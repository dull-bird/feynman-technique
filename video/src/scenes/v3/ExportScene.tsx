import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

const COLUMNS = [
  {
    title: "概念笔记",
    files: ["注意力机制.md", "熵.md", "贝叶斯定理.md"],
  },
  {
    title: "会话笔记",
    files: ["20260801-1844-熵.md", "20260801-1846-注意力.md"],
  },
  {
    title: "总索引",
    files: ["00_Index.md", "评分走势.md"],
  },
];

/** export：一条命令导出 Obsidian 笔记（三栏文件列表） */
export const ExportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 46,
      }}
    >
      <ChalkChars
        text="一条命令，导出成 Obsidian 笔记"
        delay={f(0.3)}
        stagger={3}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 88,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <div style={{ display: "flex", gap: 44 }}>
        {COLUMNS.map((col, i) => {
          const s = spring({
            frame: frame - f(2.2) - i * 10,
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.7 },
          });
          return (
            <div
              key={col.title}
              style={{
                width: 480,
                borderRadius: 18,
                backgroundColor: "#122119",
                border: `2px solid ${COLORS.sage}44`,
                padding: "26px 34px",
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 26}px`,
              }}
            >
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 44,
                  color: COLORS.yellow,
                  letterSpacing: 3,
                  marginBottom: 18,
                }}
              >
                {col.title}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  fontFamily: MONO,
                  fontSize: 29,
                  color: COLORS.chalk,
                }}
              >
                {col.files.map((file) => (
                  <div key={file}>📄 {file}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 44,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(5.8), f(6.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        每个概念一篇，每次对话一篇，带完整实录
      </div>
    </div>
  );
};

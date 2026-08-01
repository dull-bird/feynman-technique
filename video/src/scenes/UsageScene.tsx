import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, HAND, SERIF } from "../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

// 评分折线：2 → 3 → 4 → 5
const CHART = {
  width: 720,
  height: 220,
  points: [
    { score: 2, x: 100, y: 160 },
    { score: 3, x: 260, y: 120 },
    { score: 4, x: 420, y: 80 },
    { score: 5, x: 580, y: 36 },
  ],
};
const CHART_PATH = CHART.points
  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
  .join(" ");

const Bubble: React.FC<{
  text: string;
  align: "left" | "right";
  appear: number;
  accent?: boolean;
  label: string;
}> = ({ text, align, appear, accent = false, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - appear,
    fps,
    config: { damping: 16, stiffness: 170, mass: 0.7 },
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        opacity: Math.min(1, Math.max(0, s * 1.5)),
        translate: `0 ${(1 - s) * 26}px`,
      }}
    >
      <div
        style={{
          fontFamily: HAND,
          fontSize: 30,
          color: COLORS.sage,
          marginBottom: 8,
          marginLeft: align === "left" ? 20 : 0,
          marginRight: align === "right" ? 20 : 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          maxWidth: 900,
          padding: "24px 36px",
          borderRadius: 24,
          borderBottomLeftRadius: align === "left" ? 6 : 24,
          borderBottomRightRadius: align === "right" ? 6 : 24,
          backgroundColor: accent ? "#24453A" : "transparent",
          border: accent ? "none" : `2px solid ${COLORS.yellow}`,
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 44,
          color: COLORS.chalk,
          letterSpacing: 2,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** 37–45s：使用场景——模拟对话 + 评分走势 + 落版 */
export const UsageScene: React.FC = () => {
  const frame = useCurrentFrame();

  // 对话区在落版前淡出
  const chatOut = interpolate(frame, [168, 184], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 折线描绘
  const draw = interpolate(frame, [92, 142], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });

  // 落版
  const endIn = interpolate(frame, [186, 206], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 对话 + 评分 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
          padding: "0 240px",
          opacity: chatOut,
        }}
      >
        <Bubble
          label="你"
          text="用费曼学习法，概念是复利"
          align="right"
          appear={8}
          accent
        />
        <Bubble
          label="AI 听众"
          text="「滚」具体是什么意思？"
          align="left"
          appear={40}
        />

        {/* 评分走势 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            marginTop: 12,
            opacity: interpolate(frame, [80, 92], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <svg
            width={CHART.width}
            height={CHART.height}
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          >
            <path
              d={CHART_PATH}
              fill="none"
              stroke={COLORS.yellow}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
            />
            {CHART.points.map((p, i) => {
              const dot = interpolate(
                frame,
                [92 + i * 12, 100 + i * 12],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              );
              return (
                <g key={p.score} opacity={dot}>
                  <circle cx={p.x} cy={p.y} r={9} fill={COLORS.chalk} />
                  <text
                    x={p.x}
                    y={p.y - 22}
                    textAnchor="middle"
                    fill={COLORS.yellow}
                    fontSize={34}
                    fontFamily={HAND}
                  >
                    {p.score}
                  </text>
                </g>
              );
            })}
          </svg>
          <div
            style={{
              fontFamily: HAND,
              fontSize: 46,
              color: COLORS.chalk,
              letterSpacing: 3,
            }}
          >
            每次对话都被记下
          </div>
        </div>
      </div>

      {/* 落版 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          opacity: endIn,
          translate: `0 ${(1 - endIn) * 24}px`,
        }}
      >
        {/* 小闭环图标 */}
        <svg width={120} height={120} viewBox="0 0 120 120">
          <path
            d="M 60 14 A 46 46 0 1 1 59.9 14"
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <path d="M 60 2 L 78 14 L 60 26 Z" fill={COLORS.yellow} />
        </svg>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 96,
            color: COLORS.chalk,
            letterSpacing: 8,
          }}
        >
          费曼学习法陪练
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 44,
            color: COLORS.yellow,
            letterSpacing: 2,
          }}
        >
          dull-bird.github.io/feynman-technique
        </div>
      </div>
    </div>
  );
};

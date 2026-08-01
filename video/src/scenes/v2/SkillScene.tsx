import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";
const CMD = "$ npx skills add dull-bird/feynman-technique -g";

const CHART = [
  { score: 2, x: 80, y: 140 },
  { score: 3, x: 190, y: 112 },
  { score: 4, x: 300, y: 82 },
  { score: 5, x: 410, y: 52 },
];
const CHART_PATH = CHART.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

/** skill：终端一行命令 → 你讲它问 → 评分走势 */
export const SkillScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const typed = Math.round(
    interpolate(frame, [f(2.2), f(4.4)], [0, CMD.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const chatIn = interpolate(frame, [f(5.2), f(6.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const chartIn = interpolate(frame, [f(7.6), f(8.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const draw = interpolate(frame, [f(8.2), f(10.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const verdict = interpolate(frame, [f(10.8), f(11.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        gap: 34,
        padding: "0 180px",
      }}
    >
      <ChalkChars
        text="把听众装进你的终端"
        delay={f(0.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 96,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />

      {/* 终端一行命令 */}
      <div
        style={{
          width: 1080,
          borderRadius: 16,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          padding: "26px 36px",
          fontFamily: MONO,
          fontSize: 34,
          whiteSpace: "pre",
          opacity: interpolate(frame, [f(1.6), f(2.2)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span style={{ color: COLORS.yellow }}>$</span>
        <span style={{ color: COLORS.chalk }}>{CMD.slice(1, typed)}</span>
      </div>

      {/* 你讲它问 */}
      <div
        style={{
          display: "flex",
          gap: 56,
          opacity: chatIn,
          translate: `0 ${(1 - chatIn) * 20}px`,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 42,
            color: COLORS.chalk,
            backgroundColor: "#24453A",
            borderRadius: 18,
            padding: "18px 30px",
          }}
        >
          你讲：「概念是复利」
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 42,
            color: COLORS.chalk,
            border: `2px solid ${COLORS.yellow}`,
            borderRadius: 18,
            padding: "18px 30px",
          }}
        >
          它问：「『滚』是什么意思？」
        </div>
      </div>

      {/* 评分走势 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          opacity: chartIn,
        }}
      >
        <svg width={480} height={170} viewBox="0 0 480 170">
          <path
            d={CHART_PATH}
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
          {CHART.map((p, i) => (
            <g
              key={p.score}
              opacity={interpolate(
                frame,
                [f(8.2) + i * 8, f(8.2) + i * 8 + 6],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )}
            >
              <circle cx={p.x} cy={p.y} r={7} fill={COLORS.chalk} />
              <text
                x={p.x}
                y={p.y - 16}
                textAnchor="middle"
                fill={COLORS.yellow}
                fontSize={28}
                fontFamily={HAND}
              >
                {p.score}
              </text>
            </g>
          ))}
        </svg>
        <div
          style={{
            fontFamily: HAND,
            fontSize: 44,
            color: COLORS.chalk,
            letterSpacing: 2,
          }}
        >
          每次对话都被记下
        </div>
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 56,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: verdict,
        }}
      >
        评分走势，就是理解的增长曲线
      </div>
    </div>
  );
};

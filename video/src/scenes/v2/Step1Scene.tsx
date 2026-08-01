import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, SERIF } from "../../theme";

/** step1：写下概念 + 复利增长曲线（1000 → 76000） */
export const Step1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const num = spring({
    frame: frame - f(0.3),
    fps,
    config: { damping: 13, stiffness: 140, mass: 0.8 },
  });

  // 复利曲线：指数感折线（x: 时间, y: 金额），viewBox 1100x300
  const curve =
    "M 60 268 C 300 262 520 244 700 200 C 850 162 960 96 1040 36";
  const draw = interpolate(frame, [f(8.0), f(11.5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const endDot = interpolate(frame, [f(11.3), f(11.8)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const questionIn = interpolate(frame, [f(12.6), f(13.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blindIn = interpolate(frame, [f(15.2), f(16.0)], [0, 1], {
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
        gap: 30,
        padding: "0 160px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 32 }}>
        <span
          style={{
            fontFamily: HAND,
            fontSize: 130,
            color: COLORS.yellow,
            opacity: Math.min(1, Math.max(0, num * 1.5)),
            scale: 0.55 + 0.45 * num,
          }}
        >
          01
        </span>
        <ChalkChars
          text="写下概念"
          delay={f(0.8)}
          stagger={5}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 110,
            color: COLORS.chalk,
            letterSpacing: 8,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 46,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(2.0), f(2.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        用纸和笔，不是手机——写下来就是承诺
      </div>

      {/* 复利曲线 */}
      <svg width={1100} height={300} viewBox="0 0 1100 300">
        <path
          d={curve}
          fill="none"
          stroke={COLORS.yellow}
          strokeWidth={6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
        <g opacity={draw > 0.02 ? 1 : 0}>
          <circle cx={60} cy={268} r={9} fill={COLORS.chalk} />
          <text
            x={60}
            y={244}
            textAnchor="start"
            fill={COLORS.chalk}
            fontSize={34}
            fontFamily={SERIF}
            fontWeight={600}
          >
            $1,000
          </text>
        </g>
        <g opacity={endDot}>
          <circle cx={1040} cy={36} r={9} fill={COLORS.chalk} />
          <text
            x={1040}
            y={78}
            textAnchor="end"
            fill={COLORS.yellow}
            fontSize={40}
            fontFamily={SERIF}
            fontWeight={900}
          >
            $76,000
          </text>
        </g>
        <text
          x={540}
          y={296}
          textAnchor="middle"
          fill={COLORS.sage}
          fontSize={30}
          fontFamily={SERIF}
          opacity={draw > 0.4 ? 1 : 0}
        >
          年利率 7% × 40 年
        </text>
      </svg>

      <div
        style={{
          fontFamily: HAND,
          fontSize: 52,
          color: COLORS.chalk,
          opacity: questionIn,
          translate: `0 ${(1 - questionIn) * 16}px`,
        }}
      >
        为什么变成七万六？
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 54,
          color: COLORS.red,
          letterSpacing: 3,
          opacity: blindIn,
        }}
      >
        最自信的概念，正是最大的盲区
      </div>
    </div>
  );
};

import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../components/Chalk";
import { COLORS, HAND, SERIF } from "../theme";

const CX = 960;
const CY = 470;
const R = 210;

const STEPS = [
  { num: "01", label: "写下概念", x: 960, y: 165 },
  { num: "02", label: "讲给外行", x: 1340, y: 470 },
  { num: "03", label: "识别盲区", x: 960, y: 775 },
  { num: "04", label: "简化类比", x: 580, y: 470 },
];

/** 25–30s：四步首尾相连成闭环，结尾字幕 */
export const LoopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 顺时针画出闭环（从顶部出发回到顶部）
  const loop = interpolate(frame, [8, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });

  // 画完后箭头出现，指回第一步
  const arrowOpacity = interpolate(frame, [56, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 闭环路径 + 回到第一步的箭头 */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={`M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.1} ${CY - R}`}
          fill="none"
          stroke={COLORS.yellow}
          strokeWidth={7}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - loop}
        />
        <g opacity={arrowOpacity} transform={`translate(${CX + 6} ${CY - R})`}>
          <path d="M 0 -17 L 32 0 L 0 17 Z" fill={COLORS.yellow} />
        </g>
      </svg>

      {/* 四个步骤标签（底色让圆环在文字后断开） */}
      {STEPS.map((s, i) => {
        const pop = spring({
          frame: frame - 14 - i * 11,
          fps,
          config: { damping: 14, stiffness: 160, mass: 0.7 },
        });
        return (
          <div
            key={s.num}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              padding: "4px 24px",
              background: COLORS.board,
              opacity: Math.min(1, Math.max(0, pop * 1.5)),
              scale: 0.6 + 0.4 * pop,
            }}
          >
            <span
              style={{
                fontFamily: HAND,
                fontSize: 64,
                color: COLORS.yellow,
              }}
            >
              {s.num}
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 62,
                color: COLORS.chalk,
                letterSpacing: 4,
              }}
            >
              {s.label}
            </span>
          </div>
        );
      })}

      {/* 结尾字幕 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 945,
          transform: "translateY(-50%)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ChalkChars
          text="AI 陪练 · 你讲它问 · 直到真懂"
          delay={54}
          stagger={2}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 68,
            color: COLORS.chalk,
            letterSpacing: 4,
          }}
        />
      </div>
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, SERIF } from "../../theme";

const MISTAKES = [
  "碰到盲区就糊弄过去",
  "拿术语当拐杖",
  "只有理论没有例子",
  "只在脑子里演练",
];

/** mistakes：四个错误逐条被红笔打叉 */
export const MistakesScene: React.FC = () => {
  const frame = useCurrentFrame();
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
        gap: 40,
      }}
    >
      <ChalkChars
        text="避开四个错误"
        delay={f(0.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 100,
          color: COLORS.chalk,
          letterSpacing: 6,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 26,
          marginTop: 12,
        }}
      >
        {MISTAKES.map((text, i) => {
          const itemIn = interpolate(
            frame,
            [f(1.8 + i * 0.6), f(2.3 + i * 0.6)],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const cross = interpolate(
            frame,
            [f(2.9 + i * 1.15), f(3.35 + i * 1.15)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.55, 0, 0.35, 1),
            },
          );
          // 红叉宽度按字符数适配，避免溢出到相邻行
          const w = text.length * 68 + 60;
          const h = 84;
          const m = 30; // 叉臂内缩
          return (
            <div
              key={text}
              style={{
                position: "relative",
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 64,
                color: COLORS.chalk,
                letterSpacing: 4,
                textAlign: "center",
                opacity: itemIn,
                padding: "0 20px",
              }}
            >
              {text}
              {/* 红叉：两笔 */}
              <svg
                width={w}
                height={h}
                viewBox={`0 0 ${w} ${h}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: -w / 2,
                  marginTop: -h / 2,
                  pointerEvents: "none",
                }}
              >
                <path
                  d={`M ${m} 16 L ${w - m} ${h - 16}`}
                  fill="none"
                  stroke={COLORS.red}
                  strokeWidth={8}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - cross}
                />
                <path
                  d={`M ${w - m} 16 L ${m} ${h - 16}`}
                  fill="none"
                  stroke={COLORS.red}
                  strokeWidth={8}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - cross}
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};

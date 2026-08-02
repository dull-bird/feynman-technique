import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, HAND, SERIF } from "../../theme";
import { BoardFrame } from "./HookScene";

const STEPS = ["写下概念", "讲给外行", "识别盲区", "简化类比"];

/** steps：竖排四卡片快闪 + 盲区在发光 */
export const StepsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const circle = interpolate(frame, [f(6.6), f(7.3)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.5, 0, 0.3, 1),
  });

  return (
    <BoardFrame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          width: 780,
        }}
      >
        {STEPS.map((name, i) => {
          const s = spring({
            frame: frame - f(0.5) - i * 14,
            fps,
            config: { damping: 15, stiffness: 170, mass: 0.7 },
          });
          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                backgroundColor: "#122119",
                border: `2px solid ${COLORS.sage}44`,
                borderRadius: 22,
                padding: "28px 40px",
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 40}px`,
              }}
            >
              <span
                style={{ fontFamily: HAND, fontSize: 76, color: COLORS.yellow }}
              >
                {`0${i + 1}`}
              </span>
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 68,
                  color: COLORS.chalk,
                  letterSpacing: 4,
                }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "relative",
          marginTop: 56,
          fontFamily: HAND,
          fontSize: 68,
          color: COLORS.yellow,
          padding: "0 26px",
          opacity: interpolate(frame, [f(6.0), f(6.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        盲区在发光
        <svg
          width={420}
          height={150}
          viewBox="0 0 420 150"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: -210,
            marginTop: -80,
            rotate: "-3deg",
            pointerEvents: "none",
          }}
        >
          <path
            d="M 210 12 C 310 8 396 40 394 76 C 392 114 306 140 206 138 C 106 136 22 112 22 74 C 22 38 108 12 214 12"
            fill="none"
            stroke={COLORS.red}
            strokeWidth={8}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - circle}
          />
        </svg>
      </div>
    </BoardFrame>
  );
};

/** gap：听众去哪找 */
export const GapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  return (
    <BoardFrame>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 56,
          color: COLORS.sage,
          letterSpacing: 4,
          opacity: interpolate(frame, [f(0.4), f(1.0)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        什么都不懂 · 还穷追不舍
      </div>
      <div
        style={{
          marginTop: 56,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 128,
          color: COLORS.chalk,
          letterSpacing: 6,
          opacity: interpolate(frame, [f(1.2), f(1.9)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        听众去哪找？
      </div>
    </BoardFrame>
  );
};

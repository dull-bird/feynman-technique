import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame } from "./HookScene";

/** pain：眼熟 ≠ 理解 */
export const PainScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const strike = interpolate(frame, [f(3.2), f(3.9)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.6, 0, 0.3, 1),
  });

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
        划重点 · 反复看 · 觉得眼熟
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 60,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 128,
          color: COLORS.chalk,
          letterSpacing: 6,
          padding: "0 20px",
          opacity: interpolate(frame, [f(1.4), f(2.0)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        眼熟 ≠ 理解
        <svg
          width={300}
          height={44}
          viewBox="0 0 300 44"
          style={{
            position: "absolute",
            left: 20,
            top: "50%",
            marginTop: -22,
            rotate: "-2deg",
          }}
        >
          <path
            d="M 8 24 Q 100 12 180 20 T 292 18"
            fill="none"
            stroke={COLORS.red}
            strokeWidth={10}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - strike}
          />
        </svg>
      </div>
      <div
        style={{
          marginTop: 60,
          fontFamily: KAITI,
          fontSize: 58,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(4.4), f(5.0)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        大脑骗你说「会了」
      </div>
    </BoardFrame>
  );
};

/** standard：费曼的狠标准 */
export const StandardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const circle = interpolate(frame, [f(4.4), f(5.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.5, 0, 0.3, 1),
  });

  return (
    <BoardFrame>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 50,
          color: COLORS.sage,
          letterSpacing: 4,
          opacity: interpolate(frame, [f(0.4), f(1.0)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        诺贝尔奖得主 · 费曼的标准
      </div>
      <div
        style={{
          marginTop: 56,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 108,
          color: COLORS.chalk,
          letterSpacing: 5,
          lineHeight: 1.55,
          textAlign: "center",
          opacity: interpolate(frame, [f(1.2), f(1.9)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        讲给外行听懂
      </div>
      <div
        style={{
          position: "relative",
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 108,
          color: COLORS.yellow,
          letterSpacing: 5,
          padding: "0 24px",
          opacity: interpolate(frame, [f(2.2), f(2.8)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        才算懂
        <svg
          width={400}
          height={200}
          viewBox="0 0 400 200"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: -200,
            marginTop: -105,
            rotate: "-3deg",
            pointerEvents: "none",
          }}
        >
          <path
            d="M 200 14 C 300 10 384 48 382 100 C 380 154 296 188 196 186 C 98 184 18 150 18 98 C 18 46 104 12 208 14"
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

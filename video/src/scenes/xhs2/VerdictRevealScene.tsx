import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame } from "../xhs/HookScene";

/** verdict：5/5 宣判卡 */
export const VerdictScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const circle = interpolate(frame, [f(2.0), f(2.8)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.5, 0, 0.3, 1),
  });

  return (
    <BoardFrame>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 84,
          color: COLORS.chalk,
          letterSpacing: 5,
          opacity: interpolate(frame, [f(0.3), f(0.9)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        本轮通过
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 30,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 220,
          color: COLORS.yellow,
          lineHeight: 1,
          padding: "0 60px",
          opacity: interpolate(frame, [f(1.0), f(1.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        5/5
        <svg
          width={480}
          height={330}
          viewBox="0 0 480 330"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: -240,
            marginTop: -168,
            rotate: "-3deg",
            pointerEvents: "none",
          }}
        >
          <path
            d="M 240 18 C 366 12 458 70 456 160 C 454 252 360 308 234 306 C 110 304 22 246 22 156 C 22 68 118 16 246 16"
            fill="none"
            stroke={COLORS.red}
            strokeWidth={10}
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

/** reveal：考我的不是人 + 双 AI 结构 */
export const RevealScene: React.FC = () => {
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
          fontSize: 108,
          color: COLORS.chalk,
          letterSpacing: 5,
          opacity: fade(0.4, 1.0),
        }}
      >
        考我的，不是人
      </div>
      <div
        style={{
          marginTop: 24,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 84,
          color: COLORS.yellow,
          letterSpacing: 4,
          opacity: fade(1.8, 2.6),
        }}
      >
        是两个 AI
      </div>

      <div
        style={{
          marginTop: 60,
          display: "flex",
          alignItems: "center",
          gap: 36,
          opacity: fade(4.4, 5.2),
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 52,
            color: COLORS.chalk,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 20,
            padding: "26px 36px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          出题的 AI
          <div
            style={{
              fontFamily: KAITI,
              fontSize: 36,
              color: COLORS.sage,
              fontWeight: 600,
            }}
          >
            听众
          </div>
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 56,
            color: COLORS.yellow,
          }}
        >
          ⇄
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 52,
            color: COLORS.chalk,
            border: `3px solid ${COLORS.sage}66`,
            borderRadius: 20,
            padding: "26px 36px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          应答的 AI
          <div
            style={{
              fontFamily: KAITI,
              fontSize: 36,
              color: COLORS.sage,
              fontWeight: 600,
            }}
          >
            讲解者
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 44,
          fontFamily: KAITI,
          fontSize: 48,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: fade(7.6, 8.4),
        }}
      >
        谁也不知道对方的底牌
      </div>
    </BoardFrame>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame, PaperFrame } from "../xhs/HookScene";

const INK = "#1A2E26";

/** hook：封面帧（第 0 帧即是封面）→ 复利题 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const coverOut = interpolate(frame, [f(1.8), f(2.3)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const quizIn = interpolate(frame, [f(2.2), f(2.8)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const circle = interpolate(frame, [f(5.6), f(6.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.5, 0, 0.3, 1),
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 封面：第 0 帧必须完整可见，无入场动画 */}
      <div style={{ position: "absolute", inset: 0, opacity: coverOut }}>
        <PaperFrame>
          <div
            style={{
              position: "relative",
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 96,
              color: INK,
              letterSpacing: 4,
              whiteSpace: "nowrap",
            }}
          >
            我以为我懂复利，
            <svg
              width={110}
              height={40}
              viewBox="0 0 110 40"
              style={{
                position: "absolute",
                left: 218,
                top: "50%",
                marginTop: -16,
                rotate: "-2deg",
              }}
            >
              <path
                d="M 6 22 Q 40 10 66 18 T 104 16"
                fill="none"
                stroke={COLORS.red}
                strokeWidth={8}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            style={{
              marginTop: 36,
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 88,
              color: INK,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            直到 AI 连问我 8 个问题
          </div>
          <div
            style={{
              marginTop: 80,
              fontFamily: KAITI,
              fontSize: 48,
              color: COLORS.sage,
              letterSpacing: 3,
            }}
          >
            一场真实的拷问 · 费曼学习法陪练
          </div>
        </PaperFrame>
      </div>

      {/* 正题：复利考题 */}
      <div style={{ position: "absolute", inset: 0, opacity: quizIn }}>
        <PaperFrame>
          <div
            style={{
              fontFamily: KAITI,
              fontSize: 60,
              color: COLORS.sage,
              letterSpacing: 4,
              marginBottom: 50,
            }}
          >
            来，一道题
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 84,
              color: INK,
              letterSpacing: 3,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            1000 块 · 年利率 7%
            <br />
            40 年后 = ？
          </div>
          <div
            style={{
              position: "relative",
              marginTop: 40,
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 150,
              color: COLORS.red,
              padding: "0 40px",
            }}
          >
            ？
            <svg
              width={300}
              height={230}
              viewBox="0 0 300 230"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -150,
                marginTop: -118,
                rotate: "-4deg",
                pointerEvents: "none",
              }}
            >
              <path
                d="M 150 14 C 232 10 284 50 282 110 C 280 172 218 212 146 210 C 76 208 18 168 18 108 C 18 50 84 12 158 14"
                fill="none"
                stroke={COLORS.red}
                strokeWidth={9}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - circle}
              />
            </svg>
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: KAITI,
              fontSize: 54,
              color: INK,
              opacity: interpolate(frame, [f(7.0), f(7.6)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            答不上来？我也是
          </div>
        </PaperFrame>
      </div>
    </div>
  );
};

/** pretend：眼熟假象 → 连问 8 个问题预告 */
export const PretendScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const strike = interpolate(frame, [f(2.4), f(3.1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.6, 0, 0.3, 1),
  });

  return (
    <BoardFrame>
      <div
        style={{
          position: "relative",
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 92,
          color: COLORS.chalk,
          letterSpacing: 5,
          padding: "0 20px",
          opacity: interpolate(frame, [f(0.5), f(1.1)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        觉得眼熟 = 会了？
        <svg
          width={620}
          height={40}
          viewBox="0 0 620 40"
          style={{
            position: "absolute",
            left: -6,
            top: "50%",
            marginTop: -18,
            rotate: "-2deg",
          }}
        >
          <path
            d="M 8 22 Q 200 10 360 18 T 612 16"
            fill="none"
            stroke={COLORS.red}
            strokeWidth={9}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - strike}
          />
        </svg>
      </div>

      <div
        style={{
          marginTop: 90,
          display: "flex",
          alignItems: "baseline",
          gap: 28,
          opacity: interpolate(frame, [f(3.6), f(4.4)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 72,
            color: COLORS.chalk,
            letterSpacing: 3,
          }}
        >
          直到它，连问我
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 170,
            color: COLORS.yellow,
            lineHeight: 1,
          }}
        >
          8
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 72,
            color: COLORS.chalk,
            letterSpacing: 3,
          }}
        >
          个问题
        </span>
      </div>
    </BoardFrame>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, HAND, KAITI, SERIF } from "../../theme";

const INK = "#1A2E26";
const PAPER = "#F7F3E9";
const RULE = "#DDD6C2";

/** 纸张底（带横线纹理），底部留小红书 UI 安全区 */
export const PaperFrame: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: PAPER,
      backgroundImage: `repeating-linear-gradient(transparent 0px, transparent 86px, ${RULE} 86px, ${RULE} 88px)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 300,
    }}
  >
    {children}
  </div>
);

/** 黑板底，底部留安全区 */
export const BoardFrame: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: COLORS.board,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 300,
    }}
  >
    {children}
  </div>
);

/** hook：封面帧（第 0 帧即是封面）→ 复利题 + 红笔圈问号 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const coverOut = interpolate(frame, [f(1.6), f(2.1)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const quizIn = interpolate(frame, [f(2.0), f(2.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const circle = interpolate(frame, [f(4.2), f(5.0)], [0, 1], {
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
              fontSize: 118,
              color: INK,
              letterSpacing: 4,
              padding: "0 30px",
              whiteSpace: "nowrap",
            }}
          >
            你以为你懂了？
            <svg
              width={270}
              height={40}
              viewBox="0 0 270 40"
              style={{
                position: "absolute",
                left: 152,
                top: "50%",
                marginTop: -18,
                rotate: "-2deg",
              }}
            >
              <path
                d="M 8 22 Q 90 10 160 18 T 262 16"
                fill="none"
                stroke={COLORS.red}
                strokeWidth={9}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            style={{
              marginTop: 70,
              fontFamily: KAITI,
              fontSize: 52,
              color: COLORS.sage,
              letterSpacing: 4,
            }}
          >
            费曼学习法 · 一个 AI 陪练
          </div>
        </PaperFrame>
      </div>

      {/* 正题：复利考题 */}
      <div style={{ position: "absolute", inset: 0, opacity: quizIn }}>
        <PaperFrame>
          <div
            style={{
              fontFamily: KAITI,
              fontSize: 64,
              color: COLORS.sage,
              letterSpacing: 4,
              marginBottom: 50,
            }}
          >
            来，先做一道题
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 88,
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
              fontFamily: HAND,
              fontSize: 56,
              color: INK,
              opacity: interpolate(frame, [f(5.4), f(6.0)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            答不上来？
          </div>
        </PaperFrame>
      </div>
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { BrandMark } from "../../components/BrandMark";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame } from "../xhs/HookScene";

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [Math.round(a * 30), Math.round(b * 30)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

/** method：logo + 方法名（第 0 帧完整静止）+ 注解 + 来源 */
export const MethodScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <BoardFrame>
      {/* 封面元素：第 0 帧完整可见 */}
      <BrandMark size={150} />
      <div
        style={{
          marginTop: 46,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 124,
          color: COLORS.chalk,
          letterSpacing: 8,
        }}
      >
        费曼学习法
      </div>

      <div
        style={{
          marginTop: 56,
          fontFamily: KAITI,
          fontSize: 62,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: fade(frame, 3.2, 4.0),
        }}
      >
        用「讲出来」检验「真懂」
      </div>

      <div
        style={{
          marginTop: 44,
          fontFamily: KAITI,
          fontSize: 46,
          color: COLORS.chalk,
          letterSpacing: 2,
          textAlign: "center",
          lineHeight: 1.7,
          opacity: fade(frame, 5.6, 6.4),
        }}
      >
        并非费曼本人发明
        <br />
        后人从他的教学里提炼
      </div>

      <div
        style={{
          marginTop: 52,
          fontFamily: KAITI,
          fontSize: 34,
          color: COLORS.sage,
          letterSpacing: 2,
          borderLeft: `4px solid ${COLORS.sage}`,
          paddingLeft: 18,
          opacity: fade(frame, 8.6, 9.4),
        }}
      >
        灵感来源：YouTube「费曼学习法」视频（链接见官网）
      </div>
    </BoardFrame>
  );
};

/** standard：熟悉感 ≠ 理解（竖排两个幻觉） */
export const StandardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const dim = interpolate(frame, [f(7.2), f(8.0)], [1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BoardFrame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
          opacity: dim,
        }}
      >
        {["划重点", "反复阅读"].map((text, i) => {
          const strike = interpolate(
            frame,
            [f(3.0 + i * 1.4), f(3.7 + i * 1.4)],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.6, 0, 0.3, 1),
            },
          );
          return (
            <div
              key={text}
              style={{
                position: "relative",
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 104,
                color: COLORS.chalk,
                letterSpacing: 6,
                opacity: fade(frame, 1.0 + i * 0.8, 1.6 + i * 0.8),
                padding: "0 16px",
              }}
            >
              {text}
              <svg
                width={480}
                height={44}
                viewBox="0 0 480 44"
                style={{
                  position: "absolute",
                  left: -12,
                  top: "50%",
                  marginTop: -20,
                  rotate: "-2deg",
                }}
              >
                <path
                  d="M 8 24 Q 160 12 280 20 T 472 18"
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
          );
        })}
      </div>

      <ChalkChars
        text="熟悉感 ≠ 理解"
        delay={f(8.4)}
        stagger={5}
        style={{
          marginTop: 80,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 118,
          color: COLORS.yellow,
          letterSpacing: 6,
        }}
      />
    </BoardFrame>
  );
};

/** gap：执行之难 */
export const GapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  return (
    <BoardFrame>
      <ChalkChars
        text="方法很好，执行很难"
        delay={f(0.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 100,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />
      <div
        style={{
          marginTop: 64,
          fontFamily: KAITI,
          fontSize: 56,
          color: COLORS.yellow,
          letterSpacing: 2,
          textAlign: "center",
          lineHeight: 1.7,
          opacity: fade(frame, 2.6, 3.4),
        }}
      >
        你上哪找一个随时待命、
        <br />
        什么都不懂、还穷追不舍的听众？
      </div>
    </BoardFrame>
  );
};

/** prepare：开场前的功课（卡片竖排） */
export const PrepareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  return (
    <BoardFrame>
      <ChalkChars
        text="开场前，它先做功课"
        delay={f(0.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 92,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          marginTop: 60,
          width: 860,
        }}
      >
        {["搜索查证新概念", "翻你的历史记录"].map((c, i) => (
          <div
            key={c}
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 64,
              color: COLORS.chalk,
              border: `3px solid ${COLORS.sage}66`,
              backgroundColor: "#122119",
              borderRadius: 20,
              padding: "28px 36px",
              textAlign: "center",
              letterSpacing: 3,
              opacity: fade(frame, 2.4 + i * 1.2, 3.2 + i * 1.2),
              translate: `0 ${(1 - fade(frame, 2.4 + i * 1.2, 3.2 + i * 1.2)) * 24}px`,
            }}
          >
            {c}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 56,
          fontFamily: KAITI,
          fontSize: 54,
          color: COLORS.yellow,
          letterSpacing: 3,
          textAlign: "center",
          opacity: fade(frame, 6.4, 7.2),
        }}
      >
        旧盲区在哪，这次就重点追问哪
      </div>
    </BoardFrame>
  );
};

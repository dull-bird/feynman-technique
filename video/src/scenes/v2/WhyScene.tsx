import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, SERIF } from "../../theme";

const WHYS = ["是什么？", "为什么？", "那为什么？"];

/** why：像五岁小孩一样追问——三级下钻 + 两个追问气泡 */
export const WhyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const q1 = interpolate(frame, [f(4.6), f(5.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const q2 = interpolate(frame, [f(6.6), f(7.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const verdict = interpolate(frame, [f(9.4), f(10.2)], [0, 1], {
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
        padding: "0 200px",
      }}
    >
      <ChalkChars
        text="升级版测试：追问为什么"
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

      {/* 三级下钻 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignSelf: "center",
          marginTop: 8,
        }}
      >
        {WHYS.map((w, i) => {
          const o = interpolate(
            frame,
            [f(2.2 + i * 0.8), f(2.8 + i * 0.8)],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={w}
              style={{
                fontFamily: HAND,
                fontSize: 58 - i * 4,
                color: i === 0 ? COLORS.sage : COLORS.yellow,
                marginLeft: i * 90,
                opacity: o,
                translate: `0 ${(1 - o) * 14}px`,
              }}
            >
              {w}
            </div>
          );
        })}
      </div>

      {/* 两个追问气泡 */}
      <div style={{ display: "flex", gap: 60, marginTop: 12 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 44,
            color: COLORS.chalk,
            border: `2px solid ${COLORS.yellow}`,
            borderRadius: 20,
            padding: "20px 34px",
            opacity: q1,
            translate: `0 ${(1 - q1) * 20}px`,
          }}
        >
          银行为什么平白给你钱？
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 44,
            color: COLORS.chalk,
            border: `2px solid ${COLORS.yellow}`,
            borderRadius: 20,
            padding: "20px 34px",
            opacity: q2,
            translate: `0 ${(1 - q2) * 20}px`,
          }}
        >
          为什么不能直接让陌生人下单？
        </div>
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 54,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: verdict,
          marginTop: 8,
        }}
      >
        能讲「是什么」只是表面，能讲「为什么」才算真懂
      </div>
    </div>
  );
};

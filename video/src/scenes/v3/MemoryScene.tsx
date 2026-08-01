import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const HISTORY = [
  { concept: "熵", score: "2 分", blind: "统计解释只背出、不会用", bad: true },
  { concept: "注意力机制", score: "2 → 4", blind: "V 为何不能复用", bad: false },
  { concept: "贝叶斯定理", score: "4 分", blind: "基础概率被忽略", bad: false },
];

/** memory：它记得你的历史——档案时间线 + 迁移题 */
export const MemoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
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
        gap: 40,
        padding: "0 180px",
      }}
    >
      <ChalkChars
        text="它还记得你的历史"
        delay={f(0.3)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 92,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />

      {/* 档案列表 */}
      <div
        style={{
          width: 1180,
          borderRadius: 18,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          padding: "26px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {HISTORY.map((h, i) => (
          <div
            key={h.concept}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 26,
              opacity: fade(1.6 + i * 0.7, 2.2 + i * 0.7),
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 42,
                color: COLORS.chalk,
                width: 300,
                flexShrink: 0,
              }}
            >
              {h.concept}
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 42,
                color: h.bad ? COLORS.red : COLORS.yellow,
                width: 170,
                flexShrink: 0,
              }}
            >
              {h.score}
            </span>
            <span
              style={{
                fontFamily: KAITI,
                fontSize: 34,
                color: COLORS.sage,
              }}
            >
              盲区：{h.blind}
            </span>
          </div>
        ))}
      </div>

      {/* 重新追问 + 迁移题 */}
      <div style={{ display: "flex", gap: 44, marginTop: 6 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 42,
            color: COLORS.chalk,
            border: `2px solid ${COLORS.red}`,
            borderRadius: 16,
            padding: "18px 30px",
            opacity: fade(5.4, 6.2),
            translate: `0 ${(1 - fade(5.4, 6.2)) * 18}px`,
          }}
        >
          旧盲区回填了没有？
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 42,
            color: COLORS.chalk,
            border: `2px solid ${COLORS.yellow}`,
            borderRadius: 16,
            padding: "18px 30px",
            opacity: fade(7.4, 8.2),
            translate: `0 ${(1 - fade(7.4, 8.2)) * 18}px`,
          }}
        >
          用你已懂的，出一道迁移题
        </div>
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 44,
          color: COLORS.yellow,
          letterSpacing: 3,
          opacity: fade(9.2, 10.0),
        }}
      >
        让知识连成网，而不是孤岛
      </div>
    </div>
  );
};

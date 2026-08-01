import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const Bubble: React.FC<{
  who: string;
  text: string;
  accent?: boolean;
  opacity: number;
}> = ({ who, text, accent = false, opacity }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 20,
      opacity,
      translate: `0 ${(1 - opacity) * 18}px`,
    }}
  >
    <span
      style={{
        fontFamily: SERIF,
        fontWeight: 900,
        fontSize: 38,
        color: accent ? COLORS.yellow : COLORS.sage,
        width: 110,
        textAlign: "right",
        flexShrink: 0,
      }}
    >
      {who}
    </span>
    <span
      style={{
        fontFamily: SERIF,
        fontWeight: 600,
        fontSize: 44,
        color: COLORS.chalk,
        letterSpacing: 2,
        backgroundColor: accent ? "transparent" : "#24453A",
        border: accent ? `2px solid ${COLORS.yellow}` : "none",
        borderRadius: 18,
        padding: "18px 30px",
      }}
    >
      {text}
    </span>
  </div>
);

/** demo：两组真实追问 + 通过/盲区两种结局 */
export const DemoScene: React.FC = () => {
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
        gap: 34,
        padding: "0 180px",
      }}
    >
      <ChalkChars
        text="比如——"
        delay={f(0.4)}
        stagger={6}
        style={{
          fontFamily: KAITI,
          fontSize: 56,
          color: COLORS.sage,
          letterSpacing: 3,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Bubble who="你讲" text="复利" opacity={fade(1.4, 2.0)} />
        <Bubble
          who="它问"
          text="银行为什么平白给你钱？"
          accent
          opacity={fade(2.2, 2.8)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Bubble who="你讲" text="注意力机制" opacity={fade(4.6, 5.2)} />
        <Bubble
          who="它问"
          text="Q、K、V 为什么是三套矩阵？"
          accent
          opacity={fade(5.4, 6.0)}
        />
      </div>

      <div style={{ display: "flex", gap: 48, marginTop: 14 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 44,
            color: COLORS.chalk,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 16,
            padding: "18px 34px",
            opacity: fade(8.6, 9.4),
          }}
        >
          讲透了 → 宣布通过
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 44,
            color: COLORS.chalk,
            border: `3px solid ${COLORS.red}`,
            borderRadius: 16,
            padding: "18px 34px",
            opacity: fade(10.2, 11.0),
          }}
        >
          讲不透 → 指出盲区，给提示
        </div>
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 42,
          color: COLORS.sage,
          letterSpacing: 2,
          opacity: fade(11.8, 12.6),
        }}
      >
        但不替你说完
      </div>
    </div>
  );
};

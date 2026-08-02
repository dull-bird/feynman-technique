import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, KAITI, SERIF } from "../../theme";
import { BoardFrame } from "./HookScene";

const Bubble: React.FC<{
  who: string;
  text: string;
  accent?: boolean;
  opacity: number;
  align: "left" | "right";
}> = ({ who, text, accent = false, opacity, align }) => (
  <div
    style={{
      alignSelf: align === "right" ? "flex-end" : "flex-start",
      display: "flex",
      flexDirection: "column",
      alignItems: align === "right" ? "flex-end" : "flex-start",
      gap: 10,
      opacity,
      translate: `0 ${(1 - opacity) * 24}px`,
      maxWidth: 880,
    }}
  >
    <span
      style={{
        fontFamily: KAITI,
        fontSize: 34,
        color: COLORS.sage,
        marginLeft: align === "left" ? 24 : 0,
        marginRight: align === "right" ? 24 : 0,
      }}
    >
      {who}
    </span>
    <span
      style={{
        fontFamily: SERIF,
        fontWeight: 600,
        fontSize: 54,
        color: COLORS.chalk,
        letterSpacing: 2,
        lineHeight: 1.5,
        backgroundColor: accent ? "transparent" : "#24453A",
        border: accent ? `3px solid ${COLORS.yellow}` : "none",
        borderRadius: 24,
        borderBottomLeftRadius: align === "left" ? 6 : 24,
        borderBottomRightRadius: align === "right" ? 6 : 24,
        padding: "20px 34px",
      }}
    >
      {text}
    </span>
  </div>
);

/** product：对话气泡真实演示 → 卡壳 → 盲区+1 */
export const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);
  const fade = (a: number, b: number) =>
    interpolate(frame, [f(a), f(b)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  const circle = interpolate(frame, [f(7.2), f(8.0)], [0, 1], {
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
          width: 920,
        }}
      >
        <Bubble
          who="你讲"
          text="利息滚利息"
          align="right"
          opacity={fade(0.6, 1.2)}
        />
        <Bubble
          who="AI 陪练"
          text="滚，是什么意思？"
          accent
          align="left"
          opacity={fade(1.8, 2.4)}
        />
        <Bubble
          who="AI 陪练"
          text="第一年结束，账户里到底多了什么？"
          accent
          align="left"
          opacity={fade(3.2, 3.8)}
        />
        <div
          style={{
            alignSelf: "flex-end",
            fontFamily: KAITI,
            fontSize: 48,
            color: COLORS.sage,
            opacity: fade(5.2, 5.8),
          }}
        >
          你卡壳了……
        </div>
      </div>

      <div
        style={{
          position: "relative",
          marginTop: 44,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 84,
          color: COLORS.red,
          letterSpacing: 4,
          padding: "0 26px",
          opacity: fade(6.4, 7.0),
        }}
      >
        盲区 +1
        <svg
          width={360}
          height={160}
          viewBox="0 0 360 160"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: -180,
            marginTop: -84,
            rotate: "-3deg",
            pointerEvents: "none",
          }}
        >
          <path
            d="M 180 12 C 270 8 340 42 338 82 C 336 122 264 148 176 146 C 90 144 20 118 20 78 C 20 40 96 12 184 12"
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

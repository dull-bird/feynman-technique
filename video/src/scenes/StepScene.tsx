import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../components/Chalk";
import { COLORS, HAND, SERIF } from "../theme";

/**
 * 8–25s：四个步骤场景。
 * 大号手写序号 + 衬线标题逐字写出 + 一句短说明。
 * circleLast=2 时，标题最后两个字会被红笔画圈（识别盲区）。
 */
export const StepScene: React.FC<{
  num: string;
  title: string;
  sub: string;
  circleLast?: number;
}> = ({ num, title, sub, circleLast = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numSpring = spring({
    frame: frame - 2,
    fps,
    config: { damping: 13, stiffness: 140, mass: 0.8 },
  });

  const subOpacity = interpolate(frame, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [26, 40], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // 红圈动画：标题写完后开始画
  const circle = interpolate(frame, [34, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.5, 0, 0.3, 1),
  });

  const plainTitle =
    circleLast > 0 ? title.slice(0, title.length - circleLast) : title;
  const circled = circleLast > 0 ? title.slice(title.length - circleLast) : "";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}
    >
      <div
        style={{
          fontFamily: HAND,
          fontSize: 210,
          lineHeight: 1,
          color: COLORS.yellow,
          opacity: Math.min(1, Math.max(0, numSpring * 1.5)),
          scale: 0.55 + 0.45 * numSpring,
          rotate: `${(1 - numSpring) * -10}deg`,
        }}
      >
        {num}
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 128,
          color: COLORS.chalk,
          letterSpacing: 10,
          display: "flex",
          alignItems: "center",
        }}
      >
        {plainTitle && (
          <ChalkChars text={plainTitle} delay={10} stagger={5} />
        )}
        {circled && (
          <span style={{ position: "relative", padding: "0 14px" }}>
            <ChalkChars
              text={circled}
              delay={10 + plainTitle.length * 5}
              stagger={5}
            />
            <svg
              width={360}
              height={190}
              viewBox="0 0 360 190"
              style={{
                position: "absolute",
                left: -40,
                top: "50%",
                marginTop: -102,
                rotate: "-3deg",
                pointerEvents: "none",
              }}
            >
              <path
                d="M 180 16 C 282 10 348 46 346 96 C 344 148 268 178 176 176 C 88 174 16 146 16 94 C 16 44 92 12 190 14"
                fill="none"
                stroke={COLORS.red}
                strokeWidth={8}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - circle}
              />
            </svg>
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 50,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: subOpacity,
          translate: `0 ${subY}px`,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

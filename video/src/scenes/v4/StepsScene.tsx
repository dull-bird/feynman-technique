import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, SERIF } from "../../theme";

const T = {
  zh: {
    steps: ["写下概念", "讲给外行", "识别盲区", "简化类比"],
    loop: "循环，直到全程顺畅",
  },
  en: {
    steps: ["Write it down", "Teach a layperson", "Spot the gaps", "Simplify & analogize"],
    loop: "Loop until it flows",
  },
};

/** steps：四步 + 循环箭头 */
export const StepsScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];

  const loopDraw = interpolate(frame, [f(11.6), f(13.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
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
        gap: 56,
      }}
    >
      <ChalkChars
        text={lang === "zh" ? "方法只有四步" : "Just four steps"}
        delay={f(0.4)}
        stagger={lang === "zh" ? 5 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 110 : 92,
          color: COLORS.chalk,
          letterSpacing: 5,
        }}
      />

      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {t.steps.map((name, i) => {
          const s = spring({
            frame: frame - f(2.2) - i * 20,
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.7 },
          });
          return (
            <div
              key={name}
              style={{
                width: lang === "zh" ? 360 : 400,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 26}px`,
              }}
            >
              <span
                style={{ fontFamily: HAND, fontSize: 84, color: COLORS.yellow }}
              >
                {`0${i + 1}`}
              </span>
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: lang === "zh" ? 52 : 38,
                  color: COLORS.chalk,
                  letterSpacing: lang === "zh" ? 3 : 1,
                  textAlign: "center",
                }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width={90} height={90} viewBox="0 0 120 120">
          <path
            d="M 60 14 A 46 46 0 1 1 59.9 14"
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={8}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - loopDraw}
          />
          <path
            d="M 60 2 L 78 14 L 60 26 Z"
            fill={COLORS.yellow}
            opacity={loopDraw >= 1 ? 1 : 0}
          />
        </svg>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 56,
            color: COLORS.yellow,
            letterSpacing: 3,
            opacity: interpolate(frame, [f(13.2), f(14.0)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {t.loop}
        </span>
      </div>
    </div>
  );
};

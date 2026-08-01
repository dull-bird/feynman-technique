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

const INPUTS = ["读论文", "看文档", "学新框架"];

/** workflow1：别划线收藏就算完——打开它，讲十分钟 */
export const Workflow1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 52,
      }}
    >
      <ChalkChars
        text="别划线收藏就算完"
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

      <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
        <div style={{ display: "flex", gap: 28 }}>
          {INPUTS.map((t, i) => {
            const s = spring({
              frame: frame - f(2.2) - i * 8,
              fps,
              config: { damping: 15, stiffness: 160, mass: 0.7 },
            });
            return (
              <div
                key={t}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 46,
                  color: COLORS.chalk,
                  border: `2px solid ${COLORS.sage}66`,
                  backgroundColor: "#122119",
                  borderRadius: 16,
                  padding: "18px 30px",
                  opacity: Math.min(1, Math.max(0, s * 1.5)),
                  translate: `0 ${(1 - s) * 22}px`,
                }}
              >
                {t}
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 64,
            color: COLORS.yellow,
            opacity: interpolate(frame, [f(4.4), f(5.0)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          →
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 64,
            color: COLORS.yellow,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 18,
            padding: "18px 36px",
            opacity: interpolate(frame, [f(5.0), f(5.8)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          打开它，讲十分钟
        </div>
      </div>

      <div
        style={{
          position: "relative",
          fontFamily: HAND,
          fontSize: 54,
          color: COLORS.chalk,
          opacity: interpolate(frame, [f(7.4), f(8.2)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        讲不顺 = 回去重读
        <svg
          width={460}
          height={20}
          viewBox="0 0 460 20"
          style={{ position: "absolute", left: 0, bottom: -14 }}
        >
          <path
            d="M 6 12 Q 150 4 260 10 T 454 8"
            fill="none"
            stroke={COLORS.red}
            strokeWidth={6}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - interpolate(frame, [f(8.4), f(9.2)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.5, 0, 0.3, 1),
            })}
          />
        </svg>
      </div>
    </div>
  );
};

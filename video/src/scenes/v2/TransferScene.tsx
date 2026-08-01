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

const DOMAINS = [
  { name: "编程", q: "为什么用循环，而不是复制五十行" },
  { name: "商业", q: "亚马逊的飞轮为什么转得起来" },
  { name: "理财", q: "指数基金为什么通常跑赢个股" },
];

/** transfer：三个领域卡片汇聚到「底层原理」 */
export const TransferScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const converge = interpolate(frame, [f(9.6), f(11.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });
  const coreIn = interpolate(frame, [f(11.4), f(12.2)], [0, 1], {
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
        gap: 48,
        padding: "0 140px",
      }}
    >
      <ChalkChars
        text="同一套方法，迁移到任何地方"
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

      <div style={{ display: "flex", gap: 48 }}>
        {DOMAINS.map((d, i) => {
          const s = spring({
            frame: frame - f(2.6) - i * 18,
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.7 },
          });
          return (
            <div
              key={d.name}
              style={{
                width: 470,
                borderRadius: 20,
                border: `2px solid ${COLORS.sage}66`,
                backgroundColor: "#122119",
                padding: "30px 34px",
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 30}px`,
              }}
            >
              <div
                style={{
                  fontFamily: HAND,
                  fontSize: 52,
                  color: COLORS.yellow,
                  marginBottom: 14,
                }}
              >
                {d.name}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 36,
                  color: COLORS.chalk,
                  lineHeight: 1.45,
                }}
              >
                {d.q}
              </div>
            </div>
          );
        })}
      </div>

      {/* 汇聚箭头 */}
      <svg width={900} height={90} viewBox="0 0 900 90">
        {[150, 450, 750].map((x) => (
          <path
            key={x}
            d={`M ${x} 6 Q ${x} 60 450 76`}
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - converge}
          />
        ))}
      </svg>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 76,
          color: COLORS.yellow,
          letterSpacing: 10,
          opacity: coreIn,
          scale: 0.7 + 0.3 * coreIn,
          marginTop: -18,
        }}
      >
        底层原理
      </div>
    </div>
  );
};

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

const ACTIONS = [
  { num: "①", text: "挑一件正纠结的事" },
  { num: "②", text: "留出三十分钟" },
  { num: "③", text: "找一个不懂行的听众，边讲边写" },
];

/** practice：落地三动作 + 30 分钟计时环 */
export const PracticeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  // 计时环：画满一圈
  const ring = interpolate(frame, [f(3.4), f(6.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.4, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 130,
        padding: "0 200px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <ChalkChars
          text="落地只有一条主线"
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
        {ACTIONS.map((a, i) => {
          const s = spring({
            frame: frame - f(2.0) - i * 26,
            fps,
            config: { damping: 15, stiffness: 160, mass: 0.7 },
          });
          return (
            <div
              key={a.num}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 22,
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 24}px`,
              }}
            >
              <span
                style={{ fontFamily: HAND, fontSize: 64, color: COLORS.yellow }}
              >
                {a.num}
              </span>
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 54,
                  color: COLORS.chalk,
                  letterSpacing: 3,
                }}
              >
                {a.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* 30 分钟计时环 */}
      <div style={{ position: "relative", width: 260, height: 260 }}>
        <svg width={260} height={260} viewBox="0 0 260 260">
          <circle
            cx={130}
            cy={130}
            r={104}
            fill="none"
            stroke={`${COLORS.sage}44`}
            strokeWidth={10}
          />
          <circle
            cx={130}
            cy={130}
            r={104}
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={10}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - ring}
            transform="rotate(-90 130 130)"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: interpolate(frame, [f(6.0), f(6.6)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 72,
              color: COLORS.chalk,
            }}
          >
            30
          </span>
          <span
            style={{ fontFamily: HAND, fontSize: 34, color: COLORS.sage }}
          >
            分钟
          </span>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, SERIF } from "../../theme";

/** overview：四步预告 */
export const OverviewScene: React.FC = () => {
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
        gap: 56,
      }}
    >
      <ChalkChars
        text="方法只有四步"
        delay={f(0.4)}
        stagger={5}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 128,
          color: COLORS.chalk,
          letterSpacing: 8,
        }}
      />
      <div style={{ display: "flex", gap: 72 }}>
        {["01", "02", "03", "04"].map((n, i) => {
          const s = spring({
            frame: frame - f(1.4) - i * 5,
            fps,
            config: { damping: 14, stiffness: 160, mass: 0.7 },
          });
          return (
            <span
              key={n}
              style={{
                fontFamily: HAND,
                fontSize: 96,
                color: COLORS.yellow,
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                scale: 0.5 + 0.5 * s,
              }}
            >
              {n}
            </span>
          );
        })}
      </div>
      <ChalkChars
        text="暴露理解上的所有盲区"
        delay={f(2.6)}
        stagger={3}
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 56,
          color: COLORS.sage,
          letterSpacing: 4,
        }}
      />
    </div>
  );
};

import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Chalk-style per-character reveal: each glyph floats up and fades in
 * with a light spring, like being written on the board one by one.
 */
export const ChalkChars: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 4, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <span style={{ display: "inline-flex", ...style }}>
      {text.split("").map((ch, i) => {
        const s = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 15, stiffness: 170, mass: 0.7 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: Math.min(1, Math.max(0, s * 1.4)),
              translate: `0 ${(1 - s) * 30}px`,
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** Fades scene content in at the head and out at the tail. */
export const SceneFade: React.FC<{
  durationInFrames: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
}> = ({ durationInFrames, fadeIn = 8, fadeOut = 8, children }) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    fadeIn <= 0 ? 1 : frame / fadeIn,
    fadeOut <= 0 ? 1 : (durationInFrames - 1 - frame) / fadeOut,
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: Math.min(1, Math.max(0, opacity)),
      }}
    >
      {children}
    </div>
  );
};

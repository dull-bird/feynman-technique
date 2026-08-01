import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, KAITI, SERIF } from "../../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";
const CMD = "$ npx skills add dull-bird/feynman-technique -g";

/** install：一行命令（打字机） */
export const InstallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  const typed = Math.round(
    interpolate(frame, [f(0.8), f(3.0)], [0, CMD.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const cursorOn =
    frame >= f(0.8) && Math.floor(frame / 8) % 2 === 0 ? 1 : 0;

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
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 88,
          color: COLORS.chalk,
          letterSpacing: 6,
        }}
      >
        安装只要一行命令
      </div>

      <div
        style={{
          width: 1160,
          borderRadius: 18,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          padding: "34px 44px",
          fontFamily: MONO,
          fontSize: 36,
          whiteSpace: "pre",
          display: "flex",
          alignItems: "center",
          opacity: interpolate(frame, [f(0.3), f(0.8)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <span style={{ color: COLORS.yellow }}>$</span>
        <span style={{ color: COLORS.chalk }}>{CMD.slice(1, typed)}</span>
        <span
          style={{
            display: "inline-block",
            width: 18,
            height: 36,
            marginLeft: 4,
            backgroundColor: COLORS.chalk,
            opacity: cursorOn,
          }}
        />
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 48,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(3.6), f(4.4)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        几秒钟，它就住进你的 agent
      </div>
    </div>
  );
};

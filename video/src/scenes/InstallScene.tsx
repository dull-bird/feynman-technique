import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, HAND } from "../theme";

const MONO = "Menlo, 'SF Mono', 'Courier New', monospace";

const LINE1 = "$ npx skills add dull-bird/feynman-technique -g";

/** 逐字打出一行终端命令（字符串切片打字机），带光标 */
const TypedLine: React.FC<{
  text: string;
  start: number;
  duration: number;
  cursorAfter?: boolean;
}> = ({ text, start, duration, cursorAfter = false }) => {
  const frame = useCurrentFrame();
  const count = Math.round(
    interpolate(frame, [start, start + duration], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typing = frame >= start && frame < start + duration;
  const showCursor = typing || cursorAfter;
  const cursorOpacity =
    showCursor && Math.floor(frame / 8) % 2 === 0 ? 1 : 0;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ color: COLORS.yellow }}>{text.slice(0, 1)}</span>
      <span style={{ color: COLORS.chalk }}>
        {text.slice(1, count)}
      </span>
      <span
        style={{
          display: "inline-block",
          width: 18,
          height: 38,
          marginLeft: 4,
          backgroundColor: COLORS.chalk,
          opacity: frame >= start ? cursorOpacity : 0,
        }}
      />
    </div>
  );
};

/** 30–37s：安装场景——终端窗口逐字打出单行 npx 命令 */
export const InstallScene: React.FC = () => {
  const frame = useCurrentFrame();

  const cardIn = interpolate(frame, [4, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const noteIn = interpolate(frame, [100, 116], [0, 1], {
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
      }}
    >
      <div
        style={{
          fontFamily: HAND,
          fontSize: 76,
          color: COLORS.yellow,
          letterSpacing: 6,
          opacity: interpolate(frame, [0, 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        一行命令，装好听众
      </div>

      {/* 终端窗口 */}
      <div
        style={{
          width: 1160,
          borderRadius: 20,
          backgroundColor: "#122119",
          border: `2px solid ${COLORS.sage}44`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          opacity: cardIn,
          translate: `0 ${(1 - cardIn) * 30}px`,
          overflow: "hidden",
        }}
      >
        {/* 窗口标题栏 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 26px",
            borderBottom: `1px solid ${COLORS.sage}33`,
          }}
        >
          {[COLORS.red, COLORS.yellow, COLORS.sage].map((c) => (
            <div
              key={c}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: c,
                opacity: 0.85,
              }}
            />
          ))}
          <span
            style={{
              marginLeft: 16,
              fontFamily: MONO,
              fontSize: 24,
              color: COLORS.sage,
            }}
          >
            terminal
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            padding: "44px 48px 56px",
            fontFamily: MONO,
            fontSize: 36,
            lineHeight: 1.3,
            whiteSpace: "pre",
          }}
        >
          <TypedLine text={LINE1} start={24} duration={46} cursorAfter />
        </div>
      </div>

      {/* 手写批注 */}
      <div
        style={{
          fontFamily: HAND,
          fontSize: 52,
          color: COLORS.chalk,
          opacity: noteIn,
          translate: `0 ${(1 - noteIn) * 16}px`,
        }}
      >
        装完就开口——剩下的交给对话
      </div>
    </div>
  );
};

import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, KAITI, SERIF } from "../../theme";

const T = {
  zh: {
    head: "把整套方法，做成体系",
    ai: "扮演听众的 AI",
    aiSub: "零基础，但逻辑严谨",
    scripts: "记录与追踪的脚本",
    scriptsSub: "落账、评分、追踪盲区",
  },
  en: {
    head: "The whole method, as a system",
    ai: "An AI that plays the listener",
    aiSub: "Knows nothing, but thinks rigorously",
    scripts: "Scripts that record & track",
    scriptsSub: "Logging, scoring, gap tracking",
  },
};

/** system：AI 听众 + 脚本体系 */
export const SystemScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);
  const t = T[lang];

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
        text={t.head}
        delay={f(0.4)}
        stagger={lang === "zh" ? 4 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 100 : 80,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        {[
          { title: t.ai, sub: t.aiSub, at: 2.4 },
          { title: t.scripts, sub: t.scriptsSub, at: 4.0 },
        ].map((c, i) => {
          const s = spring({
            frame: frame - f(c.at),
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.7 },
          });
          return (
            <React.Fragment key={c.title}>
              {i === 1 && (
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: 72,
                    color: COLORS.yellow,
                    opacity: interpolate(frame, [f(3.2), f(3.8)], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    }),
                  }}
                >
                  +
                </div>
              )}
              <div
                style={{
                  width: 560,
                  borderRadius: 20,
                  backgroundColor: "#122119",
                  border: `2px solid ${COLORS.yellow}88`,
                  padding: "34px 40px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  opacity: Math.min(1, Math.max(0, s * 1.5)),
                  translate: `0 ${(1 - s) * 26}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: 48,
                    color: COLORS.chalk,
                    letterSpacing: 2,
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    fontFamily: KAITI,
                    fontSize: 36,
                    color: COLORS.sage,
                  }}
                >
                  {c.sub}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

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
    head: "流程纪律：状态机盯着每一步",
    steps: ["准备", "追问", "收尾", "落账"],
    foot: "一步不漏，一步不乱",
  },
  en: {
    head: "Discipline: a state machine watches every step",
    steps: ["Prepare", "Probe", "Wrap up", "Log"],
    foot: "Nothing skipped, nothing out of order",
  },
};

/** discipline：状态机流程 */
export const DisciplineScene: React.FC<{ lang: "zh" | "en" }> = ({ lang }) => {
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
        gap: 64,
      }}
    >
      <ChalkChars
        text={t.head}
        delay={f(0.4)}
        stagger={lang === "zh" ? 3 : 2}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: lang === "zh" ? 84 : 64,
          color: COLORS.chalk,
          letterSpacing: 4,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {t.steps.map((name, i) => {
          const s = spring({
            frame: frame - f(2.4) - i * 10,
            fps,
            config: { damping: 15, stiffness: 160, mass: 0.7 },
          });
          return (
            <React.Fragment key={name}>
              {i > 0 && (
                <span
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: 48,
                    color: COLORS.sage,
                    opacity: Math.min(1, Math.max(0, s)),
                  }}
                >
                  →
                </span>
              )}
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: lang === "zh" ? 56 : 44,
                  color: COLORS.chalk,
                  border: `3px solid ${COLORS.yellow}`,
                  borderRadius: 18,
                  padding: "22px 38px",
                  letterSpacing: lang === "zh" ? 4 : 1,
                  opacity: Math.min(1, Math.max(0, s * 1.5)),
                  scale: 0.7 + 0.3 * s,
                }}
              >
                {name}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: KAITI,
          fontSize: 52,
          color: COLORS.yellow,
          letterSpacing: 4,
          opacity: interpolate(frame, [f(5.6), f(6.4)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {t.foot}
      </div>
    </div>
  );
};

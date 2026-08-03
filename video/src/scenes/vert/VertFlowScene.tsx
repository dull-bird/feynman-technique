import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChalkChars } from "../../components/Chalk";
import { COLORS, HAND, KAITI, SERIF } from "../../theme";
import { BoardFrame } from "../xhs/HookScene";

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [Math.round(a * 30), Math.round(b * 30)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

/** steps：四步竖排卡片 + 循环 */
export const StepsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const loopDraw = interpolate(frame, [f(11.6), f(13.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.35, 1),
  });

  return (
    <BoardFrame>
      <ChalkChars
        text="方法只有四步"
        delay={f(0.4)}
        stagger={5}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 96,
          color: COLORS.chalk,
          letterSpacing: 5,
          marginBottom: 48,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 26,
          width: 820,
        }}
      >
        {["写下概念", "讲给外行", "识别盲区", "简化类比"].map((name, i) => {
          const s = spring({
            frame: frame - f(2.2) - i * 20,
            fps,
            config: { damping: 15, stiffness: 160, mass: 0.7 },
          });
          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 30,
                backgroundColor: "#122119",
                border: `2px solid ${COLORS.sage}44`,
                borderRadius: 20,
                padding: "24px 36px",
                opacity: Math.min(1, Math.max(0, s * 1.5)),
                translate: `0 ${(1 - s) * 34}px`,
              }}
            >
              <span
                style={{ fontFamily: HAND, fontSize: 68, color: COLORS.yellow }}
              >
                {`0${i + 1}`}
              </span>
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 60,
                  color: COLORS.chalk,
                  letterSpacing: 3,
                }}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 44,
          display: "flex",
          alignItems: "center",
          gap: 22,
        }}
      >
        <svg width={76} height={76} viewBox="0 0 120 120">
          <path
            d="M 60 14 A 46 46 0 1 1 59.9 14"
            fill="none"
            stroke={COLORS.yellow}
            strokeWidth={9}
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
            opacity: fade(frame, 13.0, 13.8),
          }}
        >
          循环，直到全程顺畅
        </span>
      </div>
    </BoardFrame>
  );
};

/** system：AI 听众 + 脚本（竖排 + 号） */
export const SystemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const cards = [
    { title: "扮演听众的 AI", sub: "零基础，但逻辑严谨", at: 2.4 },
    { title: "记录与追踪的脚本", sub: "落账、评分、追踪盲区", at: 4.4 },
  ];

  return (
    <BoardFrame>
      <ChalkChars
        text="把整套方法，做成体系"
        delay={f(0.4)}
        stagger={4}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 88,
          color: COLORS.chalk,
          letterSpacing: 4,
          marginBottom: 52,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        {cards.map((c, i) => {
          const s = spring({
            frame: frame - f(c.at),
            fps,
            config: { damping: 15, stiffness: 150, mass: 0.7 },
          });
          return (
            <React.Fragment key={c.title}>
              {i === 1 && (
                <span
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: 56,
                    color: COLORS.yellow,
                    opacity: fade(frame, 3.4, 4.0),
                  }}
                >
                  +
                </span>
              )}
              <div
                style={{
                  width: 840,
                  borderRadius: 20,
                  backgroundColor: "#122119",
                  border: `2px solid ${COLORS.yellow}88`,
                  padding: "30px 38px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  opacity: Math.min(1, Math.max(0, s * 1.5)),
                  translate: `0 ${(1 - s) * 28}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 900,
                    fontSize: 58,
                    color: COLORS.chalk,
                    letterSpacing: 2,
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{ fontFamily: KAITI, fontSize: 42, color: COLORS.sage }}
                >
                  {c.sub}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </BoardFrame>
  );
};

/** usage：你讲它问（气泡竖排） */
export const UsageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = (s: number) => Math.round(s * 30);

  return (
    <BoardFrame>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
        <ChalkChars
          text="你讲"
          delay={f(0.4)}
          stagger={8}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 124,
            color: COLORS.chalk,
            letterSpacing: 5,
          }}
        />
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 72,
            color: COLORS.yellow,
          }}
        >
          ·
        </span>
        <ChalkChars
          text="它问"
          delay={f(1.4)}
          stagger={8}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 124,
            color: COLORS.yellow,
            letterSpacing: 5,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          marginTop: 52,
          opacity: fade(frame, 3.4, 4.2),
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 56,
            color: COLORS.chalk,
            backgroundColor: "#24453A",
            borderRadius: 18,
            padding: "18px 34px",
          }}
        >
          复利
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 52,
            color: COLORS.yellow,
          }}
        >
          ↓
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 56,
            color: COLORS.chalk,
            border: `3px solid ${COLORS.yellow}`,
            borderRadius: 18,
            padding: "18px 34px",
          }}
        >
          银行为什么平白给你钱？
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginTop: 48,
          width: 860,
        }}
      >
        {[
          { t: "讲透了 → 宣布通过", c: COLORS.yellow, at: 6.6 },
          { t: "讲不透 → 指出盲区", c: COLORS.red, at: 7.8 },
        ].map((o) => (
          <div
            key={o.t}
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 54,
              color: COLORS.chalk,
              border: `3px solid ${o.c}`,
              borderRadius: 18,
              padding: "20px 34px",
              textAlign: "center",
              opacity: fade(frame, o.at, o.at + 0.8),
            }}
          >
            {o.t}
          </div>
        ))}
      </div>
    </BoardFrame>
  );
};

/** discipline：状态机四步竖排 */
export const DisciplineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  return (
    <BoardFrame>
      <ChalkChars
        text="流程纪律：状态机盯着每一步"
        delay={f(0.4)}
        stagger={3}
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 72,
          color: COLORS.chalk,
          letterSpacing: 3,
          marginBottom: 48,
          textAlign: "center",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        {["准备", "追问", "收尾", "落账"].map((name, i) => {
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
                    fontSize: 40,
                    color: COLORS.sage,
                    opacity: Math.min(1, Math.max(0, s)),
                  }}
                >
                  ↓
                </span>
              )}
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 64,
                  color: COLORS.chalk,
                  border: `3px solid ${COLORS.yellow}`,
                  borderRadius: 18,
                  padding: "18px 64px",
                  letterSpacing: 4,
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
          marginTop: 48,
          fontFamily: KAITI,
          fontSize: 54,
          color: COLORS.yellow,
          letterSpacing: 4,
          opacity: fade(frame, 6.8, 7.6),
        }}
      >
        一步不漏，一步不乱
      </div>
    </BoardFrame>
  );
};

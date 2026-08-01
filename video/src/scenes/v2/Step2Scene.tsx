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

/** step2：讲给外行 + 床单/保龄球/弹珠引力示意（粉笔线条） */
export const Step2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * 30);

  const num = spring({
    frame: frame - f(0.3),
    fps,
    config: { damping: 13, stiffness: 140, mass: 0.8 },
  });

  // 床单凹陷 + 保龄球落下
  const sag = interpolate(frame, [f(5.0), f(7.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.3, 0, 0.3, 1),
  });
  // 弹珠沿床单滚向保龄球
  const roll = interpolate(frame, [f(7.6), f(10.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });
  const gravityIn = interpolate(frame, [f(10.4), f(11.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const testIn = interpolate(frame, [f(12.6), f(13.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 床单曲线路径：凹陷深度随 sag 增加
  const d = 90 * sag;
  const sheetPath = `M 120 150 Q 550 ${150 + d * 2.2} 980 150`;
  // 弹珠：沿二次贝塞尔从左侧滚向中心（t: 0.06 → 0.42）
  const tt = 0.06 + 0.36 * roll;
  const bezierX =
    (1 - tt) * (1 - tt) * 120 + 2 * (1 - tt) * tt * 550 + tt * tt * 980;
  const bezierY = 150 + 4.4 * d * tt * (1 - tt);
  const marbleX = bezierX;
  const marbleY = bezierY - 16; // 半径 14，贴在床单上

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        padding: "0 160px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 32 }}>
        <span
          style={{
            fontFamily: HAND,
            fontSize: 130,
            color: COLORS.yellow,
            opacity: Math.min(1, Math.max(0, num * 1.5)),
            scale: 0.55 + 0.45 * num,
          }}
        >
          02
        </span>
        <ChalkChars
          text="讲给外行"
          delay={f(0.8)}
          stagger={5}
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 110,
            color: COLORS.chalk,
            letterSpacing: 8,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 46,
          color: COLORS.sage,
          letterSpacing: 3,
          opacity: interpolate(frame, [f(2.0), f(2.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        不说「时空弯曲」，说一张床单
      </div>

      {/* 床单 + 保龄球 + 弹珠 */}
      <svg width={1100} height={320} viewBox="0 0 1100 320">
        {/* 床单 */}
        <path
          d={sheetPath}
          fill="none"
          stroke={COLORS.chalk}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* 保龄球 */}
        <g opacity={sag}>
          <circle
            cx={550}
            cy={150 + d * 1.1 + 34}
            r={42}
            fill={COLORS.yellow}
          />
          <text
            x={640}
            y={150 + d * 1.1 + 48}
            fill={COLORS.sage}
            fontSize={30}
            fontFamily={HAND}
          >
            保龄球
          </text>
        </g>
        {/* 弹珠 */}
        <g opacity={roll > 0.02 ? 1 : 0}>
          <circle cx={marbleX} cy={marbleY} r={14} fill={COLORS.chalk} />
          <text
            x={marbleX - 22}
            y={marbleY - 26}
            fill={COLORS.sage}
            fontSize={28}
            fontFamily={HAND}
          >
            弹珠
          </text>
        </g>
        {/* 引力标注 */}
        <text
          x={550}
          y={308}
          textAnchor="middle"
          fill={COLORS.yellow}
          fontSize={44}
          fontFamily={HAND}
          opacity={gravityIn}
        >
          —— 这就是引力
        </text>
      </svg>

      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 52,
          color: COLORS.chalk,
          letterSpacing: 3,
          opacity: testIn,
        }}
      >
        对方能复述，才算你讲懂了
      </div>
    </div>
  );
};

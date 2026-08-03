import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, HAND, KAITI, SERIF } from "../../theme";
import { PaperFrame } from "../xhs/HookScene";

const INK = "#1A2E26";

/** 真实对话实录标签 */
const RealTag: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 90,
      fontFamily: SERIF,
      fontWeight: 900,
      fontSize: 36,
      color: COLORS.red,
      letterSpacing: 4,
      border: `2px solid ${COLORS.red}`,
      borderRadius: 10,
      padding: "8px 20px",
      rotate: "-2deg",
    }}
  >
    真实对话实录 · 双 AI
  </div>
);

/** 对话气泡：你 = 白纸墨字（右侧），听众 = 黄框（左侧） */
const Bubble: React.FC<{
  who: "你" | "听众";
  text: string;
  opacity: number;
}> = ({ who, text, opacity }) => {
  const mine = who === "你";
  return (
    <div
      style={{
        alignSelf: mine ? "flex-end" : "flex-start",
        display: "flex",
        flexDirection: "column",
        alignItems: mine ? "flex-end" : "flex-start",
        gap: 10,
        opacity,
        translate: `0 ${(1 - opacity) * 24}px`,
        maxWidth: 900,
      }}
    >
      <span
        style={{
          fontFamily: KAITI,
          fontSize: 32,
          color: mine ? COLORS.sage : "#B8892D",
          marginLeft: mine ? 0 : 22,
          marginRight: mine ? 22 : 0,
        }}
      >
        {mine ? "你（应答）" : "听众（出题）"}
      </span>
      <span
        style={{
          fontFamily: KAITI,
          fontSize: 42,
          lineHeight: 1.65,
          letterSpacing: 1,
          color: mine ? INK : COLORS.chalk,
          backgroundColor: mine ? "#FFFFFF" : "transparent",
          border: mine ? "2px solid #1A2E2622" : `3px solid ${COLORS.yellow}`,
          borderRadius: 22,
          borderBottomLeftRadius: mine ? 22 : 6,
          borderBottomRightRadius: mine ? 6 : 22,
          padding: "22px 32px",
          boxShadow: mine ? "0 8px 24px rgba(0,0,0,0.10)" : undefined,
        }}
      >
        {text}
      </span>
    </div>
  );
};

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [Math.round(a * 30), Math.round(b * 30)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const ActShell: React.FC<{
  dark?: boolean;
  children: React.ReactNode;
}> = ({ dark = false, children }) =>
  dark ? (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: COLORS.board,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 300,
          padding: "0 70px 300px",
          gap: 30,
        }}
      >
        {children}
      </div>
    </div>
  ) : (
    <div style={{ position: "absolute", inset: 0 }}>
      <PaperFrame>
        <RealTag />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            width: 940,
          }}
        >
          {children}
        </div>
      </PaperFrame>
    </div>
  );

/** act1：你的错答案 */
export const Act1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <ActShell>
      <Bubble
        who="你"
        text="复利嘛……然后每年的利息都是按你最开始存的那笔本金算的，所以每年拿的钱一样多，稳稳往上涨。"
        opacity={fade(frame, 0.6, 1.4)}
      />
      <div
        style={{
          alignSelf: "flex-end",
          fontFamily: HAND,
          fontSize: 52,
          color: COLORS.red,
          rotate: "-2deg",
          opacity: fade(frame, 3.6, 4.2),
        }}
      >
        每年一样多？
      </div>
    </ActShell>
  );
};

/** act2：听众追问 */
export const Act2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <ActShell dark>
      <Bubble
        who="听众"
        text="你说『每年的利息都是按你最开始存的那笔本金算的』，那第二年的利息为什么不会把第一年的利息也算进去？请用存入 100 元、年利率 10% 的具体数字，讲清楚复利和这种算法有什么不同。"
        opacity={fade(frame, 0.6, 1.4)}
      />
    </ActShell>
  );
};

/** act3：卡壳 + 提示 */
export const Act3Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <ActShell>
      <Bubble
        who="你"
        text="呃……我原来想的是还是 10 块，因为本金没变嘛？……说实话我一直以为这两种叫法是一回事"
        opacity={fade(frame, 0.6, 1.4)}
      />
      <div
        style={{
          alignSelf: "flex-start",
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 56,
          color: "#B8892D",
          border: `3px solid ${COLORS.yellow}`,
          borderRadius: 18,
          padding: "18px 32px",
          opacity: fade(frame, 5.4, 6.2),
        }}
      >
        它只提示一句：重点是，利滚利
      </div>
    </ActShell>
  );
};

/** act4：重算 110 → 121 → 133.1 */
export const Act4Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <ActShell>
      <Bubble
        who="你"
        text="第一年末 100 加 10，是 110 块；第二年末就不是 120 了，是 110 的 10% 也就是 11 块利息，总共 121 块；第三年末 121 加 12 块 1，是 133 块 1……"
        opacity={fade(frame, 0.6, 1.4)}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          alignSelf: "center",
          opacity: fade(frame, 5.6, 6.4),
        }}
      >
        {["110", "121", "133.1"].map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && (
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 52,
                  color: COLORS.sage,
                }}
              >
                →
              </span>
            )}
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 72,
                color: "#B8892D",
              }}
            >
              {n}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div
        style={{
          alignSelf: "center",
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 56,
          color: INK,
          letterSpacing: 2,
          opacity: fade(frame, 8.6, 9.4),
        }}
      >
        多出来的，全是利息生的利息
      </div>
    </ActShell>
  );
};

/** act5：逼问四连 + 我都接住了 */
export const Act5Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const questions = [
    "利息取走一半呢？",
    "十年后多少？",
    "260 拆成本金和利息？",
    "半年结息呢？",
  ];
  return (
    <ActShell dark>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          width: 880,
        }}
      >
        {questions.map((q, i) => (
          <div
            key={q}
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 52,
              color: COLORS.chalk,
              border: `3px solid ${COLORS.yellow}`,
              borderRadius: 18,
              padding: "20px 34px",
              letterSpacing: 2,
              opacity: fade(frame, 0.8 + i * 0.8, 1.4 + i * 0.8),
              translate: `0 ${(1 - fade(frame, 0.8 + i * 0.8, 1.4 + i * 0.8)) * 24}px`,
            }}
          >
            {q}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 96,
          color: COLORS.yellow,
          letterSpacing: 5,
          opacity: fade(frame, 5.8, 6.6),
        }}
      >
        我都接住了
      </div>
    </ActShell>
  );
};

import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadZhiMangXing } from "@remotion/google-fonts/ZhiMangXing";

// Design tokens shared with the website
export const COLORS = {
  board: "#1A2E26", // 深黑板绿背景
  chalk: "#F2EFE4", // 粉笔白
  yellow: "#E9C46A", // 强调黄
  red: "#D64533", // 红笔批注红
  sage: "#7FA08C", // 辅助灰绿
};

const serif = loadNotoSerifSC("normal", {
  weights: ["600", "900"],
});
const hand = loadZhiMangXing("normal", {
  weights: ["400"],
});

export const SERIF = `${serif.fontFamily}, "Songti SC", "STSong", serif`;
export const HAND = `${hand.fontFamily}, "Kaiti SC", "STKaiti", cursive`;

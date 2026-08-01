import React from "react";
import { COLORS, HAND } from "../theme";

/**
 * 网站同款 logo（.brand-mark）：深绿圆形底 + 黄色手写问号，-8° 倾斜。
 * 视频背景同为深绿，加一圈黄色描边保证可见。
 */
export const BrandMark: React.FC<{ size?: number }> = ({ size = 96 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: COLORS.board,
      border: `3px solid ${COLORS.yellow}`,
      display: "grid",
      placeItems: "center",
      rotate: "-8deg",
      fontFamily: HAND,
      fontSize: size * 0.62,
      lineHeight: 1,
      color: COLORS.yellow,
      paddingBottom: size * 0.06,
    }}
  >
    ?
  </div>
);

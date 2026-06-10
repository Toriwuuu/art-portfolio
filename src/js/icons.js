// ===== 全站唯一的 Icon 模組 =====
// 圖示一律使用 Google Material Symbols（Rounded），
// 透過 Vite 的 ?raw 把 SVG 原始碼直接內嵌進 JS。
// SVG 本身是 viewBox="0 -960 960 960"，CSS 用 fill: currentColor 繼承文字顏色。
// 要全站換圖示，只要改這個檔案的對應就好。
import close from '@material-symbols/svg-400/rounded/close.svg?raw'
import arrowBack from '@material-symbols/svg-400/rounded/arrow_back.svg?raw'
import arrowForward from '@material-symbols/svg-400/rounded/arrow_forward.svg?raw'
import arrowUpward from '@material-symbols/svg-400/rounded/arrow_upward.svg?raw'
import keyboardArrowDown from '@material-symbols/svg-400/rounded/keyboard_arrow_down.svg?raw'
import add from '@material-symbols/svg-400/rounded/add.svg?raw'

// 語意名稱 → 圖示
export const icons = {
  close,                        // 關閉燈箱
  prev: arrowBack,              // 上一張
  next: arrowForward,           // 下一張
  top: arrowUpward,             // 回到頁首
  scrollHint: keyboardArrowDown, // 往下捲動提示
  more: add,                    // 顯示更多
}

// 把頁面上所有 <span data-icon="名稱"> 填入對應的 SVG
export function initIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const svg = icons[el.dataset.icon]
    if (svg) el.innerHTML = svg
  })
}

// ===== 全站唯一的 Icon 模組 =====
// 圖示一律使用 Google Material Symbols（Rounded），
// 透過 Vite 的 ?raw 把 SVG 原始碼直接內嵌進 JS。
// SVG 是 viewBox="0 -960 960 960"，CSS 用 fill: currentColor 繼承文字顏色。
import close from '@material-symbols/svg-400/rounded/close.svg?raw'
import tune from '@material-symbols/svg-400/rounded/tune.svg?raw'
import chevronLeft from '@material-symbols/svg-400/rounded/chevron_left.svg?raw'
import chevronRight from '@material-symbols/svg-400/rounded/chevron_right.svg?raw'

// 語意名稱 → 圖示
export const icons = {
  close, // 關閉燈箱
  tune,  // 參數面板開關
  chevronLeft,  // 燈箱上一張
  chevronRight, // 燈箱下一張
}

// 把頁面上所有 <span data-icon="名稱"> 填入對應的 SVG
export function initIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const svg = icons[el.dataset.icon]
    if (svg) el.innerHTML = svg
  })
}

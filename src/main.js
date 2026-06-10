// ===== 入口檔：載入樣式，依序初始化各模組 =====
import './scss/main.scss'
import { initIcons } from './js/icons.js'
import { initMotion } from './js/motion.js'

initIcons()   // 把 data-icon 佔位填入 Material Symbols SVG
initMotion()  // header 隱現、漢堡選單、TOP 按鈕

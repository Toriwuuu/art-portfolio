// ===== 入口檔：載入樣式，依序初始化各模組 =====
import './scss/main.scss'
import { initIcons } from './js/icons.js'
import { initMotion } from './js/motion.js'
import { initGallery } from './js/gallery.js'
import { open as openLightbox } from './js/lightbox.js'
import { initFluidBg } from './js/fluid-bg.js'

initIcons()   // 把 data-icon 佔位填入 Material Symbols SVG

// 先渲染畫廊（動態層要等作品 DOM 存在才能掛進場動畫）
initGallery(openLightbox)

initMotion()  // header 隱現、漢堡選單、GSAP 漂浮 / 視差 / 進場

// 3D 流體背景（不支援 WebGL 或使用者偏好減少動態時自動跳過）
initFluidBg()

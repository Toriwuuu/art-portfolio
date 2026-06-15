// ===== i18n 中／英切換 =====
// 這站是手刻 vanilla JS，所以用一支小模組搞定語言切換，不裝套件。
//
// 用法：
//   import { t, getLang, toggleLang, onLangChange, workName, workDesc } from './i18n.js'
//   t('close')                 // → UI 字串（依當前語言）
//   workName(work) / workDesc(work)  // → 作品名／論述（英文缺則自動 fallback 中文）
//   onLangChange(fn)           // 語言一變就呼叫 fn（元件用來重繪），回傳取消訂閱函式
//   toggleLang()               // 中⇄英
//
// 初始語言：先看 localStorage（使用者上次選的）；沒有就依瀏覽器語言（zh* → 中，其餘 → 英）。
// 切換後寫進 localStorage 記住，並更新 <html lang> 與 SEO meta 描述。

const SAVE_KEY = 'tori-lang'

// ---------- 文字字典 ----------
// UI / SEO 用 zh、en 兩份；作品名與論述放在 data.js（name/name_en、desc/desc_en）。
const STRINGS = {
  zh: {
    // SEO / 文件
    metaDescription: 'Tori 的藝術作品集：插畫與立體裝置作品（2017-2023）。',
    // 載入
    loading: '載入中',
    // 燈箱
    lightboxLabel: '作品檢視',
    close: '關閉',
    prev: '上一張',
    next: '下一張',
    // GUI 觸發鈕
    guiToggle: '調整 3D 參數',
    // GUI 面板
    gui_title: '3D 參數',
    gui_preset: '主題預設',
    gui_presetCustom: '自訂…',
    preset_blush: '桃紅',
    preset_aqua: '清水',
    preset_mercury: '水銀',
    preset_candy: '糖果',
    preset_amber: '琥珀',
    // 背景星雲
    gui_fBg: '背景星雲',
    gui_bgColor: '太空底色',
    gui_bgIntensity: '星雲強度',
    gui_bgScale: '星雲尺度',
    gui_bgSpeed: '流動速度',
    // 玻璃材質
    gui_fGlass: '玻璃材質',
    gui_glassColor: '玻璃本體色',
    gui_roughness: '粗糙度',
    gui_chromaticAberration: '色散',
    gui_anisotropicBlur: '各向異性模糊',
    gui_distortion: '折射扭曲',
    gui_distortionScale: '扭曲尺度',
    gui_temporalDistortion: '扭曲流速',
    gui_thickness: '厚度',
    gui_ior: '折射率',
    gui_attenuationColor: '透色顏色',
    gui_attenuationDistance: '透色距離',
    gui_envMapIntensity: '反射強度',
    // 流體形狀
    gui_fShape: '流體形狀',
    gui_noiseFreq: '皺褶頻率',
    gui_noiseAmp: '起伏幅度',
    gui_flowSpeed: '流動速度',
    gui_mouseRipple: '滑鼠漣漪',
    // 游標與運動
    gui_fMotion: '游標與運動',
    gui_autoRotate: '自轉開關',
    gui_rotateSpeed: '自轉速度',
    gui_mouseLerp: '跟隨慵懶度',
    gui_mouseTilt: '滑鼠傾轉',
    gui_poke: '游標撥開開關',
    gui_pokeDemo: '自動示範',
    gui_pokeDepth: '凹槽深度',
    gui_pokeWidth: '凹槽廣度',
    gui_pokeReboundTime: '回彈時間(秒)',
    gui_pokeSensitivity: '撥開靈敏度',
    gui_pokeTurnSmooth: '轉向柔順',
    // 卡片與運動
    gui_fCards: '卡片與運動',
    gui_showCards: '顯示作品圖片',
    gui_cardRadius: '球半徑',
    gui_cardSize: '卡片大小',
    gui_autoSpeed: '自轉速度',
    gui_carouselEvery: '輪播間隔秒',
    // 燈光
    gui_fLight: '燈光',
    gui_lightColor: '點光顏色',
    gui_lightIntensity: '點光強度',
    // 工具
    gui_copy: '複製目前設定',
    gui_reset: '重設為預設值',
  },
  en: {
    metaDescription: "Tori's art portfolio: illustrations and three-dimensional installations (2017–2023).",
    loading: 'Loading',
    lightboxLabel: 'Artwork viewer',
    close: 'Close',
    prev: 'Previous',
    next: 'Next',
    guiToggle: 'Adjust 3D settings',
    gui_title: '3D Settings',
    gui_preset: 'Theme preset',
    gui_presetCustom: 'Custom…',
    preset_blush: 'Blush',
    preset_aqua: 'Aqua',
    preset_mercury: 'Mercury',
    preset_candy: 'Candy',
    preset_amber: 'Amber',
    gui_fBg: 'Nebula Background',
    gui_bgColor: 'Space color',
    gui_bgIntensity: 'Nebula intensity',
    gui_bgScale: 'Nebula scale',
    gui_bgSpeed: 'Flow speed',
    gui_fGlass: 'Glass Material',
    gui_glassColor: 'Glass color',
    gui_roughness: 'Roughness',
    gui_chromaticAberration: 'Chromatic aberration',
    gui_anisotropicBlur: 'Anisotropic blur',
    gui_distortion: 'Distortion',
    gui_distortionScale: 'Distortion scale',
    gui_temporalDistortion: 'Temporal distortion',
    gui_thickness: 'Thickness',
    gui_ior: 'IOR',
    gui_attenuationColor: 'Attenuation color',
    gui_attenuationDistance: 'Attenuation distance',
    gui_envMapIntensity: 'Env reflection',
    gui_fShape: 'Fluid Shape',
    gui_noiseFreq: 'Noise frequency',
    gui_noiseAmp: 'Noise amplitude',
    gui_flowSpeed: 'Flow speed',
    gui_mouseRipple: 'Mouse ripple',
    gui_fMotion: 'Cursor & Motion',
    gui_autoRotate: 'Auto-rotate',
    gui_rotateSpeed: 'Rotate speed',
    gui_mouseLerp: 'Follow easing',
    gui_mouseTilt: 'Mouse tilt',
    gui_poke: 'Cursor poke',
    gui_pokeDemo: 'Auto demo',
    gui_pokeDepth: 'Poke depth',
    gui_pokeWidth: 'Poke width',
    gui_pokeReboundTime: 'Rebound time (s)',
    gui_pokeSensitivity: 'Poke sensitivity',
    gui_pokeTurnSmooth: 'Turn smoothing',
    gui_fCards: 'Cards & Motion',
    gui_showCards: 'Show artwork images',
    gui_cardRadius: 'Sphere radius',
    gui_cardSize: 'Card size',
    gui_autoSpeed: 'Auto-rotate speed',
    gui_carouselEvery: 'Carousel interval (s)',
    gui_fLight: 'Lighting',
    gui_lightColor: 'Point light color',
    gui_lightIntensity: 'Point light intensity',
    gui_copy: 'Copy current settings',
    gui_reset: 'Reset to defaults',
  },
}

// ---------- 語言狀態 ----------
function detectInitial() {
  const saved = localStorage.getItem(SAVE_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

let lang = detectInitial()
const listeners = new Set()

export function getLang() {
  return lang
}

export function setLang(next) {
  if (next !== 'zh' && next !== 'en' || next === lang) return
  lang = next
  localStorage.setItem(SAVE_KEY, lang)
  applyDocumentLang()
  listeners.forEach((fn) => fn(lang))
}

export function toggleLang() {
  setLang(lang === 'zh' ? 'en' : 'zh')
}

// 訂閱語言變化，回傳取消訂閱用的函式
export function onLangChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---------- 取字串 ----------
// UI 字串：找不到 key 先退回中文，再退回 key 本身（開發時一眼看出漏翻）
export function t(key) {
  const table = STRINGS[lang] || STRINGS.zh
  return table[key] ?? STRINGS.zh[key] ?? key
}

// 縮圖 aria（含張數，需內插）
export function thumbAria(i) {
  return lang === 'en' ? `Image ${i}` : `第 ${i} 張`
}

// 作品名／論述：英文缺就自動 fallback 中文，翻一半也不會壞
export function workName(work) {
  if (lang === 'en') return work.name_en || work.name || work.title || ''
  return work.name || work.title || ''
}

export function workDesc(work) {
  if (lang === 'en') return work.desc_en || work.desc || ''
  return work.desc || ''
}

// ---------- 套用到文件層級 ----------
// <html lang> 與 SEO 描述（標題 "Tori's Artwork" 是品牌名，兩語不變）
export function applyDocumentLang() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant-TW'
  const desc = t('metaDescription')
  document
    .querySelectorAll('meta[name="description"], meta[property="og:description"]')
    .forEach((m) => m.setAttribute('content', desc))
}

// 模組載入時就把 <html lang> / meta 對齊初始語言
applyDocumentLang()

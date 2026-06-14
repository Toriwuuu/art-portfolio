// ===== 燈箱 v2 =====
// 用法：open(work)——傳入 data.js 的一件作品。
// 多圖作品：原圖以「直欄」堆疊，在燈箱內捲動瀏覽（全站唯一可捲動的地方）。
// 關閉方式：右上 X、Esc、點黑底。

import { fullSrc } from './data.js'
import { icons } from './icons.js'

let overlay = null     // 燈箱外層（只建立一次，重複使用）
let lastFocused = null // 開燈箱前的焦點元素，關閉時還回去

// 開／關時可掛場景的暫停與恢復（scene.js 會註冊，省電用）
let onOpenCallback = null
let onCloseCallback = null
export function setSceneHooks({ onOpen, onClose }) {
  onOpenCallback = onOpen
  onCloseCallback = onClose
}

function buildOverlay() {
  overlay = document.createElement('div')
  overlay.className = 'lightbox'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', '作品檢視')
  overlay.hidden = true

  overlay.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="關閉">${icons.close}</button>
    <div class="lightbox-scroll" tabindex="0"></div>
  `
  document.body.appendChild(overlay)

  overlay.querySelector('.lightbox-close').addEventListener('click', close)

  // 點黑底（不是圖片、標題或按鈕）也能關閉
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('lightbox-scroll')) close()
  })

  document.addEventListener('keydown', (e) => {
    if (!overlay.hidden && e.key === 'Escape') close()
  })
}

export function open(work) {
  if (!overlay) buildOverlay()

  lastFocused = document.activeElement

  // 直欄內容：標題 + 該作品所有原圖。
  // 第一張優先載入，其餘 lazy（捲到才下載）；
  // 插畫有提供原圖尺寸，先寫進 width/height 預留位置避免捲動時跳動
  const sizeAttr = work.w && work.h ? `width="${work.w}" height="${work.h}"` : ''
  const imgs = work.files
    .map((file, i) => {
      const loadAttr = i === 0
        ? 'fetchpriority="high"'
        : 'loading="lazy"'
      return `
        <figure>
          <img src="${fullSrc(work, file)}" alt="${work.title}" ${loadAttr} ${sizeAttr} decoding="async">
        </figure>
      `
    })
    .join('')

  overlay.querySelector('.lightbox-scroll').innerHTML = `
    <h2 class="lightbox-title">${work.title}</h2>
    ${imgs}
  `

  overlay.hidden = false
  document.body.classList.add('lightbox-open') // 開燈箱時藏光束游標
  overlay.querySelector('.lightbox-scroll').scrollTop = 0
  overlay.querySelector('.lightbox-close').focus()
  onOpenCallback?.()
}

function close() {
  overlay.hidden = true
  document.body.classList.remove('lightbox-open')
  if (lastFocused) lastFocused.focus()
  onCloseCallback?.()
}

export function isOpen() {
  return !!overlay && !overlay.hidden
}

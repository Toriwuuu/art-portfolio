// ===== 燈箱 v3：左圖右文 =====
// 用法：open(work)——傳入 data.js 的一件作品。
// 左：主圖；多圖時下方有縮圖列，左右方向鍵或點縮圖切換主圖。
// 右：標題、年份、說明（說明讀 work.desc，沒有就不顯示）。
// 關閉方式：右上 X、Esc、點黑底。

import { fullSrc, thumbSrc } from './data.js'
import { icons } from './icons.js'

let overlay = null     // 燈箱外層（只建立一次，重複使用）
let lastFocused = null // 開燈箱前的焦點元素，關閉時還回去
let current = null     // 目前這件作品
let idx = 0            // 目前看到第幾張

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
    <div class="lightbox-stage">
      <div class="lightbox-media">
        <div class="lightbox-frame">
          <button class="lightbox-arrow lightbox-arrow--prev" type="button" aria-label="上一張">${icons.chevronLeft}</button>
          <img class="lightbox-main" alt="" decoding="async">
          <button class="lightbox-arrow lightbox-arrow--next" type="button" aria-label="下一張">${icons.chevronRight}</button>
        </div>
        <div class="lightbox-thumbs"></div>
      </div>
      <div class="lightbox-info">
        <h2 class="lightbox-title"></h2>
        <p class="lightbox-year"></p>
        <p class="lightbox-desc"></p>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  overlay.querySelector('.lightbox-close').addEventListener('click', close)
  overlay.querySelector('.lightbox-arrow--prev').addEventListener('click', () => step(-1))
  overlay.querySelector('.lightbox-arrow--next').addEventListener('click', () => step(1))

  // 點黑底（stage 的空白處）也能關閉
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('lightbox-stage')) close()
  })

  // 鍵盤：Esc 關閉、左右方向鍵切換主圖
  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'ArrowRight') step(1)
  })
}

export function open(work) {
  if (!overlay) buildOverlay()

  lastFocused = document.activeElement
  current = work
  idx = 0

  // ----- 右側文字：標題 / 年份 / 說明 -----
  // 標題優先用作品原名（name），沒有就沿用 title（插畫作品、或年份分組標題）
  overlay.querySelector('.lightbox-title').textContent = work.name || work.title
  const yearEl = overlay.querySelector('.lightbox-year')
  yearEl.textContent = work.year ? String(work.year) : ''
  yearEl.hidden = !work.year
  const descEl = overlay.querySelector('.lightbox-desc')
  descEl.textContent = work.desc || ''
  descEl.hidden = !work.desc

  // ----- 縮圖列（多圖才有）-----
  const multi = work.files.length > 1
  const thumbsEl = overlay.querySelector('.lightbox-thumbs')
  thumbsEl.hidden = !multi
  overlay.querySelectorAll('.lightbox-arrow').forEach((a) => (a.hidden = !multi))
  thumbsEl.innerHTML = multi
    ? work.files
        .map(
          (file, i) => `
            <button class="lightbox-thumb" type="button" data-i="${i}" aria-label="第 ${i + 1} 張">
              <img src="${thumbSrc(work, file)}" alt="" loading="lazy" decoding="async">
            </button>`
        )
        .join('')
    : ''
  thumbsEl.querySelectorAll('.lightbox-thumb').forEach((btn) =>
    btn.addEventListener('click', () => setMain(Number(btn.dataset.i)))
  )

  setMain(0)

  overlay.hidden = false
  document.body.classList.add('lightbox-open') // 藏光束游標
  overlay.querySelector('.lightbox-close').focus()
  onOpenCallback?.()
}

// 切到第 i 張：更新主圖與縮圖高亮（環狀，超過頭就繞回去）
function setMain(i) {
  const n = current.files.length
  idx = ((i % n) + n) % n
  const file = current.files[idx]
  const frame = overlay.querySelector('.lightbox-frame')
  const main = overlay.querySelector('.lightbox-main')

  // 縮圖先當底圖墊著，原圖載好前不會空一塊（漸進顯影）
  frame.style.backgroundImage = `url("${thumbSrc(current, file)}")`
  main.src = fullSrc(current, file)
  main.alt = current.name || current.title

  overlay.querySelectorAll('.lightbox-thumb').forEach((btn, k) =>
    btn.classList.toggle('is-active', k === idx)
  )
  overlay
    .querySelector('.lightbox-thumb.is-active')
    ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
}

function step(dir) {
  if (current && current.files.length > 1) setMain(idx + dir)
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

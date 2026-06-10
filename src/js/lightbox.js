// ===== 燈箱（純 JS，取代 jQuery + Lightbox2）=====
// 用法：open(作品清單, 起始索引)。
// 支援：上一張/下一張、Esc 關閉、方向鍵、點黑底關閉、預載下一張。

import { icons } from './icons.js'

let overlay = null      // 燈箱外層（只建立一次，重複使用）
let currentList = []    // 目前展示中的作品清單
let currentIndex = 0
let lastFocused = null  // 開燈箱前的焦點元素，關閉後還回去

// 第一次使用時把燈箱的 DOM 加進頁面
function buildOverlay() {
  overlay = document.createElement('div')
  overlay.className = 'lightbox'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', '作品檢視')
  overlay.hidden = true

  overlay.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="關閉">${icons.close}</button>
    <button class="lightbox-prev" type="button" aria-label="上一張">${icons.prev}</button>
    <figure class="lightbox-figure">
      <img class="lightbox-img" alt="">
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
    <button class="lightbox-next" type="button" aria-label="下一張">${icons.next}</button>
  `
  document.body.appendChild(overlay)

  overlay.querySelector('.lightbox-close').addEventListener('click', close)
  overlay.querySelector('.lightbox-prev').addEventListener('click', () => step(-1))
  overlay.querySelector('.lightbox-next').addEventListener('click', () => step(1))

  // 點黑底（不是圖片或按鈕）也能關閉
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  // 鍵盤操作
  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowLeft') step(-1)
    if (e.key === 'ArrowRight') step(1)
  })
}

// 顯示第 index 張，並偷偷預載下一張讓切換更順
function show(index) {
  // 頭尾相接：最後一張的下一張回到第一張
  currentIndex = (index + currentList.length) % currentList.length
  const item = currentList[currentIndex]

  const img = overlay.querySelector('.lightbox-img')
  img.src = item.src
  img.alt = item.title || ''
  overlay.querySelector('.lightbox-caption').textContent = item.title || ''

  const next = currentList[(currentIndex + 1) % currentList.length]
  if (next) new Image().src = next.src
}

function step(dir) {
  show(currentIndex + dir)
}

export function open(list, index) {
  if (!overlay) buildOverlay()

  currentList = list
  lastFocused = document.activeElement

  show(index)
  overlay.hidden = false
  document.body.style.overflow = 'hidden' // 鎖住背後頁面的捲動
  overlay.querySelector('.lightbox-close').focus()
}

function close() {
  overlay.hidden = true
  document.body.style.overflow = ''
  // 把焦點還給開燈箱前的元素（無障礙基本功）
  if (lastFocused) lastFocused.focus()
}

// ===== 右上角中／EN 語言切換鈕 =====
// 一顆毛玻璃藥丸，顯示「中 / EN」，當前語言以品牌桃紅高亮、另一個變淡。
// 點擊就切換（只有兩種語言，所以單鍵 toggle 最直覺）。
// 切換時 i18n 會通知所有訂閱者（燈箱、GUI…）自行重繪。

import { getLang, toggleLang, onLangChange } from './i18n.js'

export function initLangToggle() {
  const btn = document.createElement('button')
  btn.className = 'lang-toggle'
  btn.type = 'button'
  btn.innerHTML = `
    <span class="lang-toggle__opt" data-lang="zh">中</span>
    <span class="lang-toggle__sep" aria-hidden="true">/</span>
    <span class="lang-toggle__opt" data-lang="en">EN</span>
  `

  // 高亮當前語言 + 更新無障礙標籤
  function sync() {
    const lang = getLang()
    btn.querySelectorAll('.lang-toggle__opt').forEach((s) =>
      s.classList.toggle('is-active', s.dataset.lang === lang)
    )
    btn.setAttribute('aria-label', lang === 'zh' ? '切換語言：English' : 'Switch language: 中文')
  }

  btn.addEventListener('click', () => toggleLang())
  onLangChange(sync)
  sync()

  document.body.appendChild(btn)
  return btn
}

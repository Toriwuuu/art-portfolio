// ===== 無 WebGL 備案 =====
// 瀏覽器跑不動 3D 場景時，退回簡單的縮圖牆：
// 每件作品一格，點開一樣用燈箱看。
// 開發時可在網址加 ?fallback=1 強制走這條路測試。

import { works, thumbSrc } from './data.js'
import { open as openLightbox } from './lightbox.js'
import { workName, onLangChange } from './i18n.js'

export function initFallback() {
  const mount = document.getElementById('fallback')
  mount.hidden = false

  function render() {
    const html = works
      .map(
        (work, i) => `
      <button class="cell" type="button" data-index="${i}" aria-label="${workName(work)}">
        <img src="${thumbSrc(work, work.files[0])}" alt="${workName(work)}" loading="lazy" decoding="async">
        <span class="cell-title">${workName(work)}</span>
      </button>
    `
      )
      .join('')

    mount.innerHTML = `<div class="fallback-grid">${html}</div>`

    mount.querySelectorAll('.cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        openLightbox(works[Number(cell.dataset.index)])
      })
    })
  }

  render()
  onLangChange(render) // 切換語言時重建縮圖牆的文字
}

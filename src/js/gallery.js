// ===== 畫廊渲染 =====
// 讀 data.js 的作品清單，產生插畫區與立體作品區的 DOM。
// 點擊作品會呼叫 onWorkClick（由 main.js 接上燈箱）。

import { illustrations, plasticYears, illusSrc, plasticSrc } from './data.js'
import { icons } from './icons.js'

// 年份縮圖牆超過這個數量就先收合
const COLLAPSE_LIMIT = 8

// 產生一張作品的 <figure> HTML
function workHTML({ src, title, eager = false }) {
  // 前幾張用 eager 優先載入，其餘 lazy（捲到附近才下載）
  const loadAttr = eager
    ? 'loading="eager" fetchpriority="high"'
    : 'loading="lazy"'

  return `
    <figure class="work">
      <img src="${src}" alt="${title}" ${loadAttr} decoding="async">
      ${title ? `<figcaption>${title}</figcaption>` : ''}
    </figure>
  `
}

// 插畫區：單欄大圖
function renderIllustrations(container, onWorkClick) {
  const html = illustrations
    .map((item, i) =>
      workHTML({ src: illusSrc(item.file), title: item.title, eager: i === 0 })
    )
    .join('')
  container.insertAdjacentHTML('beforeend', html)

  // 點擊 → 開燈箱（傳入整個插畫清單與被點的索引）
  const list = illustrations.map((item) => ({
    src: illusSrc(item.file),
    title: item.title,
  }))
  container.querySelectorAll('.work img').forEach((img, i) => {
    img.addEventListener('click', () => onWorkClick(list, i))
  })
}

// 立體作品區：年份群組 + 縮圖牆
function renderPlastic(container, onWorkClick) {
  plasticYears.forEach(({ year, files }) => {
    const hasMore = files.length > COLLAPSE_LIMIT
    const thumbs = files
      .map((file, i) => {
        // 超過收合上限的縮圖先藏起來（hidden），按「SHOW MORE」才展開
        const hiddenAttr = hasMore && i >= COLLAPSE_LIMIT ? ' hidden' : ''
        return `
          <figure class="work"${hiddenAttr}>
            <img src="${plasticSrc(year, file)}" alt="Plastic art ${year}" loading="lazy" decoding="async">
          </figure>
        `
      })
      .join('')

    const showMoreBtn = hasMore
      ? `<button class="show-more" type="button">
           <span class="show-more-icon">${icons.more}</span>SHOW MORE
         </button>`
      : ''

    container.insertAdjacentHTML(
      'beforeend',
      `
      <div class="year-group" data-year="${year}">
        <p class="year-label">${year}</p>
        <div class="year-grid">${thumbs}${showMoreBtn}</div>
      </div>
      `
    )
  })

  // 點擊縮圖 → 開該年份的燈箱
  container.querySelectorAll('.year-group').forEach((group) => {
    const year = Number(group.dataset.year)
    const files = plasticYears.find((y) => y.year === year).files
    const list = files.map((file) => ({
      src: plasticSrc(year, file),
      title: `${year}`,
    }))

    group.querySelectorAll('.work img').forEach((img, i) => {
      img.addEventListener('click', () => onWorkClick(list, i))
    })

    // SHOW MORE：展開其餘縮圖後按鈕自己消失
    const btn = group.querySelector('.show-more')
    if (btn) {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.work[hidden]').forEach((el) => {
          el.removeAttribute('hidden')
        })
        btn.remove()
      })
    }
  })
}

export function initGallery(onWorkClick) {
  renderIllustrations(
    document.querySelector('[data-gallery="illustration"]'),
    onWorkClick
  )
  renderPlastic(document.querySelector('[data-gallery="plastic"]'), onWorkClick)
}

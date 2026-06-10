// ===== 動態層 =====
// M1：header 捲動隱現、漢堡選單、TOP 按鈕（純 vanilla JS）
// M5 會在這裡加上 GSAP 漂浮、滑鼠視差、進場顯示

// 頁首：往下捲隱藏、往上捲出現
function initTopbar() {
  const topbar = document.getElementById('topbar')
  let lastY = window.scrollY
  let ticking = false // rAF 節流：一個畫格內只處理一次捲動

  window.addEventListener('scroll', () => {
    if (ticking) return
    ticking = true

    requestAnimationFrame(() => {
      const y = window.scrollY
      // 捲超過 header 高度且方向向下 → 收起；向上 → 出現
      if (y > lastY && y > topbar.offsetHeight) {
        topbar.classList.add('is-hidden')
      } else if (y < lastY) {
        topbar.classList.remove('is-hidden')
      }
      lastY = y
      ticking = false
    })
  })
}

// 漢堡選單：點擊切換開合，點選單連結後自動收起
function initHamburger() {
  const hamburger = document.querySelector('.hamburger')
  const menu = document.querySelector('.menu')

  function toggle(open) {
    hamburger.classList.toggle('is-active', open)
    menu.classList.toggle('is-open', open)
    hamburger.setAttribute('aria-expanded', String(open))
  }

  hamburger.addEventListener('click', () => {
    toggle(!menu.classList.contains('is-open'))
  })

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggle(false))
  })
}

// TOP 按鈕：回到頁首（平滑與否交給 CSS 的 scroll-behavior 決定）
function initTopButton() {
  document.querySelector('.topbtn').addEventListener('click', () => {
    window.scrollTo({ top: 0 })
  })
}

export function initMotion() {
  initTopbar()
  initHamburger()
  initTopButton()
}

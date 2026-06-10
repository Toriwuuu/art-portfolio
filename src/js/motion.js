// ===== 動態層 =====
// 1. header 捲動隱現、漢堡選單、TOP 按鈕（純 vanilla JS，永遠啟用）
// 2. GSAP 有機漂浮、滑鼠視差、作品進場顯示
//    （包在 gsap.matchMedia 裡：使用者偏好減少動態時整段不執行）

import gsap from 'gsap'

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

// 有機漂浮：每個元素拿到一組「隨機」的幅度、時長、延遲，
// 用 yoyo 來回擺盪。因為參數各自不同，不會出現整排東西同步點頭的機械感。
function initFloating() {
  const targets = document.querySelectorAll('.hero-title, .hero-kicker, .scroll-hint')

  targets.forEach((el) => {
    gsap.to(el, {
      y: gsap.utils.random(-10, -22),            // 漂多高
      rotation: gsap.utils.random(-1.5, 1.5),    // 微微歪頭
      duration: gsap.utils.random(3, 5),         // 一趟的時間
      ease: 'sine.inOut',
      repeat: -1,                                // 無限重複
      yoyo: true,                                // 去了會回來
      delay: gsap.utils.random(0, 2),            // 各自錯開起跑
    })
  })
}

// 滑鼠視差：hero 的文字層跟著滑鼠輕輕位移，和背景的傾轉形成深度感。
// gsap.quickTo 是專門給「高頻更新同一個屬性」用的工具，
// 比每次 pointermove 都建立新動畫省很多效能。
function initParallax() {
  const layers = [
    { el: document.querySelector('.hero-kicker'), depth: 10 },
    { el: document.querySelector('.hero-title'), depth: 22 },
    { el: document.querySelector('.hero-intro'), depth: 14 },
  ].filter((l) => l.el)

  const movers = layers.map(({ el, depth }) => ({
    x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }),
    y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3' }),
    depth,
  }))

  window.addEventListener('pointermove', (e) => {
    // 滑鼠位置換算成 -1 ~ 1
    const nx = (e.clientX / window.innerWidth) * 2 - 1
    const ny = (e.clientY / window.innerHeight) * 2 - 1
    movers.forEach(({ x, y, depth }) => {
      x(nx * depth)
      y(ny * depth)
    })
  })
}

// 作品進場：捲到附近時淡入浮起，一個作品只演一次（演完就取消觀察）
function initReveals() {
  const works = document.querySelectorAll('.gallery-section .work')

  // 先藏起來（只在動畫會執行時才藏，所以不怕內容永遠看不到）
  gsap.set(works, { autoAlpha: 0, y: 32 })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        gsap.to(entry.target, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          // 進場時間加一點隨機，鄰近的作品不會整齊劃一地出現
          delay: gsap.utils.random(0, 0.15),
        })
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.15 }
  )

  works.forEach((el) => observer.observe(el))
}

export function initMotion() {
  // 基本互動：永遠啟用
  initTopbar()
  initHamburger()
  initTopButton()

  // 動畫：只在使用者沒有要求減少動態時啟用
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    initFloating()
    initParallax()
    initReveals()
  })
}

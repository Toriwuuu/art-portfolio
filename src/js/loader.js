// ===== 載入動畫 =====
// 蓋在最上層的深色進度條：把「3D 場景畫出來之前、會閃一下 body 舊雜訊底色 +
// 左上 logo」的破綻擋掉，也順便給一個短暫的進場儀式感。
//
// 進度條本身（HTML + critical CSS）寫在 index.html 的 <head> 裡，
// 確保第一次繪製就蓋住畫面（不依賴打包後的 CSS，才不會自己也閃一下）。
// 這支只負責「時間到了就淡出移除」。

const MIN_MS = 1500 // 至少顯示這麼久（就算場景秒載，也讓進度條走完）

let start = 0

// 一進站就呼叫，記下起點時間
export function initLoader() {
  start = performance.now()
}

// 場景（或 fallback）就緒後呼叫：補足到 MIN_MS 再淡出
export function hideLoader() {
  const el = document.getElementById('loader')
  if (!el) return
  const wait = Math.max(MIN_MS - (performance.now() - start), 0)
  setTimeout(() => {
    el.classList.add('is-done') // 觸發 CSS 的 opacity 淡出
    el.addEventListener('transitionend', () => el.remove(), { once: true })
    setTimeout(() => el.remove(), 700) // 保險：萬一 transitionend 沒來也移除
  }, wait)
}

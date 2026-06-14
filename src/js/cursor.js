// ===== 光束游標 =====
// 取代 3D 場景上的系統游標：一束會發光的光跟著滑鼠跑，
// 移動越快就被拉得越長、方向跟著滑動角度——像劃過畫面的光束。
// （這束光也對應中央流體的「被劃破」互動，兩者一起讀同一個滑鼠。）
//
// 只在「有滑鼠」的裝置啟用；觸控裝置維持原生行為，不顯示光束。

export function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  const beam = document.createElement('div')
  beam.className = 'beam'
  beam.setAttribute('aria-hidden', 'true')
  document.body.appendChild(beam)

  let tx = window.innerWidth / 2 // 目標（真實游標位置）
  let ty = window.innerHeight / 2
  let x = tx // 跟隨位置（慢半拍，才有「光束拖尾」感）
  let y = ty

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX
    ty = e.clientY
    beam.classList.add('is-on') // 第一次移動才現身
  })
  window.addEventListener('pointerdown', () => beam.classList.add('is-press'))
  window.addEventListener('pointerup', () => beam.classList.remove('is-press'))
  // 滑出視窗就淡出
  document.addEventListener('mouseleave', () => beam.classList.remove('is-on'))

  function tick() {
    const dx = tx - x
    const dy = ty - y
    x += dx * 0.4
    y += dy * 0.4
    const speed = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    const stretch = Math.min(1 + speed * 0.08, 7) // 越快拉得越長
    beam.style.transform =
      `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}rad) scaleX(${stretch})`
    requestAnimationFrame(tick)
  }
  tick()
}

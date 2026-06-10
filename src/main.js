// ===== 入口檔 =====
// 偵測 WebGL：可用 → 載入 3D 場景（整個網站就是一個場景）；
// 不可用 → 退回縮圖牆。網址加 ?fallback=1 可以強制測試備案版。

import './scss/main.scss'
import { initIcons } from './js/icons.js'

initIcons()

// 試著建立 WebGL context 來判斷支不支援
function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const forceFallback = new URLSearchParams(location.search).has('fallback')

if (!forceFallback && webglAvailable()) {
  // 3D 場景比較大（含 Three.js），用動態載入：下載完才啟動
  import('./js/scene.js').then(({ initScene }) => initScene())
} else {
  import('./js/fallback.js').then(({ initFallback }) => initFallback())
}

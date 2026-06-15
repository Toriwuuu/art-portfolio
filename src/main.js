// ===== 入口檔 =====
// 偵測 WebGL：可用 → 載入 3D 場景（整個網站就是一個場景）；
// 不可用 → 退回縮圖牆。網址加 ?fallback=1 可以強制測試備案版。

import './scss/main.scss'
import { initIcons } from './js/icons.js'
import { initLoader, hideLoader } from './js/loader.js'
import { initCursor } from './js/cursor.js'
import { initLangToggle } from './js/langtoggle.js'

initLoader() // 記下進站時間（進度條至少走 1.5 秒）
initIcons()
initCursor() // 光束游標（只在有滑鼠的裝置生效）
initLangToggle() // 右上角中／EN 切換鈕（3D 與備案版都有）

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

const boot =
  !forceFallback && webglAvailable()
    ? // 3D 場景比較大（含 Three.js），用動態載入：下載完才啟動
      import('./js/scene.js').then(({ initScene }) => initScene())
    : import('./js/fallback.js').then(({ initFallback }) => initFallback())

// 場景或備案就緒（已畫出第一幀）後，把進度條淡出
boot.finally(hideLoader)

// ===== 3D 場景核心 =====
// 整個網站就是這一個場景：中央玻璃流體 + 繞著它的作品球。
// 這裡負責 renderer / camera / 渲染迴圈 / 視窗縮放 / 省電暫停。

import * as THREE from 'three'
import { createBlob, BLOB_CONFIG } from './blob.js'

// ---------- 可調參數 ----------
const CONFIG = {
  cameraFov: 45,
  cameraFovMobile: 55,
  cameraZ: 7.5,
  cameraZMobile: 8,
  maxPixelRatio: 1.75, // 限制解析度倍率，避免 retina 螢幕吃太多效能
  background: '#0a0a0d',
  mouseLerp: 0.04,     // 滑鼠跟隨的慢半拍程度（越小越慵懶）
}

export function initScene() {
  const canvas = document.getElementById('stage')
  const isMobile = window.innerWidth < 768

  // 使用者偏好減少動態：場景照常運作（它就是整個網站），
  // 但自動的動作（自轉、輪播）會關閉，流速減半。詳見各模組。
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(CONFIG.background)

  const camera = new THREE.PerspectiveCamera(
    isMobile ? CONFIG.cameraFovMobile : CONFIG.cameraFov,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  )
  camera.position.z = isMobile ? CONFIG.cameraZMobile : CONFIG.cameraZ

  // ----- 中央流體 -----
  const blob = createBlob(isMobile)
  scene.add(blob.mesh)

  // ----- 滑鼠：目標值 → 每幀慢慢追上（lerp）-----
  const mouseTarget = new THREE.Vector2(0, 0)
  window.addEventListener('pointermove', (e) => {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseTarget.y = -((e.clientY / window.innerHeight) * 2 - 1)
  })

  // ----- 視窗縮放 -----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  // ----- 渲染迴圈 -----
  const clock = new THREE.Clock()
  let rafId = null
  let paused = false
  const flowSpeed = reducedMotion ? BLOB_CONFIG.flowSpeed * 0.5 : BLOB_CONFIG.flowSpeed

  function tick() {
    const t = clock.getElapsedTime()

    blob.uniforms.uTime.value = t * flowSpeed
    blob.uniforms.uMouse.value.lerp(mouseTarget, CONFIG.mouseLerp)

    // 流體緩慢自轉 + 隨滑鼠微傾
    blob.mesh.rotation.y = t * 0.05 + blob.uniforms.uMouse.value.x * BLOB_CONFIG.mouseTilt
    blob.mesh.rotation.x = blob.uniforms.uMouse.value.y * -BLOB_CONFIG.mouseTilt

    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  tick()

  function pause() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
      paused = true
    }
  }

  function resume() {
    if (paused) {
      paused = false
      clock.start()
      tick()
    }
  }

  // 分頁切到背景時暫停渲染，省電
  document.addEventListener('visibilitychange', () => {
    document.hidden ? pause() : resume()
  })

  // 開發模式掛在 window 上，方便自動化測試讀內部狀態
  if (import.meta.env.DEV) {
    window.__v3 = { scene, camera, renderer, blob }
  }

  return { scene, camera, renderer, blob, pause, resume, isMobile, reducedMotion }
}

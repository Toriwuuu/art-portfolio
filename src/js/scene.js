// ===== 3D 場景核心 =====
// 整個網站就是這一個場景：中央玻璃流體 + 繞著它的作品球。
// 這裡負責 renderer / camera / 渲染迴圈 / 視窗縮放 / 省電暫停。

import * as THREE from 'three'
import { createFluidBlob, createRoomEnv } from '../lib/fluid-blob/index.js'
import { createNoiseBg } from './bg.js'
import { createCards } from './cards.js'
import { initControls } from './controls.js'
import { open as openLightbox, setSceneHooks } from './lightbox.js'
import { initGui } from './gui.js'

// ---------- 可調參數 ----------
const CONFIG = {
  cameraFov: 45,
  cameraFovMobile: 55,
  cameraZ: 7.5,
  cameraZMobile: 8,
  maxPixelRatio: 1.75, // 限制解析度倍率，避免 retina 螢幕吃太多效能
  background: '#0a0a0d',
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

  // 環境貼圖：給玻璃材質反射用（沒有它玻璃會死白一片）
  scene.environment = createRoomEnv(renderer)

  // 一盞桃紅點光，讓玻璃透出品牌色的光暈
  const pinkLight = new THREE.PointLight('#E931CC', 30, 12)
  pinkLight.position.set(-3, 2, 4)
  scene.add(pinkLight)

  const camera = new THREE.PerspectiveCamera(
    isMobile ? CONFIG.cameraFovMobile : CONFIG.cameraFov,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  )
  camera.position.z = isMobile ? CONFIG.cameraZMobile : CONFIG.cameraZ

  // ----- 動態星雲背景（最底層）-----
  const noiseBg = createNoiseBg()
  scene.add(noiseBg.mesh)

  // 把背景星雲的解析度（含像素比）餵進 shader，做雲氣的長寬比校正；縮放時同步
  function syncBgResolution() {
    const dpr = renderer.getPixelRatio()
    noiseBg.uniforms.uResolution.value.set(window.innerWidth * dpr, window.innerHeight * dpr)
  }
  syncBgResolution()

  // ----- 中央流體（fluid-blob 模組：滑鼠跟隨、時間、折射 FBO 都在它肚子裡）-----
  const blob = createFluidBlob({ isMobile, reducedMotion })
  scene.add(blob.mesh)

  // ----- 作品卡片球 -----
  const cards = createCards({ isMobile, reducedMotion })
  scene.add(cards.group)

  // ----- 互動：拖曳/慣性/縮放/hover/點擊 -----
  const controls = initControls({
    canvas,
    camera,
    group: cards.group,
    cards: cards.cards,
    reducedMotion,
    onCardClick: openLightbox,
  })

  // ----- 視窗縮放 -----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    syncBgResolution()
  })

  // ----- 渲染迴圈 -----
  const clock = new THREE.Clock()
  let rafId = null
  let paused = false

  function tick() {
    const t = clock.getElapsedTime()
    const dt = frameDelta(t)

    blob.update(dt)                // 流體的時間/滑鼠跟隨/自轉（模組內部處理）
    noiseBg.uniforms.uTime.value = reducedMotion ? 0 : t // 偏好減少動態 → 星雲靜止

    controls.update(dt)            // 拖曳慣性/自轉/縮放/hover
    cards.update(camera)           // billboard：卡片面向鏡頭

    // 玻璃折射的兩段式渲染（藏玻璃→拍背景→餵給材質，細節都在模組裡）
    blob.renderTransmissionPass(renderer, scene, camera)

    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }

  // 每幀間隔秒數（夾上限避免切分頁回來時跳一大步）
  let lastT = 0
  function frameDelta(t) {
    const dt = Math.min(t - lastT, 0.05)
    lastT = t
    return dt
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
      clock.start() // 重新計時（elapsed 從 0 開始）
      lastT = 0     // frameDelta 的基準同步歸零，避免恢復瞬間時間倒退
      tick()
    }
  }

  // 分頁切到背景時暫停渲染，省電
  document.addEventListener('visibilitychange', () => {
    document.hidden ? pause() : resume()
  })

  // 燈箱打開時也暫停（黑底蓋住場景了，沒必要繼續畫），關閉恢復
  setSceneHooks({ onOpen: pause, onClose: resume })

  // ----- GUI 參數面板（右下角玻璃按鈕觸發）-----
  initGui({ noiseBg, blob, cards, pinkLight })

  // 開發模式掛在 window 上，方便自動化測試讀內部狀態
  if (import.meta.env.DEV) {
    window.__v3 = { scene, camera, renderer, blob }
  }

  return { scene, camera, renderer, blob, pause, resume, isMobile, reducedMotion }
}

// ===== 3D 場景核心 =====
// 整個網站就是這一個場景：中央玻璃流體 + 繞著它的作品球。
// 這裡負責 renderer / camera / 渲染迴圈 / 視窗縮放 / 省電暫停。

import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createBlob, BLOB_CONFIG } from './blob.js'
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
  mouseLerp: 0.04,     // 滑鼠跟隨的慢半拍程度（越小越慵懶）
  fboSize: 1024,       // 玻璃折射用的離屏畫布解析度（手機減半）
  fboSizeMobile: 512,
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
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment()).texture
  pmrem.dispose()

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

  // ----- 動態雜訊背景（最底層）-----
  const noiseBg = createNoiseBg()
  scene.add(noiseBg.mesh)

  // ----- 中央流體 -----
  const blob = createBlob(isMobile)
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

  // ----- 玻璃折射用的離屏畫布（固定解析度，跟視窗大小無關，效能可控）-----
  const fboSize = isMobile ? CONFIG.fboSizeMobile : CONFIG.fboSize
  const transmissionFbo = new THREE.WebGLRenderTarget(fboSize, fboSize)

  // ----- 渲染迴圈 -----
  const clock = new THREE.Clock()
  let rafId = null
  let paused = false
  // 包成物件讓 GUI 面板能即時改流速
  const motion = { flowSpeed: reducedMotion ? BLOB_CONFIG.flowSpeed * 0.5 : BLOB_CONFIG.flowSpeed }

  // 流速改變時不能讓 uTime 跳一格，所以自己累積時間
  let blobTime = 0
  let lastTickT = 0

  function tick() {
    const t = clock.getElapsedTime()
    blobTime += (t - lastTickT) * motion.flowSpeed
    lastTickT = t

    blob.uniforms.uTime.value = blobTime
    blob.uniforms.uMouse.value.lerp(mouseTarget, CONFIG.mouseLerp)
    noiseBg.uniforms.uTime.value = reducedMotion ? 0 : t // 偏好減少動態 → 顆粒靜止

    // 流體緩慢自轉 + 隨滑鼠微傾
    blob.mesh.rotation.y = t * 0.05 + blob.uniforms.uMouse.value.x * BLOB_CONFIG.mouseTilt
    blob.mesh.rotation.x = blob.uniforms.uMouse.value.y * -BLOB_CONFIG.mouseTilt

    controls.update(frameDelta(t)) // 拖曳慣性/自轉/縮放/hover
    cards.update(camera)           // billboard：卡片面向鏡頭

    // ----- 玻璃折射的兩段式渲染 -----
    // 1. 把玻璃藏起來，先將「玻璃後面的世界」（卡片們）畫進離屏畫布 FBO
    // 2. 把 FBO 餵給玻璃材質當折射來源，再正常畫整個場景
    if (blob.isTransmission) {
      blob.mesh.visible = false
      renderer.setRenderTarget(transmissionFbo)
      renderer.render(scene, camera)
      blob.mesh.visible = true
      blob.material.buffer = transmissionFbo.texture
      blob.material.time = t // 玻璃內部扭曲的流動時間
      renderer.setRenderTarget(null)
    }

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
      lastTickT = 0 // 時間累積器同步歸零，避免恢復瞬間時間倒退
      lastT = 0
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
  initGui({ noiseBg, blob, cards, pinkLight, motion })

  // 開發模式掛在 window 上，方便自動化測試讀內部狀態
  if (import.meta.env.DEV) {
    window.__v3 = { scene, camera, renderer, blob }
  }

  return { scene, camera, renderer, blob, pause, resume, isMobile, reducedMotion }
}

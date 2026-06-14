// ===== createFluidBlob：Embed 模式控制器 =====
// 給「自己已經有 three.js 場景」的專案用。模組把容易出錯的事全包了：
// 折射用的離屏畫布（FBO）、滑鼠跟隨、時間累積、自轉。
//
// 用法（宿主的渲染迴圈每幀照這個順序呼叫）：
//   const blob = createFluidBlob({ ...覆寫任何預設值 })
//   scene.add(blob.mesh)
//   // 每幀：
//   blob.update(dt)                                       // 時間/滑鼠/旋轉
//   blob.renderTransmissionPass(renderer, scene, camera)  // 折射的兩段式渲染
//   renderer.render(scene, camera)                        // 宿主自己的最終渲染
//
// 提醒：玻璃需要 scene.environment（環境貼圖）才會漂亮，
// 沒有的話會死白一片——可以用 index.js 輸出的 createRoomEnv() 一行搞定。

import * as THREE from 'three'
import { FLUID_BLOB_DEFAULTS } from './defaults.js'
import { createBlobMesh } from './blob-mesh.js'

export function createFluidBlob(options = {}) {
  // ----- 合併參數：預設值 ← 環境偵測 ← 使用者覆寫 -----
  // params 是「活的」：update() 每幀都讀它，
  // 所以 GUI 面板直接寫 blob.params.flowSpeed 就即時生效。
  const params = {
    ...FLUID_BLOB_DEFAULTS,
    isMobile: window.innerWidth < 768,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ...options,
  }
  // 使用者偏好減少動態 → 流速減半（直接寫回 params，GUI 顯示的就是減半後的值）
  if (params.reducedMotion) params.flowSpeed *= 0.5

  const { mesh, material, uniforms, isTransmission } = createBlobMesh(params)

  // ----- 玻璃折射用的離屏畫布（只有透射材質需要）-----
  const fboSize = params.isMobile ? params.fboSizeMobile : params.fboSize
  const fbo = isTransmission ? new THREE.WebGLRenderTarget(fboSize, fboSize) : null

  // ----- 滑鼠：目標值 → 每幀慢慢追上（lerp）-----
  const mouseTarget = new THREE.Vector2(0, 0)
  function onPointerMove(e) {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseTarget.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  if (params.interactive) window.addEventListener('pointermove', onPointerMove)

  // ----- 兩條獨立的時間線（刻意分開，不能合併）-----
  // blobTime：乘過 flowSpeed 的累積器，控制「形狀」的流動。
  //           用累積而不是直接乘時間，改流速時表面才不會跳一格。
  // elapsed： 原始經過時間，控制自轉與玻璃內部扭曲（material.time）。
  let blobTime = 0
  let elapsed = 0

  // 每幀呼叫。dt = 這一幀經過的秒數（內部夾上限，切分頁回來不會跳一大步）
  function update(dt) {
    dt = Math.min(dt, 0.05)
    blobTime += dt * params.flowSpeed
    elapsed += dt

    uniforms.uTime.value = blobTime
    uniforms.uMouse.value.lerp(mouseTarget, params.mouseLerp)

    // 緩慢自轉 + 隨滑鼠微傾
    mesh.rotation.y =
      (params.autoRotate ? elapsed * params.rotateSpeed : 0) +
      uniforms.uMouse.value.x * params.mouseTilt
    mesh.rotation.x = uniforms.uMouse.value.y * -params.mouseTilt
  }

  // ----- 玻璃折射的兩段式渲染 -----
  // 1. 把玻璃藏起來，先將「玻璃後面的世界」畫進離屏畫布 FBO
  // 2. 把 FBO 餵給玻璃材質當折射來源（最終渲染由宿主自己做）
  // 容易出錯的步驟全封在這裡，結尾一定把 render target 還原成畫面。
  function renderTransmissionPass(renderer, scene, camera) {
    if (!isTransmission) return // 備案材質不需要這一段
    mesh.visible = false
    renderer.setRenderTarget(fbo)
    renderer.render(scene, camera)
    mesh.visible = true
    material.buffer = fbo.texture
    material.time = elapsed // 玻璃內部扭曲的流動時間
    renderer.setRenderTarget(null)
  }

  // 收拾乾淨：移除監聽、釋放顯示卡資源（換頁或關掉效果時呼叫）
  function dispose() {
    if (params.interactive) window.removeEventListener('pointermove', onPointerMove)
    mesh.geometry.dispose()
    material.dispose()
    fbo?.dispose()
  }

  return {
    mesh,           // 加進場景、移動縮放都由宿主決定
    material,       // GUI 可以直接調材質屬性（roughness 等）
    uniforms,       // GUI 可以直接調形狀旋鈕（uFreq / uAmp / uRipple）
    params,         // 活的參數物件（flowSpeed / mouseTilt / rotateSpeed…）
    isTransmission,
    update,
    renderTransmissionPass,
    dispose,
  }
}

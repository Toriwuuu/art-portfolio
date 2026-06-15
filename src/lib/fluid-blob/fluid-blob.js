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
import { PRESETS } from './presets.js'
import { createBlobMesh } from './blob-mesh.js'

export function createFluidBlob(options = {}) {
  // preset 是一包外觀參數（見 presets.js），合併順序在使用者覆寫「之前」，
  // 所以 createFluidBlob({ preset: 'aqua', roughness: 0.2 }) 會以 aqua 為底、再蓋上 roughness。
  const { preset, ...overrides } = options
  if (preset && !PRESETS[preset]) {
    console.warn(`[fluid-blob] 未知的主題預設：${preset}（可用：${Object.keys(PRESETS).join(', ')}）`)
  }

  // ----- 合併參數：預設值 ← 環境偵測 ← 主題預設 ← 使用者覆寫 -----
  // params 是「活的」：update() 每幀都讀它，
  // 所以 GUI 面板直接寫 blob.params.flowSpeed 就即時生效。
  const params = {
    ...FLUID_BLOB_DEFAULTS,
    isMobile: window.innerWidth < 768,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ...(preset && PRESETS[preset] ? PRESETS[preset] : {}),
    ...overrides,
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

  // ----- 游標牽引狀態 -----
  const prevMouse = new THREE.Vector2()
  const mouseVel = new THREE.Vector2()
  const pokePointWorld = new THREE.Vector3()
  const pokeDirWorld = new THREE.Vector3()
  const pokeAccum = new THREE.Vector2()              // 累積的游標位移（累到夠遠才更新「目標方向」，濾掉慢速抖動）
  const pokeDirTarget = new THREE.Vector2(1, 0)      // 目標方向（由累積位移決定，乾淨不抖）
  const pokeDirSmooth = new THREE.Vector2(1, 0)      // 實際方向（每幀緩動逼近目標 → 轉向平順、不硬切）
  const _invQuat = new THREE.Quaternion()
  let pokeStrength = 0
  let demoTime = 0 // 自動示範用的時間累加器

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

    // ----- 游標撥開：游標掃過時沿移動方向壓出凹槽，停手後衰減回彈 -----
    if (params.poke && params.interactive) {
      // 一幀要用的量：劃動速度、影響點 NDC 座標、移動方向（dirX/dirY）
      let speed, ndcX, ndcY, dirX, dirY
      if (params.pokeDemo) {
        // 自動示範：球自己循環做「劃一下 → 放手回彈」，讓凹槽深度/回彈/靈敏度在面板調整時就看得見。
        // 用「虛擬游標」取代真實滑鼠：固定的劃動速度 × 靈敏度 = 強度，放手段速度歸 0 → 看回彈衰減。
        demoTime += dt
        const T = 1.6                          // 一輪 = 劃一下 + 放手回彈
        const cycle = Math.floor(demoTime / T) // 每輪換個位置示範（輪內位置固定）
        const ang = cycle * 2.0
        ndcX = Math.cos(ang) * 0.33            // 影響點落在球的正面（NDC 半徑 0.33）
        ndcY = Math.sin(ang) * 0.33
        dirX = -Math.sin(ang)                  // 沿圓周切線方向劃
        dirY = Math.cos(ang)
        speed = (demoTime % T) / T < 0.3 ? 3.0 : 0.0 // 前 0.3 劃動（高速）、其餘放手（速度 0 → 衰減）
        prevMouse.copy(mouseTarget)            // 保持真實滑鼠基準新鮮，關掉示範時才不會暴衝一下
      } else {
        mouseVel.subVectors(mouseTarget, prevMouse) // 這一幀滑鼠在 NDC 移了多少
        prevMouse.copy(mouseTarget)
        speed = dt > 1e-6 ? mouseVel.length() / dt : 0 // NDC/秒（dt=0 的首幀防 0/0=NaN）
        ndcX = uniforms.uMouse.value.x
        ndcY = uniforms.uMouse.value.y
        // 真實游標的方向不在這裡取：改用下方「累積位移」濾掉慢速抖動（demo 才用 dirX/dirY）
      }
      // 強度：劃動越快衝越高（速度 × 靈敏度，夾在 1 以內）；之後以 dt 校正的衰減回到 0（= 凹槽回彈、流體聚合）
      pokeStrength *= Math.pow(0.1, dt / Math.max(params.pokeReboundTime, 0.05)) // 經過 pokeReboundTime 秒 → 衰到 ~10%
      pokeStrength = Math.max(pokeStrength, Math.min(speed * params.pokeSensitivity, 1))
      // 影響點 = 游標映到球的「正面半球表面」，再轉進物件座標。
      // 關鍵：z 不能固定 0（那會把點放在通過球心的切片上，只有最外緣 z≈0 處貼到表面、
      // 正面看到的那片幾乎不反應）。改取 z=√(R²−x²−y²) 讓點落在朝鏡頭的表面上。
      const wx = ndcX * 3.0
      const wy = ndcY * 3.0
      const R = params.radius
      const wr = Math.hypot(wx, wy)
      if (wr < R) {
        pokePointWorld.set(wx, wy, Math.sqrt(R * R - wr * wr)) // 輪廓內 → 正面半球（凸向鏡頭）
      } else {
        pokePointWorld.set((wx * R) / wr, (wy * R) / wr, 0)    // 輪廓外 → 收斂到赤道輪廓邊
      }
      _invQuat.copy(mesh.quaternion).invert()
      uniforms.uPokePoint.value.copy(pokePointWorld).applyQuaternion(_invQuat)
      uniforms.uPokeStrength.value = pokeStrength
      // 移動方向（物件座標），分兩段處理，慢速不抖、轉向也不硬切：
      // 1) 目標方向 pokeDirTarget：累積位移，累到 TURN_COMMIT（固定 NDC 距離）才更新一次——
      //    此時累積向量遠大於每幀 ±1px 的量化雜訊，方向乾淨。（示範模式方向本就平滑，直接當目標。）
      // 2) 實際方向 pokeDirSmooth：每幀依「轉向柔順」緩動逼近目標 → 改變方向時平順轉過去，而非瞬間跳。
      const TURN_COMMIT = 0.02 // 累積這麼多 NDC 位移才更新一次目標方向（內部值，足以濾掉量化雜訊）
      if (params.pokeDemo) {
        pokeDirTarget.set(dirX, dirY)
        pokeAccum.set(0, 0)
      } else {
        pokeAccum.add(mouseVel)
        if (pokeAccum.lengthSq() >= TURN_COMMIT * TURN_COMMIT) {
          pokeDirTarget.copy(pokeAccum)
          pokeAccum.set(0, 0)
        }
      }
      // 凹槽對 dir↔−dir 完全對稱：把目標翻到與目前同側，緩動走最短路、180° 反向也不會經過 0
      if (pokeDirSmooth.dot(pokeDirTarget) < 0) pokeDirTarget.negate()
      // pokeTurnSmooth = 每幀保留比例（越大轉越慢越柔順）；dt 校正，幀率不同也一致
      const ease = 1 - Math.pow(params.pokeTurnSmooth, dt * 60)
      pokeDirSmooth.lerp(pokeDirTarget, ease)
      if (pokeDirSmooth.lengthSq() > 1e-9) {
        // 用與 uPokePoint 相同的 _invQuat，球自轉時凹槽仍對齊螢幕上的劃過方向
        pokeDirWorld.set(pokeDirSmooth.x, pokeDirSmooth.y, 0).normalize()
        uniforms.uPokeDir.value.copy(pokeDirWorld).applyQuaternion(_invQuat)
      }
    } else if (uniforms.uPokeStrength.value > 0.0001) {
      // 撥開關閉（或不互動）時，讓殘留的凹槽平順收回，而不是凍在最後一格
      pokeStrength *= Math.pow(0.1, dt / Math.max(params.pokeReboundTime, 0.05)) // 經過 pokeReboundTime 秒 → 衰到 ~10%
      uniforms.uPokeStrength.value = pokeStrength < 0.001 ? (pokeStrength = 0) : pokeStrength
    }
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

  // ----- 即時套用主題預設 -----
  // 切換主題時，每個參數該寫去哪：材質屬性 / 顏色 / shader uniform。
  const MATERIAL_PROPS = ['roughness', 'ior', 'thickness', 'chromaticAberration', 'anisotropicBlur', 'distortion', 'distortionScale', 'temporalDistortion', 'attenuationDistance', 'envMapIntensity']
  const COLOR_PROPS = { glassColor: 'color', attenuationColor: 'attenuationColor' }
  const UNIFORM_PROPS = { noiseFreq: 'uFreq', noiseAmp: 'uAmp', mouseRipple: 'uRipple' }

  function applyParam(key, value) {
    params[key] = value // 不論哪一種，都先寫回「活的」params
    if (MATERIAL_PROPS.includes(key)) material[key] = value
    else if (key in COLOR_PROPS) material[COLOR_PROPS[key]]?.set(value)
    else if (key in UNIFORM_PROPS) uniforms[UNIFORM_PROPS[key]].value = value
    // 其餘（flowSpeed / mouseTilt / rotateSpeed / mouseLerp）只活在 params，update() 每幀讀
  }

  // 把整組主題參數套到「已經在跑」的這顆球上（不用重建）。
  // 回傳套用的那包參數，方便 GUI 同步面板上的數值顯示。
  function applyPreset(name) {
    const p = PRESETS[name]
    if (!p) {
      console.warn(`[fluid-blob] 未知的主題預設：${name}`)
      return null
    }
    for (const key in p) applyParam(key, p[key])
    return p
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
    applyPreset,    // applyPreset('aqua')：即時換主題（見 presets.js）
    dispose,
  }
}

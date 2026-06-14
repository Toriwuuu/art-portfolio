// ===== 互動控制 =====
// 拖曳旋轉作品球（放開有慣性滑行）、閒置自轉、滾輪縮放、
// hover 亮框、點擊開燈箱（拖曳和點擊用移動距離區分）。

import * as THREE from 'three'
import gsap from 'gsap'
import { isOpen as lightboxIsOpen } from './lightbox.js'

// ---------- 可調參數（export 讓 GUI 面板可即時調整）----------
export const CONTROLS_CONFIG = {
  sensitivity: 0.005,  // 拖曳靈敏度（弧度/像素）
  damping: 0.95,       // 慣性衰減：每幀(60fps基準)速度乘上這個值
  clickThreshold: 6,   // 移動小於這個像素數才算「點擊」
  idleDelay: 3,        // 閒置幾秒後開始自轉
  autoSpeed: 0.04,     // 自轉速度（弧度/秒）
  zoomMin: 5.2,        // 鏡頭最近
  zoomMax: 10.5,       // 鏡頭最遠
  zoomStep: 0.0015,    // 滾輪靈敏度
  hoverScale: 1.08,    // hover 時卡片放大倍率
}

export function initControls({ canvas, camera, group, cards, reducedMotion, onCardClick }) {
  // ----- 拖曳狀態 -----
  let dragging = false
  let lastX = 0
  let lastY = 0
  let downX = 0
  let downY = 0
  let totalMove = 0    // 這次按下總共移動多少像素（區分點擊/拖曳用）
  let velYaw = 0       // 慣性角速度（弧度/秒）：左右
  let velPitch = 0     // 上下
  let lastMoveTime = 0
  let idleTimer = 0    // 距離上次互動過了多久
  let autoFactor = 0   // 自轉的「油門」：0~1 之間慢慢進出

  // ----- 旋轉用四元數（trackball：在世界座標累加，上下左右都能無限轉，不卡住）-----
  // 用 group.rotation（尤拉角）的話，上下會被夾在南北極之間；改用四元數
  // 在世界座標 premultiply，方向永遠對齊螢幕（拖右就往右轉、拖上就往上翻）。
  const AXIS_YAW = new THREE.Vector3(0, 1, 0)   // 世界上方向 → 左右轉
  const AXIS_PITCH = new THREE.Vector3(1, 0, 0) // 世界右方向 → 上下轉
  const _q = new THREE.Quaternion()
  function rotateGroup(yaw, pitch) {
    if (yaw) {
      _q.setFromAxisAngle(AXIS_YAW, yaw)
      group.quaternion.premultiply(_q)
    }
    if (pitch) {
      _q.setFromAxisAngle(AXIS_PITCH, pitch)
      group.quaternion.premultiply(_q)
    }
  }

  const raycaster = new THREE.Raycaster()
  const pointerNdc = new THREE.Vector2()
  let hovered = null

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true
    canvas.setPointerCapture(e.pointerId)
    lastX = downX = e.clientX
    lastY = downY = e.clientY
    totalMove = 0
    velYaw = velPitch = 0
    lastMoveTime = performance.now()
    idleTimer = 0
  })

  canvas.addEventListener('pointermove', (e) => {
    idleTimer = 0

    if (dragging) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const now = performance.now()
      const dt = Math.max((now - lastMoveTime) / 1000, 0.001)

      // 水平拖 → 左右轉；垂直拖 → 上下轉（四元數累加，上下不再卡住）
      const yaw = dx * CONTROLS_CONFIG.sensitivity
      const pitch = dy * CONTROLS_CONFIG.sensitivity
      rotateGroup(yaw, pitch)

      // 記下這一刻的角速度，放開時拿來做慣性滑行
      velYaw = yaw / dt
      velPitch = pitch / dt

      totalMove += Math.abs(dx) + Math.abs(dy)
      lastX = e.clientX
      lastY = e.clientY
      lastMoveTime = now
    } else {
      // 沒在拖曳時做 hover 偵測（存座標，實際 raycast 在每幀 update 做）
      pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerNdc.y = -((e.clientY / window.innerHeight) * 2 - 1)
      pointerDirty = true
    }
  })

  canvas.addEventListener('pointerup', (e) => {
    dragging = false

    // 幾乎沒移動 → 視為點擊 → 雷射偵測打到哪張卡
    if (totalMove < CONTROLS_CONFIG.clickThreshold) {
      pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerNdc.y = -((e.clientY / window.innerHeight) * 2 - 1)
      raycaster.setFromCamera(pointerNdc, camera)
      const hit = raycaster.intersectObjects(visibleCards(), false)[0]
      if (hit) onCardClick(hit.object.userData.work)
      velYaw = velPitch = 0
    }
  })

  // ----- 滾輪縮放 -----
  let zoomTarget = camera.position.z
  canvas.addEventListener('wheel', (e) => {
    if (lightboxIsOpen()) return
    e.preventDefault()
    idleTimer = 0
    zoomTarget = THREE.MathUtils.clamp(
      zoomTarget + e.deltaY * CONTROLS_CONFIG.zoomStep,
      CONTROLS_CONFIG.zoomMin,
      CONTROLS_CONFIG.zoomMax
    )
  }, { passive: false })

  // ----- hover -----
  let pointerDirty = false

  // 貼圖還沒載到的卡片是隱形的，不該被滑到或點到
  function visibleCards() {
    return cards.filter((c) => c.userData.uniforms.uOpacity.value > 0.5)
  }

  function setHovered(card) {
    if (hovered === card) return
    if (hovered) {
      gsap.to(hovered.userData.uniforms.uHover, { value: 0, duration: 0.3 })
      if (!reducedMotion) {
        gsap.to(hovered.scale, {
          x: hovered.userData.baseScale.x,
          y: hovered.userData.baseScale.y,
          duration: 0.3,
        })
      }
    }
    hovered = card
    // 換成 body class，讓光束游標在 hover 卡片時變亮（取代原本的 pointer 游標）
    document.body.classList.toggle('is-card-hover', !!card)
    if (card) {
      gsap.to(card.userData.uniforms.uHover, { value: 1, duration: 0.3 })
      if (!reducedMotion) {
        gsap.to(card.scale, {
          x: card.userData.baseScale.x * CONTROLS_CONFIG.hoverScale,
          y: card.userData.baseScale.y * CONTROLS_CONFIG.hoverScale,
          duration: 0.3,
        })
      }
    }
  }

  // ----- 每幀更新（由 scene.js 的渲染迴圈呼叫）-----
  function update(dt) {
    // 慣性滑行：放開後速度逐漸衰減（以 60fps 為基準做幀率校正）
    if (!dragging && (Math.abs(velYaw) > 0.0001 || Math.abs(velPitch) > 0.0001)) {
      rotateGroup(velYaw * dt, velPitch * dt)
      const decay = Math.pow(CONTROLS_CONFIG.damping, dt * 60)
      velYaw *= decay
      velPitch *= decay
    }

    // 閒置自轉：幾秒沒人動就慢慢轉起來，一碰又慢慢停
    // （使用者偏好減少動態時不自轉）
    if (!reducedMotion) {
      idleTimer += dt
      const want = !dragging && idleTimer > CONTROLS_CONFIG.idleDelay ? 1 : 0
      autoFactor += (want - autoFactor) * Math.min(dt * 2, 1)
      rotateGroup(CONTROLS_CONFIG.autoSpeed * autoFactor * dt, 0)
    }

    // 縮放平滑趨近目標值
    camera.position.z += (zoomTarget - camera.position.z) * Math.min(dt * 6, 1)

    // hover raycast：滑鼠有動才重算，省效能
    if (pointerDirty && !dragging) {
      pointerDirty = false
      raycaster.setFromCamera(pointerNdc, camera)
      const hit = raycaster.intersectObjects(visibleCards(), false)[0]
      setHovered(hit ? hit.object : null)
    }
  }

  return { update }
}

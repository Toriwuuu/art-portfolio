// ===== 作品卡片球 =====
// 36 件作品的卡片，用「fibonacci 球面」均勻鋪在一顆隱形球的表面，
// 繞著中央的玻璃流體。卡片永遠面向鏡頭（billboard），
// 多圖作品的卡片會像小輪播一樣輪流換圖（crossfade）。

import * as THREE from 'three'
import gsap from 'gsap'
import { works, thumbSrc } from './data.js'

// ---------- 可調參數 ----------
export const CARDS_CONFIG = {
  radius: 3.2,         // 卡片球半徑（桌機）
  radiusMobile: 2.8,
  baseHeight: 0.72,    // 卡片基準高度
  maxWidth: 1.15,      // 卡片寬度上限（橫圖不要太霸道）
  fadeIn: 0.6,         // 貼圖載入後的淡入秒數
  carouselEvery: 4,    // 多圖卡每隔幾秒換一張
  crossfade: 0.8,      // 換圖的 crossfade 秒數
  concurrency: 6,      // 同時下載幾張貼圖
}

// 卡片的材質 shader：
// 兩個貼圖槽（uTexA / uTexB）+ uMix 做輪播 crossfade，
// uOpacity 做載入淡入，uHover 在邊緣畫桃紅細框。
// uFitA / uFitB 是「cover 裁切」的 UV 縮放與位移（輪播圖長寬比不同時置中裁切）
const CARD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const CARD_FRAGMENT = /* glsl */ `
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uMix;
uniform float uOpacity;
uniform float uHover;
uniform vec4 uFitA; // xy = UV 縮放, zw = UV 位移
uniform vec4 uFitB;
varying vec2 vUv;

void main() {
  vec3 a = texture2D(uTexA, vUv * uFitA.xy + uFitA.zw).rgb;
  vec3 b = texture2D(uTexB, vUv * uFitB.xy + uFitB.zw).rgb;
  vec3 color = mix(a, b, uMix);

  // hover 時的桃紅細框：算出離邊緣的距離，邊緣一圈染成品牌色
  float toEdge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float ring = 1.0 - smoothstep(0.0, 0.035, toEdge);
  color = mix(color, vec3(0.914, 0.192, 0.8), ring * uHover); // #E931CC

  gl_FragColor = vec4(color, uOpacity);
}
`

// 計算「cover 裁切」：圖片比卡片寬就裁左右、比卡片高就裁上下
function coverFit(planeAspect, imageAspect) {
  if (imageAspect > planeAspect) {
    const sx = planeAspect / imageAspect
    return new THREE.Vector4(sx, 1, (1 - sx) / 2, 0)
  }
  const sy = imageAspect / planeAspect
  return new THREE.Vector4(1, sy, 0, (1 - sy) / 2)
}

export function createCards({ isMobile, reducedMotion }) {
  const group = new THREE.Group()
  const R = isMobile ? CARDS_CONFIG.radiusMobile : CARDS_CONFIG.radius

  const loader = new THREE.TextureLoader()
  const planeGeo = new THREE.PlaneGeometry(1, 1) // 36 張卡共用同一個幾何

  // ----- 建卡片：fibonacci 球面均勻灑點 -----
  // 黃金角讓每個點跟鄰居距離都差不多，不會擠在兩極
  const N = works.length
  const GOLDEN = Math.PI * (3 - Math.sqrt(5)) // ≈ 2.39996

  const cards = works.map((work, i) => {
    const uniforms = {
      uTexA: { value: null },
      uTexB: { value: null },
      uMix: { value: 0 },
      uOpacity: { value: 0 }, // 貼圖載到才淡入
      uHover: { value: 0 },
      uFitA: { value: new THREE.Vector4(1, 1, 0, 0) },
      uFitB: { value: new THREE.Vector4(1, 1, 0, 0) },
    }

    const mesh = new THREE.Mesh(
      planeGeo,
      new THREE.ShaderMaterial({
        vertexShader: CARD_VERTEX,
        fragmentShader: CARD_FRAGMENT,
        uniforms,
        transparent: true,
      })
    )

    const y = 1 - (2 * (i + 0.5)) / N // -1 ~ 1 之間均勻分布
    const r = Math.sqrt(1 - y * y)
    const theta = GOLDEN * i
    mesh.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(R)

    mesh.userData = { work, uniforms, planeAspect: 1, slot: 0, fileIndex: 0 }
    group.add(mesh)
    return mesh
  })

  // ----- 貼圖載入佇列：一次最多載 CONFIG.concurrency 張 -----
  // 第一波：每件作品的第一張縮圖（球面逐漸「顯影」）
  // 第二波：多圖作品的其餘縮圖（輪播用）
  const queue = []
  let active = 0

  function enqueue(job) {
    queue.push(job)
    pump()
  }

  function pump() {
    while (active < CARDS_CONFIG.concurrency && queue.length) {
      const job = queue.shift()
      active++
      loader.load(job.url, (texture) => {
        texture.anisotropy = 8
        job.done(texture)
        active--
        pump()
      }, undefined, () => {
        active--
        pump()
      })
    }
  }

  // 第一波
  cards.forEach((card) => {
    const { work, uniforms } = card.userData
    enqueue({
      url: thumbSrc(work, work.files[0]),
      done(texture) {
        const img = texture.image
        const aspect = img.width / img.height

        // 卡片大小依第一張圖的長寬比等比決定：
        // 高度基準 baseHeight，太寬的橫圖整張等比縮小到寬度上限
        const w = Math.min(CARDS_CONFIG.baseHeight * aspect, CARDS_CONFIG.maxWidth)
        card.scale.set(w, w / aspect, 1)
        card.userData.planeAspect = aspect // 等比縮放 → 卡片比例 = 第一張圖比例
        card.userData.baseScale = card.scale.clone() // hover 放大的還原基準

        uniforms.uTexA.value = texture // 第一張圖不需要裁切（uFitA 維持 1,1,0,0）
        gsap.to(uniforms.uOpacity, { value: 1, duration: CARDS_CONFIG.fadeIn })
      },
    })
  })

  // 第二波 + 輪播：等第一波佇列消化完再排
  const carouselTextures = new Map() // card → [texture, ...]（依 files 順序）
  cards.forEach((card) => {
    const { work } = card.userData
    if (work.files.length < 2) return

    carouselTextures.set(card, [])
    work.files.slice(1).forEach((file, idx) => {
      enqueue({
        url: thumbSrc(work, file),
        done(texture) {
          carouselTextures.get(card)[idx] = texture
        },
      })
    })
  })

  // ----- 輪播：多圖卡每隔幾秒 crossfade 到下一張 -----
  // 各卡起跑時間隨機錯開，畫面不會整齊劃一地同時換圖。
  // 使用者偏好減少動態時不啟動（燈箱裡仍看得到全部圖片）。
  function startCarousel(card) {
    const { work, uniforms } = card.userData
    const textures = [uniforms.uTexA.value, ...(carouselTextures.get(card) || [])]

    function step() {
      card.userData.fileIndex = (card.userData.fileIndex + 1) % work.files.length
      const next = textures[card.userData.fileIndex]
      if (!next || !next.image) return schedule() // 還沒載到就先跳過這輪

      const aspect = next.image.width / next.image.height
      uniforms.uTexB.value = next
      uniforms.uFitB.value = coverFit(card.userData.planeAspect, aspect)

      gsap.to(uniforms.uMix, {
        value: 1,
        duration: CARDS_CONFIG.crossfade,
        ease: 'power1.inOut',
        onComplete() {
          // 把 B 槽搬回 A 槽，uMix 歸零，準備下一次
          uniforms.uTexA.value = uniforms.uTexB.value
          uniforms.uFitA.value.copy(uniforms.uFitB.value)
          uniforms.uMix.value = 0
          schedule()
        },
      })
    }

    function schedule() {
      gsap.delayedCall(CARDS_CONFIG.carouselEvery + Math.random() * 2, step)
    }

    // 隨機延遲起跑（0~carouselEvery 秒）
    gsap.delayedCall(Math.random() * CARDS_CONFIG.carouselEvery, step)
  }

  if (!reducedMotion) {
    cards.forEach((card) => {
      if (card.userData.work.files.length > 1) startCarousel(card)
    })
  }

  // ----- billboard：卡片永遠面向鏡頭 -----
  // 卡片是旋轉中的 group 的子物件，所以要先「抵銷」group 的旋轉，
  // 再套上鏡頭的朝向（兩個四元數相乘）
  const qGroupInv = new THREE.Quaternion()
  function update(camera) {
    group.getWorldQuaternion(qGroupInv).invert()
    const qBillboard = qGroupInv.multiply(camera.quaternion)
    cards.forEach((card) => card.quaternion.copy(qBillboard))
  }

  return { group, cards, update }
}

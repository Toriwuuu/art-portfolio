// ===== 作品卡片球 =====
// 36 件作品的卡片，用「fibonacci 球面」均勻鋪在一顆隱形球的表面，
// 繞著中央的玻璃流體。卡片永遠面向鏡頭（billboard），
// 多圖作品的卡片會像小輪播一樣輪流換圖（crossfade）。

import * as THREE from 'three'
import gsap from 'gsap'
import { works, thumbSrc } from './data.js'

// ---------- 可調參數 ----------
export const CARDS_CONFIG = {
  radius: 3.0,         // 卡片球半徑（桌機）
  radiusMobile: 2.7,
  baseHeight: 0.82,    // 卡片基準高度（24 張卡比較疏，可以大一點）
  maxWidth: 1.3,       // 卡片寬度上限（橫圖不要太霸道）
  fadeIn: 0.6,         // 貼圖載入後的淡入秒數
  carouselEvery: 4,    // 多圖卡每隔幾秒換一張
  crossfade: 2.0,      // 換圖的溶解轉場秒數
  concurrency: 6,      // 同時下載幾張貼圖
}

// 卡片的材質 shader：
// 兩個貼圖槽（uTexA / uTexB）+ uMix 做輪播換圖（液態溶解，不是死板的淡入淡出）。
// uOpacity 做載入淡入，uHover 在邊緣畫桃紅細框。
// uSeed 讓每次溶解圖案不同；uFitA / uFitB 是「cover 裁切」的 UV 縮放與位移。
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
uniform float uSeed; // 每次換圖換一個亂數 → 溶解圖案不會每次都一樣
uniform vec4 uFitA;  // xy = UV 縮放, zw = UV 位移
uniform vec4 uFitB;
varying vec2 vUv;

// 便宜亂數 + 平滑 value noise：給溶解一個有機的流動邊界（呼應流體玻璃與膠片顆粒）
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec3 a = texture2D(uTexA, vUv * uFitA.xy + uFitA.zw).rgb;
  vec3 b = texture2D(uTexB, vUv * uFitB.xy + uFitB.zw).rgb;

  // ----- 液態溶解：用噪聲當門檻，新圖像水流一樣從各處滲進來 -----
  // 兩層噪聲疊加（大塊流動 + 細節）；門檻隨 uMix 推進，整片掃過去換成新圖
  float n = vnoise(vUv * 3.5 + uSeed) * 0.7
          + vnoise(vUv * 9.0 + uSeed * 1.7) * 0.3;
  float soft = 0.22;                          // 溶解邊界的柔軟度
  float t = uMix * (1.0 + soft);              // 確保 uMix=1 時整片都換成 B
  float reveal = smoothstep(n, n + soft, t);  // 0 = 還是 A，1 = 已是 B
  vec3 color = mix(a, b, reveal);

  // 溶解邊界一圈桃紅柔光（呼應品牌色），只在換圖過程中亮
  float edge = 1.0 - abs(reveal - 0.5) * 2.0; // 邊界（reveal≈0.5）處最大
  edge = smoothstep(0.55, 1.0, edge)
       * smoothstep(0.0, 0.08, uMix)          // 開頭淡入
       * smoothstep(1.0, 0.92, uMix);         // 結尾淡出
  color += vec3(0.914, 0.192, 0.8) * edge * 0.5;

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
  const planeGeo = new THREE.PlaneGeometry(1, 1) // 所有卡共用同一個幾何
  let sizeFactor = 1 // GUI 的卡片大小係數

  // ----- 建卡片：fibonacci 球面均勻灑點 -----
  // 黃金角讓每個點跟鄰居距離都差不多，不會擠在兩極
  const N = works.length
  const GOLDEN = Math.PI * (3 - Math.sqrt(5)) // ≈ 2.39996

  const cards = works.map((work, i) => {
    const uniforms = {
      uTexA: { value: null },
      uTexB: { value: null },
      uMix: { value: 0 },
      uSeed: { value: 0 }, // 每次換圖前隨機，溶解圖案才不重複
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
    const unitPos = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r)
    mesh.position.copy(unitPos).multiplyScalar(R)

    // unitPos 是球面上的「方向」，GUI 改半徑時用它重新定位
    // textures：依 files 順序存放這張卡所有已載入的貼圖（輪播換圖時讀這裡）
    mesh.userData = { work, uniforms, unitPos, planeAspect: 1, slot: 0, fileIndex: 0, textures: [] }
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
        card.userData.origScale = card.scale.clone() // GUI 縮放係數的基準
        // 套用目前的 GUI 縮放係數（可能在貼圖載入前就被調過）
        card.scale.multiplyScalar(sizeFactor)
        card.userData.baseScale = card.scale.clone() // hover 放大的還原基準

        uniforms.uTexA.value = texture // 第一張圖不需要裁切（uFitA 維持 1,1,0,0）
        card.userData.textures[0] = texture // 第 0 張就位，輪播時可用
        gsap.to(uniforms.uOpacity, { value: 1, duration: CARDS_CONFIG.fadeIn })
      },
    })
  })

  // 第二波 + 輪播：等第一波佇列消化完再排
  // 載到的圖直接放進該卡的 userData.textures（對齊 files 索引），輪播時即時讀取
  cards.forEach((card) => {
    const { work } = card.userData
    if (work.files.length < 2) return

    work.files.slice(1).forEach((file, idx) => {
      enqueue({
        url: thumbSrc(work, file),
        done(texture) {
          card.userData.textures[idx + 1] = texture // slice(1) 的第 idx 張 = files 的第 idx+1 張
        },
      })
    })
  })

  // ----- 輪播：多圖卡每隔幾秒 crossfade 到下一張 -----
  // 各卡起跑時間隨機錯開，畫面不會整齊劃一地同時換圖。
  // 使用者偏好減少動態時不啟動（燈箱裡仍看得到全部圖片）。
  function startCarousel(card) {
    const { work, uniforms } = card.userData

    function step() {
      // 每次都讀「當下」這張卡載好的貼圖，不在啟動時就拍快照
      //（啟動時圖根本還沒載完，拍下來會是一堆 null → 輪播永遠跑不動）
      const textures = card.userData.textures
      card.userData.fileIndex = (card.userData.fileIndex + 1) % work.files.length
      const next = textures[card.userData.fileIndex]
      if (!next || !next.image) return schedule() // 還沒載到就先跳過這輪

      const aspect = next.image.width / next.image.height
      uniforms.uTexB.value = next
      uniforms.uFitB.value = coverFit(card.userData.planeAspect, aspect)
      uniforms.uSeed.value = Math.random() * 10 // 這次溶解的隨機圖案

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

  // ----- 給 GUI 面板的即時調整 -----
  // 改卡片球半徑：沿著各自的方向重新定位
  function setRadius(r) {
    cards.forEach((card) => {
      card.position.copy(card.userData.unitPos).multiplyScalar(r)
    })
  }

  // 改卡片大小：以載入時的原始大小為基準乘上係數
  function setSizeFactor(f) {
    sizeFactor = f
    cards.forEach((card) => {
      if (!card.userData.origScale) return // 貼圖還沒載到
      card.userData.baseScale.copy(card.userData.origScale).multiplyScalar(f)
      card.scale.copy(card.userData.baseScale)
    })
  }

  return { group, cards, update, setRadius, setSizeFactor }
}

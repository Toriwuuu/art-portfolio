// ===== 3D 流體背景 =====
// 做法：一顆高細分的球體（icosphere），在 GPU 上用 simplex noise
// 把表面往外推擠，看起來就像一團緩慢流動的液體。
// 表面顏色用「fresnel」技巧：正對鏡頭的地方近黑、邊緣透出霓虹色，
// 像暗室裡被彩色燈打亮輪廓的物體——這讓背景有存在感又不搶作品。
//
// 名詞小抄（給設計師的比喻）：
// - shader：跑在顯示卡上的小程式。vertex shader 決定「形狀」，
//   fragment shader 決定「顏色」，就像先捏陶再上釉。
// - uniform：從 JS 傳進 shader 的變數，像是混音台上的旋鈕。
// - simplex noise：一種「自然感的亂數」，相鄰的值會平滑過渡，
//   常拿來做雲、水、火這類有機的東西。

import * as THREE from 'three'
import gsap from 'gsap'

// ---------- 可調參數都集中在這裡 ----------
const CONFIG = {
  radius: 1.6,          // 球的基本半徑
  detail: 64,           // 球面細分程度（越高越平滑、越吃效能）
  detailMobile: 24,     // 手機用的細分程度
  cameraZ: 4.6,         // 鏡頭距離（越大球看起來越小）

  noiseFreq: 0.9,       // 噪聲頻率：越大表面皺褶越細碎
  noiseAmp: 0.45,       // 噪聲振幅：越大起伏越誇張
  flowSpeed: 0.12,      // 流動速度：越大流得越快

  mouseLerp: 0.04,      // 滑鼠跟隨的慢半拍程度（越小越慵懶）
  mouseTilt: 0.25,      // 滑鼠造成的傾轉幅度（弧度）
  mouseRipple: 0.35,    // 滑鼠側的額外起伏強度

  colorBase: '#0a0a0d', // 球身底色（近黑）
  colorRimA: '#E931CC', // 邊光主色（桃紅）
  colorRimB: '#50CBF2', // 邊光次色（電光藍）
  colorRimC: '#9E1AAA', // 邊光第三色（紫）

  maxPixelRatio: 1.75,  // 限制解析度倍率，避免 retina 螢幕吃太多效能

  // 各區段的背景亮度（捲到該區時漸變過去）
  dimBySection: {
    hero: 1.0,
    illustration: 0.3,
    plastic: 0.3,
    contact: 0.55,
  },
}

// ---------- GLSL：Ashima 的 3D simplex noise（公有領域）----------
// 這段是業界通用的現成實作，可以當黑盒子：給一個 3D 座標，回傳 -1~1 的平滑亂數
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

// ---------- vertex shader：決定流體的「形狀」----------
const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uFreq;
uniform float uAmp;
uniform vec2 uMouse;
uniform float uRipple;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vNoise;

${SNOISE}

// 計算某個點該被推出去多遠：兩層噪聲疊加（大起伏 + 小細節）
float displace(vec3 p) {
  float n = snoise(p * uFreq + uTime) * 0.7
          + snoise(p * uFreq * 2.3 - uTime * 0.7) * 0.3;

  // 滑鼠那一側的起伏加強一點，產生「被滑鼠攪動」的感覺
  vec3 mouseDir = normalize(vec3(uMouse, 0.6));
  float facing = smoothstep(0.0, 1.0, dot(normalize(p), mouseDir));
  return n * uAmp * (1.0 + facing * uRipple);
}

void main() {
  // 把頂點沿著自己的法線方向推出去
  vec3 displaced = position + normal * displace(position);

  // 法線需要重算（表面變形了，原本的法線不準）：
  // 取旁邊兩個一點點距離的點，看它們變形後的位置，用外積求出新的面朝向
  float eps = 0.08;
  vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.001)));
  vec3 bitangent = normalize(cross(normal, tangent));
  vec3 pT = position + tangent * eps;
  vec3 pB = position + bitangent * eps;
  vec3 dT = (pT + normal * displace(pT)) - displaced;
  vec3 dB = (pB + normal * displace(pB)) - displaced;
  vNormal = normalize(cross(dT, dB));

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  vNoise = displace(position) / max(uAmp, 0.0001); // 留給上色用（-1~1 左右）

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

// ---------- fragment shader：決定流體的「顏色」----------
const FRAGMENT = /* glsl */ `
uniform vec3 uColorBase;
uniform vec3 uColorRimA;
uniform vec3 uColorRimB;
uniform vec3 uColorRimC;
uniform float uDim;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vNoise;

void main() {
  // fresnel：表面越「側對」鏡頭值越大 → 邊緣亮、中心暗
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), 2.5);

  // 邊光顏色在三個霓虹色之間流動（用噪聲值當混色比例）
  vec3 rim = mix(uColorRimA, uColorRimB, smoothstep(-0.6, 0.6, vNoise));
  rim = mix(rim, uColorRimC, smoothstep(0.2, 0.9, fresnel));

  // 底色近黑，邊緣混入霓虹色；uDim 控制整體亮度（捲動時調暗）
  vec3 color = uColorBase + rim * fresnel * 0.9;
  gl_FragColor = vec4(color * uDim, 1.0);
}
`

export function initFluidBg() {
  const canvas = document.getElementById('fluid-bg')

  // ----- 降級處理：以下情況直接不啟動 3D 背景 -----
  // body 本身的雜訊 + 深色漸層就是備案背景，頁面不會開天窗
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) return

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
  } catch {
    return // 瀏覽器不支援 WebGL
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio))
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  )
  camera.position.z = CONFIG.cameraZ

  // 手機用較低的細分程度，省效能
  const isMobile = window.innerWidth < 768
  const detail = isMobile ? CONFIG.detailMobile : CONFIG.detail

  const uniforms = {
    uTime: { value: 0 },
    uFreq: { value: CONFIG.noiseFreq },
    uAmp: { value: CONFIG.noiseAmp },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRipple: { value: CONFIG.mouseRipple },
    uDim: { value: CONFIG.dimBySection.hero },
    uColorBase: { value: new THREE.Color(CONFIG.colorBase) },
    uColorRimA: { value: new THREE.Color(CONFIG.colorRimA) },
    uColorRimB: { value: new THREE.Color(CONFIG.colorRimB) },
    uColorRimC: { value: new THREE.Color(CONFIG.colorRimC) },
  }

  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(CONFIG.radius, detail),
    new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
    })
  )
  scene.add(mesh)

  // ----- 滑鼠互動：目標值 → 每幀慢慢追上（lerp），形成慵懶的跟隨感 -----
  const mouseTarget = new THREE.Vector2(0, 0)
  window.addEventListener('pointermove', (e) => {
    // 把滑鼠座標換算成 -1 ~ 1（畫面中心是 0,0）
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseTarget.y = -((e.clientY / window.innerHeight) * 2 - 1)
  })

  // ----- 捲動到不同區段時調整背景亮度 -----
  // 注意：畫廊區很長，不能用「區塊有 35% 在畫面內」當條件（永遠達不到）。
  // 改用 rootMargin 把觀察範圍縮成視窗中間的一條帶：
  // 哪個區段蓋住畫面中線，就用哪個區段的亮度。
  const sections = ['hero', 'illustration', 'plastic', 'contact']
  const dimObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const dim = CONFIG.dimBySection[entry.target.id]
        gsap.to(uniforms.uDim, { value: dim, duration: 1.2, ease: 'power2.out' })
      })
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  )
  sections.forEach((id) => {
    const el = document.getElementById(id)
    if (el) dimObserver.observe(el)
  })

  // ----- 視窗大小改變 -----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  // ----- 每幀更新 -----
  const clock = new THREE.Clock()
  let rafId = null

  function tick() {
    const t = clock.getElapsedTime()
    uniforms.uTime.value = t * CONFIG.flowSpeed

    // 滑鼠慢慢追上目標（每幀靠近 4%）
    uniforms.uMouse.value.lerp(mouseTarget, CONFIG.mouseLerp)

    // 球本身緩慢自轉 + 隨滑鼠微微傾轉
    mesh.rotation.y = t * 0.05 + uniforms.uMouse.value.x * CONFIG.mouseTilt
    mesh.rotation.x = uniforms.uMouse.value.y * -CONFIG.mouseTilt

    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  tick()

  // ----- 分頁切到背景時暫停渲染，省電 -----
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId)
      rafId = null
    } else if (!rafId) {
      clock.start()
      tick()
    }
  })
}

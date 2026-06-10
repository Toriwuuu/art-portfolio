// ===== 中央流體 =====
// 一顆高細分球體（icosphere），在 GPU 上用 simplex noise 把表面往外推擠，
// 看起來像一團緩慢流動的液體。M2 先沿用 v2 的 fresnel 霓虹材質，
// M4 會換成 MeshTransmissionMaterial（流動玻璃）。
//
// 名詞小抄：
// - shader：跑在顯示卡上的小程式。vertex shader 決定「形狀」，
//   fragment shader 決定「顏色」。
// - uniform：從 JS 傳進 shader 的變數，像混音台上的旋鈕。
// - simplex noise：自然感的亂數，相鄰的值平滑過渡，適合做雲、水、火。

import * as THREE from 'three'

// ---------- 可調參數 ----------
export const BLOB_CONFIG = {
  radius: 1.6,        // 球的基本半徑
  detail: 64,         // 球面細分程度（越高越平滑、越吃效能）
  detailMobile: 24,   // 手機用的細分程度

  noiseFreq: 0.9,     // 噪聲頻率：越大表面皺褶越細碎
  noiseAmp: 0.45,     // 噪聲振幅：越大起伏越誇張
  flowSpeed: 0.12,    // 流動速度

  mouseRipple: 0.35,  // 滑鼠側的額外起伏強度
  mouseTilt: 0.25,    // 滑鼠造成的傾轉幅度（弧度）

  colorBase: '#0a0a0d',
  colorRimA: '#E931CC',
  colorRimB: '#50CBF2',
  colorRimC: '#9E1AAA',
}

// ---------- GLSL：Ashima 的 3D simplex noise（公有領域，業界通用實作）----------
// 可以當黑盒子：給一個 3D 座標，回傳 -1~1 的平滑亂數
export const SNOISE = /* glsl */ `
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

// ---------- GLSL：位移函式（v2 移植，形狀的核心）----------
// 兩層噪聲疊加（大起伏 + 小細節），滑鼠那一側起伏加強形成「被攪動」感
export const DISPLACE = /* glsl */ `
uniform float uTime;
uniform float uFreq;
uniform float uAmp;
uniform vec2 uMouse;
uniform float uRipple;

float displace(vec3 p) {
  float n = snoise(p * uFreq + uTime) * 0.7
          + snoise(p * uFreq * 2.3 - uTime * 0.7) * 0.3;

  vec3 mouseDir = normalize(vec3(uMouse, 0.6));
  float facing = smoothstep(0.0, 1.0, dot(normalize(p), mouseDir));
  return n * uAmp * (1.0 + facing * uRipple);
}
`

// M2 暫用的 vertex/fragment（v2 的 fresnel 霓虹材質），M4 換玻璃
const VERTEX = /* glsl */ `
${SNOISE}
${DISPLACE}

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vNoise;

void main() {
  vec3 displaced = position + normal * displace(position);

  // 表面變形後法線要重算：取旁邊兩個點變形後的位置，用外積求新的面朝向
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
  vNoise = displace(position) / max(uAmp, 0.0001);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const FRAGMENT = /* glsl */ `
uniform vec3 uColorBase;
uniform vec3 uColorRimA;
uniform vec3 uColorRimB;
uniform vec3 uColorRimC;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vNoise;

void main() {
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), 2.5);

  vec3 rim = mix(uColorRimA, uColorRimB, smoothstep(-0.6, 0.6, vNoise));
  rim = mix(rim, uColorRimC, smoothstep(0.2, 0.9, fresnel));

  vec3 color = uColorBase + rim * fresnel * 0.9;
  gl_FragColor = vec4(color, 1.0);
}
`

// 建立流體網格。回傳 mesh 與 uniforms（渲染迴圈每幀更新 uTime / uMouse）
export function createBlob(isMobile) {
  const uniforms = {
    uTime: { value: 0 },
    uFreq: { value: BLOB_CONFIG.noiseFreq },
    uAmp: { value: BLOB_CONFIG.noiseAmp },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRipple: { value: BLOB_CONFIG.mouseRipple },
    uColorBase: { value: new THREE.Color(BLOB_CONFIG.colorBase) },
    uColorRimA: { value: new THREE.Color(BLOB_CONFIG.colorRimA) },
    uColorRimB: { value: new THREE.Color(BLOB_CONFIG.colorRimB) },
    uColorRimC: { value: new THREE.Color(BLOB_CONFIG.colorRimC) },
  }

  const detail = isMobile ? BLOB_CONFIG.detailMobile : BLOB_CONFIG.detail
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(BLOB_CONFIG.radius, detail),
    new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms })
  )

  return { mesh, uniforms }
}

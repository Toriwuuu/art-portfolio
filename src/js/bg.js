// ===== 動態雜訊背景 =====
// 鋪在場景最底層的全螢幕平面：深色底 + 會微微閃爍飄動的膠片顆粒，
// 讓背景不是死黑一片、有類比質感（v1 noise.png 的會動版本）。
// 它也會被玻璃流體折射，玻璃裡面會有細細的顆粒流動感。

import * as THREE from 'three'

// ---------- 可調參數（GUI 面板可即時調整）----------
export const BG_CONFIG = {
  color: '#0a0a0d',  // 背景底色
  intensity: 0.06,   // 顆粒強度：0 = 純色，越大顆粒越明顯
  scale: 2.0,        // 顆粒大小（螢幕像素）
  speed: 1.0,        // 飄動/閃爍速度
}

const VERTEX = /* glsl */ `
void main() {
  // 直接輸出螢幕座標（NDC），z 推到最遠 → 永遠鋪滿整個畫面、永遠在最後面
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uScale;
uniform float uSpeed;
uniform float uTime;

// 便宜的亂數：給一個 2D 座標回傳 0~1
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  // 把螢幕像素量化成 uScale 大小的格子 = 顆粒
  vec2 grid = floor(gl_FragCoord.xy / max(uScale, 0.5));

  // 顆粒以 uSpeed 的頻率重新洗牌 → 膠片顆粒的微閃爍
  float seed = floor(uTime * uSpeed * 18.0);
  float grain = hash(grid + seed) - 0.5;

  // 大尺度的緩慢明暗呼吸，讓背景像活的（幅度刻意很小）
  float breath = sin(grid.x * 0.015 + grid.y * 0.02 + uTime * uSpeed * 0.6) * 0.3;

  vec3 color = uColor + (grain + breath * 0.4) * uIntensity;
  gl_FragColor = vec4(color, 1.0);
}
`

export function createNoiseBg() {
  const uniforms = {
    uColor: { value: new THREE.Color(BG_CONFIG.color) },
    uIntensity: { value: BG_CONFIG.intensity },
    uScale: { value: BG_CONFIG.scale },
    uSpeed: { value: BG_CONFIG.speed },
    uTime: { value: 0 },
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      depthTest: false,  // 不參與深度判斷
      depthWrite: false, // 也不寫深度 → 所有東西都畫在它前面
    })
  )
  mesh.frustumCulled = false // 頂點直接是螢幕座標，不需要視錐剔除
  mesh.renderOrder = -1      // 最先畫（= 墊在最後面）

  return { mesh, uniforms }
}

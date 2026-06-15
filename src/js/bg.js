// ===== 動態星雲背景 =====
// 鋪在場景最底層的全螢幕平面：接近純黑的太空底 + 會緩慢捲動的星雲雲氣，
// 點綴零星的星點。刻意很低調（只在雲團處發色、其餘維持底色），不搶過中央流體球，
// 但一直在流動。它也會被玻璃流體折射，玻璃裡面會透出淡淡的雲氣與星光。
//
// 效能：fractal noise 只用 4 階、domain warp 只做一層，密度遮罩讓多數像素直接落在
// 底色上，整體成本和原本的顆粒版本相當，行動裝置也跑得動。

import * as THREE from 'three'

// ---------- 可調參數（GUI 面板可即時調整）----------
export const BG_CONFIG = {
  color: '#0a0a0d',  // 太空底色（接近純黑）
  intensity: 0.22,   // 星雲強度：0 = 純底色，越大雲氣越明顯
  scale: 2.6,        // 星雲尺度：越小雲團越大越柔、越大越細碎
  speed: 1.0,        // 雲氣流動速度
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
uniform vec2 uResolution; // 畫面解析度（framebuffer 像素），用來做長寬比校正

// 便宜的亂數：給一個 2D 座標回傳 0~1
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 平滑的 value noise：把亂數內插成連續的起伏（雲氣的基本磚塊）
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// fractal noise：疊 4 階不同尺度的 noise → 雲氣才有大團塊也有細節（階數壓在 4 顧效能）
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  // 螢幕座標轉成 0~1 的 uv，x 乘上長寬比 → 雲氣不會被視窗比例拉扁
  vec2 uv = gl_FragCoord.xy / uResolution;
  uv.x *= uResolution.x / uResolution.y;

  float t = uTime * uSpeed * 0.04;       // 整體流動刻意很慢
  vec2 p = uv * uScale;

  // domain warp：先用一層 fbm 去「推」座標，雲氣才會像在捲動，而不是死板的斑點
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(3.1, 1.7) - t));
  float f = fbm(p + 1.8 * q);            // 最終的雲氣密度場

  // 三種星雲色調（貼近品牌的桃紅／紫藍），用密度場混出層次
  vec3 magenta = vec3(0.85, 0.15, 0.75);
  vec3 indigo  = vec3(0.22, 0.14, 0.55);
  vec3 warm    = vec3(0.95, 0.35, 0.62);
  vec3 neb = mix(indigo, magenta, clamp(f * 1.4, 0.0, 1.0));
  neb = mix(neb, warm, clamp(q.x * q.y * 1.6, 0.0, 1.0));

  // 密度遮罩：雲團濃的地方上色、薄處留一點微光，其餘維持底色 → 低調但讀得出雲氣
  float density = smoothstep(0.28, 0.9, f);
  vec3 color = uColor + neb * density * uIntensity;

  // 稀疏星點：把畫面切成小格，只留最亮的極少數，緩慢明滅（pow 把暗點壓掉）
  vec2 sg = floor(gl_FragCoord.xy / 2.5);
  float star = pow(hash(sg + 17.0), 42.0);
  float twinkle = 0.65 + 0.35 * sin(uTime * uSpeed * 0.9 + hash(sg) * 6.2831);
  color += star * twinkle * 0.12;

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
    // 解析度由 scene.js 在初始化與每次縮放時更新（長寬比校正用）
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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

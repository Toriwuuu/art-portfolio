// ===== fluid-blob 的 GLSL 與材質注入 =====
// 「流體感」的核心：用 simplex noise 在顯示卡上推擠球面的小程式都在這裡。
//
// 名詞小抄：
// - shader：跑在顯示卡上的小程式。vertex shader 決定「形狀」，
//   fragment shader 決定「顏色」。
// - uniform：從 JS 傳進 shader 的變數，像混音台上的旋鈕。
// - onBeforeCompile：three.js 在編譯內建材質前讓你「加料」的鉤子。
//   我們用它把噪聲位移塞進玻璃材質的 vertex shader——
//   注意 MeshTransmissionMaterial 自己也用了這個鉤子（塞色散程式碼），
//   所以要先存下它的，串接著呼叫，不能直接蓋掉。
//
// 升版注意：這裡靠字串替換 three 內建材質的 shader 片段
// （#include <begin_vertex> 等），three 或 @pmndrs/vanilla 升版可能改掉
// 這些片段名稱——升版後務必回來重新驗證（見模組 README）。

// ---------- GLSL：Ashima 的 3D simplex noise（公有領域，業界通用實作）----------
// 可以當黑盒子：給一個 3D 座標，回傳 -1~1 的平滑亂數
export const SNOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float blobSnoise(vec3 v) {
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

// ---------- GLSL：位移函式（形狀的核心）----------
// 兩層噪聲疊加（大起伏 + 小細節），滑鼠那一側起伏加強形成「被攪動」感。
// 函式與 noise 都加 blob 前綴，避免跟 MeshTransmissionMaterial
// 自己注入的 snoise 撞名。
export const DISPLACE = /* glsl */ `
uniform float uTime;
uniform float uFreq;
uniform float uAmp;
uniform vec2 uMouse;
uniform float uRipple;
uniform vec3 uPokePoint;     // 游標映到球上的影響點（物件座標）
uniform float uPokeStrength; // 0~1：游標越快越大，之後衰減回 0（聚合）

float blobDisplace(vec3 p) {
  float n = blobSnoise(p * uFreq + uTime) * 0.7
          + blobSnoise(p * uFreq * 2.3 - uTime * 0.7) * 0.3;

  vec3 mouseDir = normalize(vec3(uMouse, 0.6));
  float facing = smoothstep(0.0, 1.0, dot(normalize(p), mouseDir));
  return n * uAmp * (1.0 + facing * uRipple);
}

// 游標牽引：游標附近的表面被輕輕攪動（高頻流動噪聲，會往內外盪 → 像被光束擾動而散開），
// uPokeStrength 衰減回 0 時回到平靜（流體聚合）。沿法線、力道刻意小。
float blobPoke(vec3 p) {
  if (uPokeStrength < 0.001) return 0.0;
  float dist = length(p - uPokePoint);
  float spot = exp(-dist * dist * 2.2);                     // 只影響游標附近
  float churn = blobSnoise(p * uFreq * 2.5 + uTime * 3.0);  // -1~1 高頻流動
  return spot * uPokeStrength * (0.15 + churn * 0.45);      // 以攪動為主、微鼓
}
`

// 把「噪聲位移」注入任何 MeshPhysicalMaterial 系的材質：
// 1) 形狀：頂點沿法線推出去（替換 begin_vertex）
// 2) 法線：表面變形後要重算——取旁邊兩個點變形後的位置，
//    用外積求新的面朝向（替換 beginnormal_vertex）
export function injectDisplacement(material, uniforms) {
  const previous = material.onBeforeCompile // MTM 自己的注入，先存起來
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer) // 先讓原本的跑完
    Object.assign(shader.uniforms, uniforms)

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${SNOISE}\n${DISPLACE}`)
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        vec3 blobDisplaced = position + normal * blobDisplace(position);
        float blobEps = 0.08;
        vec3 blobTangent = normalize(cross(normal, vec3(0.0, 1.0, 0.001)));
        vec3 blobBitangent = normalize(cross(normal, blobTangent));
        vec3 blobPT = position + blobTangent * blobEps;
        vec3 blobPB = position + blobBitangent * blobEps;
        vec3 blobDT = (blobPT + normal * blobDisplace(blobPT)) - blobDisplaced;
        vec3 blobDB = (blobPB + normal * blobDisplace(blobPB)) - blobDisplaced;
        vec3 objectNormal = normalize(cross(blobDT, blobDB));
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `vec3 transformed = position + normal * (blobDisplace(position) + blobPoke(position));`
      )
  }
  material.needsUpdate = true
}

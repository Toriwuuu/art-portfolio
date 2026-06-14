// ===== 玻璃流體的「本體」：幾何 + 材質 + uniforms =====
// 形狀：高細分球體（icosphere）在 GPU 上用 simplex noise 推擠表面，
//      像一團緩慢流動的液體。
// 材質：drei-vanilla 的 MeshTransmissionMaterial「透射玻璃」——
//      後面的內容會被折射、帶色散（彩虹邊）與流動扭曲，
//      attenuationColor 讓厚的地方透出顏色。
//
// 這一層是「純粹的」：只負責把 mesh 做出來，
// 不碰滑鼠事件、不碰時間、不碰離屏畫布——那些歸 fluid-blob.js 管。

import * as THREE from 'three'
import { MeshTransmissionMaterial } from '@pmndrs/vanilla'
import { injectDisplacement } from './shaders.js'

// 建立玻璃流體本體。params = 預設值 + 使用者覆寫（見 defaults.js）
export function createBlobMesh(params) {
  // 位移的旋鈕（傳進 vertex shader）
  const uniforms = {
    uTime: { value: 0 },
    uFreq: { value: params.noiseFreq },
    uAmp: { value: params.noiseAmp },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRipple: { value: params.mouseRipple },
  }

  let material
  if (params.useTransmission) {
    material = new MeshTransmissionMaterial({
      samples: params.isMobile ? params.samplesMobile : params.samples,
      chromaticAberration: params.chromaticAberration,
      anisotropicBlur: params.anisotropicBlur,
      thickness: params.thickness,
      roughness: params.roughness,
      distortion: params.distortion,
      distortionScale: params.distortionScale,
      temporalDistortion: params.temporalDistortion,
      attenuationColor: new THREE.Color(params.attenuationColor),
      attenuationDistance: params.attenuationDistance,
    })
  } else {
    // 備案：three 內建透射（不用手動 buffer pass，效能較省、效果較簡單）
    material = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      thickness: params.thickness,
      roughness: params.roughness,
      attenuationColor: new THREE.Color(params.attenuationColor),
      attenuationDistance: params.attenuationDistance,
    })
  }
  material.ior = params.ior
  material.color = new THREE.Color(params.glassColor)
  material.envMapIntensity = params.envMapIntensity
  injectDisplacement(material, uniforms)

  const detail = params.isMobile ? params.detailMobile : params.detail
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(params.radius, detail),
    material
  )

  return { mesh, material, uniforms, isTransmission: params.useTransmission }
}

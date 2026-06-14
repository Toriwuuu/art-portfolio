// ===== 主題預設組 =====
// 一鍵把整顆球換成另一種玻璃外觀。每個預設都是一包「外觀參數」，
// 用法：createFluidBlob({ preset: 'aqua' }) 或跑起來後 blob.applyPreset('aqua')。
//
// 重點：五個預設都明列「同一組」外觀參數（下面這 12 個），
// 這樣從任何一個切到另一個都會「完整覆蓋」，不會殘留上一個主題的殘影。
// 形狀的細項（noiseFreq、distortionScale 等）刻意不放進來，維持一致的基本手感。

export const PRESETS = {
  // 桃紅 · 招牌（= 預設值，當「回到原本的樣子」用）
  blush: {
    glassColor: '#f6e6f3',
    attenuationColor: '#E931CC',
    attenuationDistance: 1.6,
    roughness: 0.08,
    ior: 1.35,
    chromaticAberration: 0.5,
    distortion: 0.5,
    temporalDistortion: 0.12,
    thickness: 1.0,
    envMapIntensity: 0.55,
    noiseAmp: 0.45,
    flowSpeed: 0.12,
  },

  // 清水 · 透涼藍（很清澈、水的折射率、淡藍透色）
  aqua: {
    glassColor: '#e9f6ff',
    attenuationColor: '#1f9fd6',
    attenuationDistance: 1.9,
    roughness: 0.04,
    ior: 1.33,
    chromaticAberration: 0.28,
    distortion: 0.65,
    temporalDistortion: 0.16,
    thickness: 1.0,
    envMapIntensity: 0.5,
    noiseAmp: 0.42,
    flowSpeed: 0.14,
  },

  // 水銀 · 鏡面金屬（透色距離很短 → 很快變暗像實心，強反射 = 鉻金屬感）
  mercury: {
    glassColor: '#dfe3ea',
    attenuationColor: '#15171b',
    attenuationDistance: 0.6,
    roughness: 0.02,
    ior: 1.5,
    chromaticAberration: 0.12,
    distortion: 0.35,
    temporalDistortion: 0.08,
    thickness: 1.4,
    envMapIntensity: 1.4,
    noiseAmp: 0.38,
    flowSpeed: 0.09,
  },

  // 糖果 · 繽紛果凍（強色散彩虹邊 + 紫透色，起伏更大、流動更快，活潑彈跳）
  candy: {
    glassColor: '#fff0fa',
    attenuationColor: '#7a2cff',
    attenuationDistance: 1.2,
    roughness: 0.06,
    ior: 1.4,
    chromaticAberration: 1.2,
    distortion: 0.75,
    temporalDistortion: 0.18,
    thickness: 1.1,
    envMapIntensity: 0.6,
    noiseAmp: 0.52,
    flowSpeed: 0.17,
  },

  // 琥珀 · 暖蜜金（暖色透色、稍霧、黏稠慢流，像蜂蜜/樹脂）
  amber: {
    glassColor: '#fff2d4',
    attenuationColor: '#cf7a1e',
    attenuationDistance: 1.3,
    roughness: 0.11,
    ior: 1.45,
    chromaticAberration: 0.35,
    distortion: 0.45,
    temporalDistortion: 0.1,
    thickness: 1.25,
    envMapIntensity: 0.5,
    noiseAmp: 0.4,
    flowSpeed: 0.09,
  },
}

// 給 UI（下拉選單）用的順序與中文標籤
export const PRESET_LIST = [
  { id: 'blush', label: '桃紅' },
  { id: 'aqua', label: '清水' },
  { id: 'mercury', label: '水銀' },
  { id: 'candy', label: '糖果' },
  { id: 'amber', label: '琥珀' },
]

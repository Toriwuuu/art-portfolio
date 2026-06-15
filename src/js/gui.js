// ===== GUI 參數面板 =====
// 右下角一顆玻璃擬態小按鈕（預設只有它），點擊展開 Tweakpane 面板，
// 可以即時調整 3D 場景的參數。面板樣式走 Apple 毛玻璃質感（見 _gui.scss）。
// Tweakpane 用動態載入：沒人打開面板就不會下載它。

import { icons } from './icons.js'
import { BG_CONFIG } from './bg.js'
import { PRESET_LIST } from '../lib/fluid-blob/index.js'
import { CARDS_CONFIG } from './cards.js'
import { CONTROLS_CONFIG } from './controls.js'

export function initGui(targets) {
  // ----- 右下角玻璃按鈕 -----
  const btn = document.createElement('button')
  btn.className = 'gui-toggle'
  btn.type = 'button'
  btn.setAttribute('aria-label', '調整 3D 參數')
  btn.innerHTML = icons.tune
  document.body.appendChild(btn)

  // ----- 面板容器（先建空殼，第一次點擊才載入 Tweakpane）-----
  const container = document.createElement('div')
  container.className = 'gui-panel'
  container.hidden = true
  document.body.appendChild(container)

  let built = false
  btn.addEventListener('click', async () => {
    if (!built) {
      built = true
      await buildPane(container, targets)
    }
    container.hidden = !container.hidden
    btn.classList.toggle('is-active', !container.hidden)
  })

  // ----- 點面板以外的地方就收起來 -----
  function closePanel() {
    container.hidden = true
    btn.classList.remove('is-active')
  }

  // 面板開著時，點到「不是面板、也不是按鈕」的地方（例如 3D 背景）就關閉。
  // 用 pointerdown 而非 click：手指/滑鼠一按下就反應，比較跟手。
  document.addEventListener('pointerdown', (e) => {
    if (container.hidden) return
    if (container.contains(e.target) || btn.contains(e.target)) return
    closePanel()
  })

  // 按 Esc 也能關（鍵盤使用者習慣）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !container.hidden) closePanel()
  })
}

async function buildPane(container, { noiseBg, blob, cards, pinkLight }) {
  const { Pane } = await import('tweakpane')
  const pane = new Pane({ container, title: '3D 參數' })

  // 面板上顯示的值（改了就同步到場景）
  // 玻璃流體的初始值直接讀 blob.params（fluid-blob 模組的「活」參數物件）
  const params = {
    // 背景雜訊
    bgColor: BG_CONFIG.color,
    bgIntensity: BG_CONFIG.intensity,
    bgScale: BG_CONFIG.scale,
    bgSpeed: BG_CONFIG.speed,
    // 玻璃材質
    glassColor: blob.params.glassColor,                   // 玻璃本體色
    roughness: blob.params.roughness,                     // 粗糙度
    chromaticAberration: blob.params.chromaticAberration, // 色散
    anisotropicBlur: blob.params.anisotropicBlur,         // 各向異性模糊
    distortion: blob.params.distortion,                   // 折射扭曲
    distortionScale: blob.params.distortionScale,         // 扭曲尺度
    temporalDistortion: blob.params.temporalDistortion,   // 扭曲流速
    thickness: blob.params.thickness,                     // 厚度
    ior: blob.params.ior,                                 // 折射率
    attenuationColor: blob.params.attenuationColor,       // 透色顏色
    attenuationDistance: blob.params.attenuationDistance, // 透色距離
    envMapIntensity: blob.params.envMapIntensity,         // 反射強度
    // 流體形狀
    noiseFreq: blob.params.noiseFreq,     // 皺褶頻率
    noiseAmp: blob.params.noiseAmp,       // 起伏幅度
    flowSpeed: blob.params.flowSpeed,     // 流動速度
    mouseRipple: blob.params.mouseRipple, // 滑鼠漣漪
    // 游標與運動
    autoRotate: blob.params.autoRotate,           // 自轉開關
    rotateSpeed: blob.params.rotateSpeed,         // 自轉速度
    mouseLerp: blob.params.mouseLerp,             // 滑鼠跟隨慵懶度
    mouseTilt: blob.params.mouseTilt,             // 滑鼠傾轉幅度
    poke: blob.params.poke,                       // 游標撥開開關
    pokeDemo: blob.params.pokeDemo,               // 自動示範（邊調邊看）
    pokeDepth: blob.params.pokeDepth,             // 凹槽深度
    pokeWidth: blob.params.pokeWidth,             // 凹槽廣度
    pokeReboundTime: blob.params.pokeReboundTime, // 回彈時間（秒）
    pokeSensitivity: blob.params.pokeSensitivity, // 撥開靈敏度
    pokeTurnSmooth: blob.params.pokeTurnSmooth,   // 凹槽轉向柔順
    // 卡片與運動
    showCards: true, // 顯示作品圖片（關掉只剩中央流體球）
    cardRadius: CARDS_CONFIG.radius,
    cardSize: 1,
    autoSpeed: CONTROLS_CONFIG.autoSpeed,
    carouselEvery: CARDS_CONFIG.carouselEvery,
    // 燈光
    lightColor: '#E931CC',
    lightIntensity: pinkLight.intensity,
  }
  const defaults = { ...params } // 重設用

  // ---------- 主題預設（放最上面，一鍵換整套玻璃外觀）----------
  // 選了之後：套到實際的球 → 把套用的值同步回面板 → 重畫各 slider。
  const presetState = { preset: '' }
  const presetOptions = { '自訂…': '' }
  PRESET_LIST.forEach(({ id, label }) => { presetOptions[label] = id })
  let applyingPreset = false // 防 refresh 再次觸發本身的 change 造成迴圈
  pane.addBinding(presetState, 'preset', { label: '主題預設', options: presetOptions })
    .on('change', (e) => {
      if (applyingPreset || !e.value) return
      const applied = blob.applyPreset(e.value)
      if (!applied) return
      applyingPreset = true
      Object.assign(params, applied) // 同步面板顯示的數值
      pane.refresh()                 // 重畫玻璃材質/流體形狀那幾組 slider
      applyingPreset = false
    })

  // ---------- 背景星雲 ----------
  const fBg = pane.addFolder({ title: '背景星雲' })
  fBg.addBinding(params, 'bgColor', { label: '太空底色', view: 'color' })
    .on('change', (e) => noiseBg.uniforms.uColor.value.set(e.value))
  fBg.addBinding(params, 'bgIntensity', { label: '星雲強度', min: 0, max: 0.5, step: 0.01 })
    .on('change', (e) => (noiseBg.uniforms.uIntensity.value = e.value))
  fBg.addBinding(params, 'bgScale', { label: '星雲尺度', min: 0.5, max: 6, step: 0.1 })
    .on('change', (e) => (noiseBg.uniforms.uScale.value = e.value))
  fBg.addBinding(params, 'bgSpeed', { label: '流動速度', min: 0, max: 3, step: 0.05 })
    .on('change', (e) => (noiseBg.uniforms.uSpeed.value = e.value))

  // ---------- 玻璃材質 ----------
  // MeshTransmissionMaterial 的屬性直接 set 就會生效（內部是 uniforms）
  const fGlass = pane.addFolder({ title: '玻璃材質', expanded: false })
  fGlass.addBinding(params, 'glassColor', { label: '玻璃本體色', view: 'color' }) // 玻璃本體色
    .on('change', (e) => blob.material.color.set(e.value))
  fGlass.addBinding(params, 'roughness', { label: '粗糙度', min: 0, max: 1, step: 0.01 }) // 粗糙度
    .on('change', (e) => (blob.material.roughness = e.value))
  fGlass.addBinding(params, 'chromaticAberration', { label: '色散', min: 0, max: 2, step: 0.05 }) // 色散
    .on('change', (e) => (blob.material.chromaticAberration = e.value))
  fGlass.addBinding(params, 'anisotropicBlur', { label: '各向異性模糊', min: 0, max: 2, step: 0.01 }) // 各向異性模糊（太大會把後面糊掉）
    .on('change', (e) => (blob.material.anisotropicBlur = e.value))
  fGlass.addBinding(params, 'distortion', { label: '折射扭曲', min: 0, max: 2, step: 0.05 }) // 折射扭曲
    .on('change', (e) => (blob.material.distortion = e.value))
  fGlass.addBinding(params, 'distortionScale', { label: '扭曲尺度', min: 0, max: 2, step: 0.05 }) // 扭曲尺度
    .on('change', (e) => (blob.material.distortionScale = e.value))
  fGlass.addBinding(params, 'temporalDistortion', { label: '扭曲流速', min: 0, max: 1, step: 0.01 }) // 扭曲流速
    .on('change', (e) => (blob.material.temporalDistortion = e.value))
  fGlass.addBinding(params, 'thickness', { label: '厚度', min: 0, max: 3, step: 0.05 })
    .on('change', (e) => (blob.material.thickness = e.value))
  fGlass.addBinding(params, 'ior', { label: '折射率', min: 1, max: 2, step: 0.01 })
    .on('change', (e) => (blob.material.ior = e.value))
  fGlass.addBinding(params, 'attenuationColor', { label: '透色顏色', view: 'color' })
    .on('change', (e) => blob.material.attenuationColor.set(e.value))
  fGlass.addBinding(params, 'attenuationDistance', { label: '透色距離', min: 0.2, max: 5, step: 0.1 })
    .on('change', (e) => (blob.material.attenuationDistance = e.value))
  fGlass.addBinding(params, 'envMapIntensity', { label: '反射強度', min: 0, max: 2, step: 0.05 })
    .on('change', (e) => (blob.material.envMapIntensity = e.value))

  // ---------- 流體形狀 ----------
  const fShape = pane.addFolder({ title: '流體形狀', expanded: false })
  fShape.addBinding(params, 'noiseFreq', { label: '皺褶頻率', min: 0.2, max: 3, step: 0.05 })
    .on('change', (e) => (blob.uniforms.uFreq.value = e.value))
  fShape.addBinding(params, 'noiseAmp', { label: '起伏幅度', min: 0, max: 1, step: 0.01 })
    .on('change', (e) => (blob.uniforms.uAmp.value = e.value))
  fShape.addBinding(params, 'flowSpeed', { label: '流動速度', min: 0, max: 0.5, step: 0.01 })
    .on('change', (e) => (blob.params.flowSpeed = e.value))
  fShape.addBinding(params, 'mouseRipple', { label: '滑鼠漣漪', min: 0, max: 1, step: 0.05 })
    .on('change', (e) => (blob.uniforms.uRipple.value = e.value))

  // ---------- 游標與運動 ----------
  // 球體自轉、滑鼠跟隨傾轉、以及「游標撥開」凹槽互動。
  // 開關/數值寫回 blob.params（update 每幀讀），凹槽深度直接寫 uPokeDepth uniform。
  const fMotion = pane.addFolder({ title: '游標與運動', expanded: false })
  fMotion.addBinding(params, 'autoRotate', { label: '自轉開關' }) // 自轉開關
    .on('change', (e) => (blob.params.autoRotate = e.value))
  fMotion.addBinding(params, 'rotateSpeed', { label: '自轉速度', min: 0, max: 0.3, step: 0.005 }) // 自轉速度（弧度/秒）
    .on('change', (e) => (blob.params.rotateSpeed = e.value))
  fMotion.addBinding(params, 'mouseLerp', { label: '跟隨慵懶度', min: 0.01, max: 0.3, step: 0.01 }) // 滑鼠跟隨慢半拍程度（越小越慵懶）
    .on('change', (e) => (blob.params.mouseLerp = e.value))
  fMotion.addBinding(params, 'mouseTilt', { label: '滑鼠傾轉', min: 0, max: 1, step: 0.01 }) // 滑鼠造成的傾轉幅度（弧度）
    .on('change', (e) => (blob.params.mouseTilt = e.value))
  fMotion.addBinding(params, 'poke', { label: '游標撥開開關' }) // 游標撥開開關（沿移動方向壓出淺凹槽）
    .on('change', (e) => (blob.params.poke = e.value))
  fMotion.addBinding(params, 'pokeDemo', { label: '自動示範' }) // 自動示範：球自己循環撥開，方便邊調下面三項邊看
    .on('change', (e) => (blob.params.pokeDemo = e.value))
  fMotion.addBinding(params, 'pokeDepth', { label: '凹槽深度', min: 0, max: 1, step: 0.01 }) // 凹槽深度（沿法線往內；過深折射會亂）
    .on('change', (e) => (blob.uniforms.uPokeDepth.value = e.value))
  fMotion.addBinding(params, 'pokeWidth', { label: '凹槽廣度', min: 0.3, max: 3, step: 0.05 }) // 凹槽廣度（越大溝越寬、影響範圍越大）
    .on('change', (e) => (blob.uniforms.uPokeWidth.value = e.value))
  fMotion.addBinding(params, 'pokeReboundTime', { label: '回彈時間(秒)', min: 0.2, max: 30, step: 0.1 }) // 停手後約這麼久淡回平整；越大越「黏」、撐越久
    .on('change', (e) => (blob.params.pokeReboundTime = e.value))
  fMotion.addBinding(params, 'pokeSensitivity', { label: '撥開靈敏度', min: 0, max: 1.5, step: 0.05 }) // 游標速度 × 此值 = 凹槽強度（越大越輕劃就有感）
    .on('change', (e) => (blob.params.pokeSensitivity = e.value))
  fMotion.addBinding(params, 'pokeTurnSmooth', { label: '轉向柔順', min: 0, max: 0.97, step: 0.01 }) // 0=瞬間硬切、越接近 1 越慢越柔順（改變方向時不再「啪」一下跳）
    .on('change', (e) => (blob.params.pokeTurnSmooth = e.value))

  // ---------- 卡片與運動 ----------
  const fCards = pane.addFolder({ title: '卡片與運動', expanded: false })
  // 顯示／隱藏整圈作品圖片：關掉時整個卡片群不畫出來，也點不到、滑不到（見 controls.js）
  fCards.addBinding(params, 'showCards', { label: '顯示作品圖片' })
    .on('change', (e) => (cards.group.visible = e.value))
  fCards.addBinding(params, 'cardRadius', { label: '球半徑', min: 2, max: 5, step: 0.1 })
    .on('change', (e) => cards.setRadius(e.value))
  fCards.addBinding(params, 'cardSize', { label: '卡片大小', min: 0.5, max: 2, step: 0.05 })
    .on('change', (e) => cards.setSizeFactor(e.value))
  fCards.addBinding(params, 'autoSpeed', { label: '自轉速度', min: 0, max: 0.3, step: 0.01 })
    .on('change', (e) => (CONTROLS_CONFIG.autoSpeed = e.value))
  fCards.addBinding(params, 'carouselEvery', { label: '輪播間隔秒', min: 2, max: 10, step: 0.5 })
    .on('change', (e) => (CARDS_CONFIG.carouselEvery = e.value))

  // ---------- 燈光 ----------
  const fLight = pane.addFolder({ title: '燈光', expanded: false })
  fLight.addBinding(params, 'lightColor', { label: '點光顏色', view: 'color' })
    .on('change', (e) => pinkLight.color.set(e.value))
  fLight.addBinding(params, 'lightIntensity', { label: '點光強度', min: 0, max: 100, step: 1 })
    .on('change', (e) => (pinkLight.intensity = e.value))

  // ---------- 工具 ----------
  // 複製目前設定：調出喜歡的樣子後按這個，把 JSON 貼給 Claude 就能改成預設值
  pane.addButton({ title: '複製目前設定' }).on('click', () => {
    navigator.clipboard.writeText(JSON.stringify(params, null, 2))
  })

  pane.addButton({ title: '重設為預設值' }).on('click', () => {
    Object.assign(params, defaults)
    pane.refresh() // refresh 會觸發每個 binding 的 change，把值套回場景
  })

  // 面板自己會攔截滑鼠事件，不會誤觸後面的 3D 場景（CSS pointer-events）
  return pane
}

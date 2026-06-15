// ===== GUI 參數面板 =====
// 右下角一顆玻璃擬態小按鈕（預設只有它），點擊展開 Tweakpane 面板，
// 可以即時調整 3D 場景的參數。面板樣式走 Apple 毛玻璃質感（見 _gui.scss）。
// Tweakpane 用動態載入：沒人打開面板就不會下載它。

import { icons } from './icons.js'
import { BG_CONFIG } from './bg.js'
import { PRESET_LIST } from '../lib/fluid-blob/index.js'
import { CARDS_CONFIG } from './cards.js'
import { CONTROLS_CONFIG } from './controls.js'
import { t, onLangChange } from './i18n.js'

export function initGui(targets) {
  // ----- 右下角玻璃按鈕 -----
  const btn = document.createElement('button')
  btn.className = 'gui-toggle'
  btn.type = 'button'
  btn.setAttribute('aria-label', t('guiToggle'))
  btn.innerHTML = icons.tune
  document.body.appendChild(btn)

  // ----- 面板容器（先建空殼，第一次點擊才載入 Tweakpane）-----
  const container = document.createElement('div')
  container.className = 'gui-panel'
  container.hidden = true
  document.body.appendChild(container)

  // 第一次點開才建面板（pane 存起來，切換語言時要 dispose 重建）
  let pane = null
  async function ensureBuilt() {
    if (!pane) pane = await buildPane(container, targets)
  }

  btn.addEventListener('click', async () => {
    await ensureBuilt()
    container.hidden = !container.hidden
    btn.classList.toggle('is-active', !container.hidden)
  })

  // 切換語言：Tweakpane 的 label 是建立時就固定的，所以整個 dispose 重建。
  // 面板開著就馬上重建（維持開啟）；關著就清掉，等下次點開時用新語言重建。
  onLangChange(async () => {
    btn.setAttribute('aria-label', t('guiToggle'))
    if (!pane) return
    const wasOpen = !container.hidden
    pane.dispose()
    pane = null
    container.innerHTML = ''
    if (wasOpen) {
      await ensureBuilt()
      container.hidden = false
    }
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
  const pane = new Pane({ container, title: t('gui_title') })

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
  const presetOptions = { [t('gui_presetCustom')]: '' }
  PRESET_LIST.forEach(({ id }) => { presetOptions[t('preset_' + id)] = id })
  let applyingPreset = false // 防 refresh 再次觸發本身的 change 造成迴圈
  pane.addBinding(presetState, 'preset', { label: t('gui_preset'), options: presetOptions })
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
  const fBg = pane.addFolder({ title: t('gui_fBg') })
  fBg.addBinding(params, 'bgColor', { label: t('gui_bgColor'), view: 'color' })
    .on('change', (e) => noiseBg.uniforms.uColor.value.set(e.value))
  fBg.addBinding(params, 'bgIntensity', { label: t('gui_bgIntensity'), min: 0, max: 0.5, step: 0.01 })
    .on('change', (e) => (noiseBg.uniforms.uIntensity.value = e.value))
  fBg.addBinding(params, 'bgScale', { label: t('gui_bgScale'), min: 0.5, max: 6, step: 0.1 })
    .on('change', (e) => (noiseBg.uniforms.uScale.value = e.value))
  fBg.addBinding(params, 'bgSpeed', { label: t('gui_bgSpeed'), min: 0, max: 3, step: 0.05 })
    .on('change', (e) => (noiseBg.uniforms.uSpeed.value = e.value))

  // ---------- 玻璃材質 ----------
  // MeshTransmissionMaterial 的屬性直接 set 就會生效（內部是 uniforms）
  const fGlass = pane.addFolder({ title: t('gui_fGlass'), expanded: false })
  fGlass.addBinding(params, 'glassColor', { label: t('gui_glassColor'), view: 'color' })
    .on('change', (e) => blob.material.color.set(e.value))
  fGlass.addBinding(params, 'roughness', { label: t('gui_roughness'), min: 0, max: 1, step: 0.01 })
    .on('change', (e) => (blob.material.roughness = e.value))
  fGlass.addBinding(params, 'chromaticAberration', { label: t('gui_chromaticAberration'), min: 0, max: 2, step: 0.05 })
    .on('change', (e) => (blob.material.chromaticAberration = e.value))
  fGlass.addBinding(params, 'anisotropicBlur', { label: t('gui_anisotropicBlur'), min: 0, max: 2, step: 0.01 }) // 太大會把後面糊掉
    .on('change', (e) => (blob.material.anisotropicBlur = e.value))
  fGlass.addBinding(params, 'distortion', { label: t('gui_distortion'), min: 0, max: 2, step: 0.05 })
    .on('change', (e) => (blob.material.distortion = e.value))
  fGlass.addBinding(params, 'distortionScale', { label: t('gui_distortionScale'), min: 0, max: 2, step: 0.05 })
    .on('change', (e) => (blob.material.distortionScale = e.value))
  fGlass.addBinding(params, 'temporalDistortion', { label: t('gui_temporalDistortion'), min: 0, max: 1, step: 0.01 })
    .on('change', (e) => (blob.material.temporalDistortion = e.value))
  fGlass.addBinding(params, 'thickness', { label: t('gui_thickness'), min: 0, max: 3, step: 0.05 })
    .on('change', (e) => (blob.material.thickness = e.value))
  fGlass.addBinding(params, 'ior', { label: t('gui_ior'), min: 1, max: 2, step: 0.01 })
    .on('change', (e) => (blob.material.ior = e.value))
  fGlass.addBinding(params, 'attenuationColor', { label: t('gui_attenuationColor'), view: 'color' })
    .on('change', (e) => blob.material.attenuationColor.set(e.value))
  fGlass.addBinding(params, 'attenuationDistance', { label: t('gui_attenuationDistance'), min: 0.2, max: 5, step: 0.1 })
    .on('change', (e) => (blob.material.attenuationDistance = e.value))
  fGlass.addBinding(params, 'envMapIntensity', { label: t('gui_envMapIntensity'), min: 0, max: 2, step: 0.05 })
    .on('change', (e) => (blob.material.envMapIntensity = e.value))

  // ---------- 流體形狀 ----------
  const fShape = pane.addFolder({ title: t('gui_fShape'), expanded: false })
  fShape.addBinding(params, 'noiseFreq', { label: t('gui_noiseFreq'), min: 0.2, max: 3, step: 0.05 })
    .on('change', (e) => (blob.uniforms.uFreq.value = e.value))
  fShape.addBinding(params, 'noiseAmp', { label: t('gui_noiseAmp'), min: 0, max: 1, step: 0.01 })
    .on('change', (e) => (blob.uniforms.uAmp.value = e.value))
  fShape.addBinding(params, 'flowSpeed', { label: t('gui_flowSpeed'), min: 0, max: 0.5, step: 0.01 })
    .on('change', (e) => (blob.params.flowSpeed = e.value))
  fShape.addBinding(params, 'mouseRipple', { label: t('gui_mouseRipple'), min: 0, max: 1, step: 0.05 })
    .on('change', (e) => (blob.uniforms.uRipple.value = e.value))

  // ---------- 游標與運動 ----------
  // 球體自轉、滑鼠跟隨傾轉、以及「游標撥開」凹槽互動。
  // 開關/數值寫回 blob.params（update 每幀讀），凹槽深度直接寫 uPokeDepth uniform。
  const fMotion = pane.addFolder({ title: t('gui_fMotion'), expanded: false })
  fMotion.addBinding(params, 'autoRotate', { label: t('gui_autoRotate') })
    .on('change', (e) => (blob.params.autoRotate = e.value))
  fMotion.addBinding(params, 'rotateSpeed', { label: t('gui_rotateSpeed'), min: 0, max: 0.3, step: 0.005 }) // 弧度/秒
    .on('change', (e) => (blob.params.rotateSpeed = e.value))
  fMotion.addBinding(params, 'mouseLerp', { label: t('gui_mouseLerp'), min: 0.01, max: 0.3, step: 0.01 }) // 越小越慵懶
    .on('change', (e) => (blob.params.mouseLerp = e.value))
  fMotion.addBinding(params, 'mouseTilt', { label: t('gui_mouseTilt'), min: 0, max: 1, step: 0.01 }) // 傾轉幅度（弧度）
    .on('change', (e) => (blob.params.mouseTilt = e.value))
  fMotion.addBinding(params, 'poke', { label: t('gui_poke') }) // 沿移動方向壓出淺凹槽
    .on('change', (e) => (blob.params.poke = e.value))
  fMotion.addBinding(params, 'pokeDemo', { label: t('gui_pokeDemo') }) // 球自己循環撥開，方便邊調邊看
    .on('change', (e) => (blob.params.pokeDemo = e.value))
  fMotion.addBinding(params, 'pokeDepth', { label: t('gui_pokeDepth'), min: 0, max: 1, step: 0.01 }) // 沿法線往內；過深折射會亂
    .on('change', (e) => (blob.uniforms.uPokeDepth.value = e.value))
  fMotion.addBinding(params, 'pokeWidth', { label: t('gui_pokeWidth'), min: 0.3, max: 3, step: 0.05 }) // 越大溝越寬
    .on('change', (e) => (blob.uniforms.uPokeWidth.value = e.value))
  fMotion.addBinding(params, 'pokeReboundTime', { label: t('gui_pokeReboundTime'), min: 0.2, max: 30, step: 0.1 }) // 越大越「黏」
    .on('change', (e) => (blob.params.pokeReboundTime = e.value))
  fMotion.addBinding(params, 'pokeSensitivity', { label: t('gui_pokeSensitivity'), min: 0, max: 1.5, step: 0.05 }) // 越大越輕劃就有感
    .on('change', (e) => (blob.params.pokeSensitivity = e.value))
  fMotion.addBinding(params, 'pokeTurnSmooth', { label: t('gui_pokeTurnSmooth'), min: 0, max: 0.97, step: 0.01 }) // 越接近 1 越柔順
    .on('change', (e) => (blob.params.pokeTurnSmooth = e.value))

  // ---------- 卡片與運動 ----------
  const fCards = pane.addFolder({ title: t('gui_fCards'), expanded: false })
  // 顯示／隱藏整圈作品圖片：關掉時整個卡片群不畫出來，也點不到、滑不到（見 controls.js）
  fCards.addBinding(params, 'showCards', { label: t('gui_showCards') })
    .on('change', (e) => (cards.group.visible = e.value))
  fCards.addBinding(params, 'cardRadius', { label: t('gui_cardRadius'), min: 2, max: 5, step: 0.1 })
    .on('change', (e) => cards.setRadius(e.value))
  fCards.addBinding(params, 'cardSize', { label: t('gui_cardSize'), min: 0.5, max: 2, step: 0.05 })
    .on('change', (e) => cards.setSizeFactor(e.value))
  fCards.addBinding(params, 'autoSpeed', { label: t('gui_autoSpeed'), min: 0, max: 0.3, step: 0.01 })
    .on('change', (e) => (CONTROLS_CONFIG.autoSpeed = e.value))
  fCards.addBinding(params, 'carouselEvery', { label: t('gui_carouselEvery'), min: 2, max: 10, step: 0.5 })
    .on('change', (e) => (CARDS_CONFIG.carouselEvery = e.value))

  // ---------- 燈光 ----------
  const fLight = pane.addFolder({ title: t('gui_fLight'), expanded: false })
  fLight.addBinding(params, 'lightColor', { label: t('gui_lightColor'), view: 'color' })
    .on('change', (e) => pinkLight.color.set(e.value))
  fLight.addBinding(params, 'lightIntensity', { label: t('gui_lightIntensity'), min: 0, max: 100, step: 1 })
    .on('change', (e) => (pinkLight.intensity = e.value))

  // ---------- 工具 ----------
  // 複製目前設定：調出喜歡的樣子後按這個，把 JSON 貼給 Claude 就能改成預設值
  pane.addButton({ title: t('gui_copy') }).on('click', () => {
    navigator.clipboard.writeText(JSON.stringify(params, null, 2))
  })

  pane.addButton({ title: t('gui_reset') }).on('click', () => {
    Object.assign(params, defaults)
    pane.refresh() // refresh 會觸發每個 binding 的 change，把值套回場景
  })

  // 面板自己會攔截滑鼠事件，不會誤觸後面的 3D 場景（CSS pointer-events）
  return pane
}

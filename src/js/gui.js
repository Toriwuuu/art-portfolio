// ===== GUI 參數面板 =====
// 右下角一顆玻璃擬態小按鈕（預設只有它），點擊展開 Tweakpane 面板，
// 可以即時調整 3D 場景的參數。面板樣式走 Apple 毛玻璃質感（見 _gui.scss）。
// Tweakpane 用動態載入：沒人打開面板就不會下載它。

import { icons } from './icons.js'
import { BG_CONFIG } from './bg.js'
import { BLOB_CONFIG } from './blob.js'
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
}

async function buildPane(container, { noiseBg, blob, cards, pinkLight, motion }) {
  const { Pane } = await import('tweakpane')
  const pane = new Pane({ container, title: '3D 參數' })

  // 面板上顯示的值（改了就同步到場景）
  const params = {
    // 背景雜訊
    bgColor: BG_CONFIG.color,
    bgIntensity: BG_CONFIG.intensity,
    bgScale: BG_CONFIG.scale,
    bgSpeed: BG_CONFIG.speed,
    // 玻璃材質
    roughness: BLOB_CONFIG.roughness,
    chromaticAberration: BLOB_CONFIG.chromaticAberration,
    distortion: BLOB_CONFIG.distortion,
    temporalDistortion: BLOB_CONFIG.temporalDistortion,
    thickness: BLOB_CONFIG.thickness,
    ior: BLOB_CONFIG.ior,
    attenuationColor: BLOB_CONFIG.attenuationColor,
    attenuationDistance: BLOB_CONFIG.attenuationDistance,
    envMapIntensity: BLOB_CONFIG.envMapIntensity,
    // 流體形狀
    noiseFreq: BLOB_CONFIG.noiseFreq,
    noiseAmp: BLOB_CONFIG.noiseAmp,
    flowSpeed: motion.flowSpeed,
    mouseRipple: BLOB_CONFIG.mouseRipple,
    // 卡片與運動
    cardRadius: CARDS_CONFIG.radius,
    cardSize: 1,
    autoSpeed: CONTROLS_CONFIG.autoSpeed,
    carouselEvery: CARDS_CONFIG.carouselEvery,
    // 燈光
    lightColor: '#E931CC',
    lightIntensity: pinkLight.intensity,
  }
  const defaults = { ...params } // 重設用

  // ---------- 背景雜訊 ----------
  const fBg = pane.addFolder({ title: '背景雜訊' })
  fBg.addBinding(params, 'bgColor', { label: '底色', view: 'color' })
    .on('change', (e) => noiseBg.uniforms.uColor.value.set(e.value))
  fBg.addBinding(params, 'bgIntensity', { label: '顆粒強度', min: 0, max: 0.3, step: 0.005 })
    .on('change', (e) => (noiseBg.uniforms.uIntensity.value = e.value))
  fBg.addBinding(params, 'bgScale', { label: '顆粒大小', min: 1, max: 8, step: 0.5 })
    .on('change', (e) => (noiseBg.uniforms.uScale.value = e.value))
  fBg.addBinding(params, 'bgSpeed', { label: '飄動速度', min: 0, max: 4, step: 0.1 })
    .on('change', (e) => (noiseBg.uniforms.uSpeed.value = e.value))

  // ---------- 玻璃材質 ----------
  // MeshTransmissionMaterial 的屬性直接 set 就會生效（內部是 uniforms）
  const fGlass = pane.addFolder({ title: '玻璃材質', expanded: false })
  fGlass.addBinding(params, 'roughness', { label: '粗糙度', min: 0, max: 1, step: 0.01 })
    .on('change', (e) => (blob.material.roughness = e.value))
  fGlass.addBinding(params, 'chromaticAberration', { label: '色散', min: 0, max: 2, step: 0.05 })
    .on('change', (e) => (blob.material.chromaticAberration = e.value))
  fGlass.addBinding(params, 'distortion', { label: '折射扭曲', min: 0, max: 2, step: 0.05 })
    .on('change', (e) => (blob.material.distortion = e.value))
  fGlass.addBinding(params, 'temporalDistortion', { label: '扭曲流速', min: 0, max: 1, step: 0.01 })
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
    .on('change', (e) => (motion.flowSpeed = e.value))
  fShape.addBinding(params, 'mouseRipple', { label: '滑鼠漣漪', min: 0, max: 1, step: 0.05 })
    .on('change', (e) => (blob.uniforms.uRipple.value = e.value))

  // ---------- 卡片與運動 ----------
  const fCards = pane.addFolder({ title: '卡片與運動', expanded: false })
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

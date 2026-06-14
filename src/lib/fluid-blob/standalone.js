// ===== mountFluidBlob：Standalone 模式 =====
// 給「沒有 three.js 場景」的專案用：丟一個容器元素進來，
// 渲染器、場景、相機、環境貼圖、燈光、渲染迴圈、視窗縮放、
// 省電暫停……全部自動搞定。適合當其他網站的 hero 視覺。
//
//   const app = mountFluidBlob(document.querySelector('#hero'), {
//     attenuationColor: '#3a86ff', // 換個透色就是另一顆球
//   })
//   app.destroy() // 不要了就收乾淨
//
// 小提醒：玻璃折射的是「它後面的世界」。空場景只會折射底色，
// 看起來比較平——想要更有層次，可以把球疊在有內容的版面上，
// 或用 background 選一個有對比的底色。

import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createFluidBlob } from './fluid-blob.js'

// 環境貼圖一行版：玻璃需要它才有反射、才不會死白一片。
// Embed 模式的宿主也可以直接拿去用：scene.environment = createRoomEnv(renderer)
export function createRoomEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const texture = pmrem.fromScene(new RoomEnvironment()).texture
  pmrem.dispose()
  return texture
}

// Standalone 專屬的場景級預設值（球本身的參數見 defaults.js）
const STANDALONE_DEFAULTS = {
  background: '#0a0a0d', // 底色；給 'transparent' 就是透明背景（可疊在網頁內容上）
  light: { color: '#E931CC', intensity: 30, distance: 12, position: [-3, 2, 4] }, // false = 不要燈
  cameraFov: 45,
  cameraZ: 7.5,
  maxPixelRatio: 1.75, // 跟 art-portfolio 本站一致；改了顏色觀感會不同
}

export function mountFluidBlob(container, options = {}) {
  const opts = { ...STANDALONE_DEFAULTS, ...options }
  const transparent = opts.background === 'transparent'

  // ----- 畫布：塞滿容器 -----
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%;'
  container.appendChild(canvas)

  // ----- 渲染器（tone mapping 與解析度上限跟本站一致，顏色才會一樣）-----
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.maxPixelRatio))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  if (transparent) renderer.setClearColor(0x000000, 0)

  // ----- 場景與環境 -----
  const scene = new THREE.Scene()
  if (!transparent) scene.background = new THREE.Color(opts.background)
  scene.environment = createRoomEnv(renderer)

  if (opts.light) {
    const light = new THREE.PointLight(opts.light.color, opts.light.intensity, opts.light.distance)
    light.position.set(...opts.light.position)
    scene.add(light)
  }

  const camera = new THREE.PerspectiveCamera(opts.cameraFov, 1, 0.1, 50)
  camera.position.z = opts.cameraZ

  // ----- 流體球本體（Embed 控制器，選項原封不動傳下去）-----
  const blob = createFluidBlob(options)
  scene.add(blob.mesh)

  // ----- 跟著容器大小變（ResizeObserver 比 window resize 聰明：容器變就反應）-----
  function resize() {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h, false) // false：尺寸交給 CSS 管，不覆寫 style
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(container)

  // ----- 渲染迴圈（dt 的上限保護在 blob.update 裡面）-----
  const clock = new THREE.Clock()
  let rafId = null
  let paused = false

  function tick() {
    const dt = clock.getDelta()
    blob.update(dt)
    blob.renderTransmissionPass(renderer, scene, camera)
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  tick()

  function pause() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
      paused = true
    }
  }

  function resume() {
    if (paused) {
      paused = false
      clock.getDelta() // 把暫停期間累積的時間吃掉，避免恢復瞬間跳一大步
      tick()
    }
  }

  // 分頁切到背景時暫停渲染，省電
  function onVisibility() {
    document.hidden ? pause() : resume()
  }
  document.addEventListener('visibilitychange', onVisibility)

  // 全部收乾淨：停迴圈、拆監聽、釋放顯示卡資源、移除畫布
  function destroy() {
    pause()
    paused = false
    observer.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    blob.dispose()
    scene.environment?.dispose()
    renderer.dispose()
    canvas.remove()
  }

  return { blob, renderer, scene, camera, pause, resume, destroy }
}

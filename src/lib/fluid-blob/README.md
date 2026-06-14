# fluid-blob 玻璃流體球

會緩慢流動變形的透明玻璃球：表面用 simplex noise 推擠出液體感，
材質是會折射、帶色散彩虹邊的透射玻璃，滑鼠靠近哪邊、哪邊的起伏就加強。
從 Tori Art Portfolio 抽出來的可重用模組。

## 怎麼帶去別的專案

1. 把整個 `fluid-blob/` 資料夾複製到新專案（例如放 `src/lib/fluid-blob/`）
2. 新專案安裝兩個依賴：

```bash
npm install three @pmndrs/vanilla
```

> **版本釘選**：本模組在 `three@0.182` + `@pmndrs/vanilla@1.25` 上驗證過。
> 它用 `onBeforeCompile` 對 three 內建材質「動手術」（字串替換 shader 片段），
> 這兩個套件升版可能弄壞手術點——**升版後務必回來檢查球還在不在、形狀對不對**。

## 用法一：Standalone（最簡單，推薦新專案用這個）

給一個容器元素，其他全自動（渲染器、場景、相機、環境貼圖、燈光、
渲染迴圈、容器縮放跟隨、切分頁省電暫停）：

```js
import { mountFluidBlob } from './lib/fluid-blob/index.js'

const app = mountFluidBlob(document.querySelector('#hero'), {
  attenuationColor: '#3a86ff', // 想改什麼就覆寫什麼，見下方選項表
})

// 回傳的 app：
app.pause()    // 暫停渲染
app.resume()   // 恢復
app.destroy()  // 全部收乾淨（停迴圈、拆監聽、釋放顯示卡資源、移除畫布）
app.blob       // 球的把手（mesh / material / uniforms / params，可即時調整）
```

容器要自己有大小（例如 `position: fixed; inset: 0` 的全螢幕 div）。

**畫面層次小提醒**：玻璃折射的是「它後面的世界」。Standalone 的空場景
只會折射底色，看起來比較平——想更有層次可以用 `background: 'transparent'`
把球疊在網頁內容上，或選一個有對比的底色。

## 用法二：Embed（已經有自己的 three.js 場景）

模組給你 mesh 和兩個每幀要呼叫的函式，渲染迴圈還是你的：

```js
import { createFluidBlob, createRoomEnv } from './lib/fluid-blob/index.js'

// 玻璃需要環境貼圖才有反射（沒有會死白一片），一行搞定：
scene.environment = createRoomEnv(renderer)

const blob = createFluidBlob({ /* 覆寫任何選項 */ })
scene.add(blob.mesh)

// 渲染迴圈裡，每幀照這個順序：
blob.update(dt)                                       // 1. 時間/滑鼠/自轉
blob.renderTransmissionPass(renderer, scene, camera)  // 2. 折射的兩段式渲染
renderer.render(scene, camera)                        // 3. 你自己的最終渲染

blob.dispose() // 不要了就收乾淨
```

`dt` 是這一幀經過的秒數（模組內部會夾上限，切分頁回來不會跳一大步）。

## 即時調整（接 GUI 面板）

回傳的把手上有三個「活的」物件，改了馬上生效，很適合接 Tweakpane / dat.gui：

```js
blob.material.roughness = 0.3        // 玻璃材質屬性
blob.uniforms.uAmp.value = 0.6       // 形狀旋鈕（uFreq / uAmp / uRipple）
blob.params.flowSpeed = 0.2          // 運動參數（每幀讀取，直接寫就生效）
```

## 選項表（全部可不填，預設值見 defaults.js）

### 形狀與運動

| 選項 | 預設 | 說明 |
|---|---|---|
| `radius` | 1.6 | 球的基本半徑 |
| `detail` / `detailMobile` | 64 / 24 | 球面細分程度（越高越平滑、越吃效能） |
| `noiseFreq` | 0.9 | 噪聲頻率：越大表面皺褶越細碎 |
| `noiseAmp` | 0.45 | 噪聲振幅：越大起伏越誇張 |
| `flowSpeed` | 0.12 | 流動速度（偏好減少動態時自動減半） |
| `mouseRipple` | 0.35 | 滑鼠側的額外起伏強度 |
| `mouseTilt` | 0.25 | 滑鼠造成的傾轉幅度（弧度） |
| `interactive` | true | false = 不掛滑鼠監聽，球不理滑鼠 |
| `autoRotate` / `rotateSpeed` | true / 0.05 | 緩慢自轉與速度 |
| `mouseLerp` | 0.04 | 滑鼠跟隨的慢半拍程度（越小越慵懶） |

### 玻璃材質

| 選項 | 預設 | 說明 |
|---|---|---|
| `useTransmission` | true | false 改用 three 內建透射（較省效能的備案） |
| `samples` / `samplesMobile` | 8 / 4 | 取樣數：越高玻璃越細緻 |
| `roughness` | 0.08 | 表面粗糙：0 全清晰、越大越霧 |
| `thickness` | 1.0 | 視覺厚度：影響折射強度 |
| `ior` | 1.35 | 折射率（水 1.33、玻璃 1.5） |
| `chromaticAberration` | 0.5 | 色散：邊緣的彩虹分離感 |
| `anisotropicBlur` | 0.12 | 折射模糊 |
| `distortion` / `distortionScale` | 0.5 / 0.6 | 折射的噪聲扭曲（「流動玻璃」的關鍵） |
| `temporalDistortion` | 0.12 | 扭曲隨時間流動的速度 |
| `glassColor` | `#f6e6f3` | 玻璃本體色 |
| `attenuationColor` | `#E931CC` | 厚度透出的顏色 |
| `attenuationDistance` | 1.6 | 多厚開始明顯透色（越小越濃） |
| `envMapIntensity` | 0.55 | 環境反射強度（太高會像鍍鉻金屬） |
| `fboSize` / `fboSizeMobile` | 1024 / 512 | 折射用離屏畫布解析度 |

### Standalone 專屬（mountFluidBlob 才有）

| 選項 | 預設 | 說明 |
|---|---|---|
| `background` | `#0a0a0d` | 底色；`'transparent'` = 透明背景，可疊在網頁內容上 |
| `light` | 桃紅點光 | `{ color, intensity, distance, position }`，`false` = 不要燈 |
| `cameraFov` / `cameraZ` | 45 / 7.5 | 相機視角與距離 |
| `maxPixelRatio` | 1.75 | 解析度倍率上限（省效能；改了顏色觀感會不同） |

## 檔案地圖

| 檔案 | 負責什麼 |
|---|---|
| `index.js` | 公開入口（從這裡 import 就好） |
| `defaults.js` | 所有預設值 |
| `shaders.js` | GLSL 噪聲與材質注入（流體感的核心） |
| `blob-mesh.js` | 純粹的幾何 + 材質 + uniforms |
| `fluid-blob.js` | Embed 控制器（FBO、滑鼠、時間、自轉） |
| `standalone.js` | Standalone 包裝 + `createRoomEnv()` |

## 本機示範

art-portfolio 專案裡跑 `npm run dev` 後開 `/demo.html`，
就是 Standalone 模式的最小可用範例（只在開發模式存在，不會跟著部署）。

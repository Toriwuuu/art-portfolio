// ===== fluid-blob 公開入口 =====
// 整個資料夾可以原封不動複製到其他 Vite 專案使用（需要 three 與 @pmndrs/vanilla）。
//
// 兩種用法：
// - createFluidBlob(options)：Embed 模式——你已經有自己的 three.js 場景，
//   模組給你 mesh 和兩個每幀要呼叫的函式。
// - mountFluidBlob(container, options)：Standalone 模式——給一個容器元素，
//   渲染器/場景/相機/環境貼圖/燈光/渲染迴圈全部自動搞定。
//
// 詳細說明見同資料夾的 README.md。

export { createFluidBlob } from './fluid-blob.js'
export { mountFluidBlob, createRoomEnv } from './standalone.js'
export { FLUID_BLOB_DEFAULTS } from './defaults.js'

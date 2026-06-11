import { defineConfig } from 'vite'

// base: './' 讓建置後的路徑使用相對路徑，
// 部署到 GitHub Pages 子目錄也不會壞圖
export default defineConfig({
  base: './',
})

// ===== fluid-blob 預設值 =====
// 玻璃流體球所有可調參數的預設值，集中在這一份。
// 使用時想改哪個就在 options 覆寫哪個：createFluidBlob({ noiseAmp: 0.6 })
// （這裡是「出廠設定」，實際運作時讀的是合併後的 params 物件）

export const FLUID_BLOB_DEFAULTS = {
  // ----- 形狀 -----
  radius: 1.6,         // 球的基本半徑
  detail: 64,          // 球面細分程度（越高越平滑、越吃效能）
  detailMobile: 24,

  noiseFreq: 0.9,      // 噪聲頻率：越大表面皺褶越細碎
  noiseAmp: 0.45,      // 噪聲振幅：越大起伏越誇張
  flowSpeed: 0.12,     // 流動速度
  mouseRipple: 0.35,   // 滑鼠側的額外起伏強度
  mouseTilt: 0.25,     // 滑鼠造成的傾轉幅度（弧度）

  // ----- 玻璃材質 -----
  // useTransmission: false 時改用 three 內建的 MeshPhysicalMaterial 透射
  // （效果較簡單但更省效能，是手機跑不動時的備案）
  useTransmission: true,
  samples: 8,            // 取樣數：越高玻璃越細緻（手機減半）
  samplesMobile: 4,
  roughness: 0.08,       // 表面粗糙：0 全清晰、越大越霧
  thickness: 1.0,        // 視覺厚度：影響折射強度
  ior: 1.35,             // 折射率（水 1.33、玻璃 1.5）
  chromaticAberration: 0.5, // 色散：邊緣的彩虹分離感
  anisotropicBlur: 0.12, // 折射模糊（太大會把後面的東西糊掉）
  distortion: 0.5,       // 折射的噪聲扭曲（「流動玻璃」的關鍵）
  distortionScale: 0.6,
  temporalDistortion: 0.12, // 扭曲隨時間流動的速度
  glassColor: '#f6e6f3',    // 玻璃本體色（近白帶一點粉）
  attenuationColor: '#E931CC', // 厚度透出的顏色（品牌桃紅）
  attenuationDistance: 1.6,    // 多厚開始明顯透色（越小越粉、越暗）
  envMapIntensity: 0.55,       // 環境反射強度（太高會像鍍鉻金屬）

  // ----- 運動與互動 -----
  interactive: true,   // false = 不掛滑鼠監聽，球不理滑鼠
  autoRotate: true,    // 緩慢自轉
  rotateSpeed: 0.05,   // 自轉速度（弧度/秒）
  mouseLerp: 0.04,     // 滑鼠跟隨的慢半拍程度（越小越慵懶）
  poke: true,            // 游標撥開開關：游標掃過時沿移動方向壓出一道淺凹槽，停手後回彈（需 interactive）
  pokeDepth: 0.45,       // 凹槽深度（沿法線往內；越大越深，過深折射會亂）
  pokeWidth: 1.0,        // 凹槽廣度（1=預設；越大溝越寬、影響範圍越大）
  pokeReboundTime: 4,    // 凹槽回彈時間（秒）：停手後約這麼久淡回平整；越大越「黏」、撐越久（直覺、線性）
  pokeSensitivity: 0.3,  // 撥開靈敏度（游標速度 × 此值 = 凹槽強度；越大越輕輕劃就有反應）
  pokeTurnSmooth: 0.85,  // 凹槽轉向柔順：方向每幀保留多少比例再緩動到新方向（0=瞬間硬切、越接近 1 越慢越柔順；改變運動方向時不再「啪」一下跳）
  pokeDemo: false,       // 自動示範：球自己循環撥開（方便在 GUI 邊調深度/回彈/靈敏度邊看效果）

  // ----- 玻璃折射用的離屏畫布 -----
  // 固定解析度、跟視窗大小無關，效能可控
  fboSize: 1024,
  fboSizeMobile: 512,
}

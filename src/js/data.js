// ===== 作品資料 =====
// 要新增/移除作品，直接改這個檔案就好，畫面會自動跟著更新。
// 圖片放在 public/img/ 底下。

// 插畫（首頁 ILLUSTRATION 區，依這裡的順序展示）
export const illustrations = [
  { file: 'dont-wake-up.jpg', title: "Don't Wake Up" },
  { file: 'two.jpg', title: 'Two' },
  { file: 'always-cow.jpg', title: 'Always Cow' },
  { file: 'calling.jpg', title: 'Calling' },
  { file: 'chaos.jpg', title: 'Chaos' },
  { file: 'escape.jpg', title: 'Escape' },
  { file: 'face.jpg', title: 'Face' },
  { file: 'missing-call.jpg', title: 'Missing Call' },
  { file: 'moai.jpg', title: 'Moai' },
  { file: 'rainy-night.jpg', title: 'Rainy Night' },
  { file: 'staircase.jpg', title: 'Staircase' },
  { file: 'star-tears.jpg', title: 'Star Tears' },
]

// 立體作品（依年份，新的在前）
export const plasticYears = [
  {
    year: 2023,
    files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg', '08.jpg', '09.jpg'],
  },
  {
    year: 2022,
    files: [
      '01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg',
      '10.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg',
      'a01.jpg', 'a02.jpg', 'a03.jpg', 'a04.jpg', 'a05.jpg', 'a06.jpg',
      'b01.jpg', 'b02.jpg', 'b03.jpg', 'b04.jpg',
      'c01.jpg', 'c02.jpg', 'c03.jpg',
      'd01.jpg', 'd02.jpg', 'd03.jpg', 'd04.jpg', 'd05.jpg', 'd06.jpg',
      'd07.jpg', 'd08.jpg', 'd09.jpg', 'd10.jpg', 'd11.jpg',
    ],
  },
  { year: 2021, files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'] },
  { year: 2020, files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'] },
  { year: 2019, files: ['01.jpg', '02.jpg', '03.jpg'] },
  { year: 2018, files: ['01.jpg', '02.jpg', '03.jpg'] },
  { year: 2017, files: ['01.jpg', '02.jpg'] },
]

// 組出圖片路徑。
// import.meta.env.BASE_URL 是 Vite 提供的部署根路徑，
// 之後若部署到 GitHub Pages 的子目錄也不會壞圖。
export const illusSrc = (file) => `${import.meta.env.BASE_URL}img/illus/${file}`
export const plasticSrc = (year, file) => `${import.meta.env.BASE_URL}img/plastic/${year}/${file}`

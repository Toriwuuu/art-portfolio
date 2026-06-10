// ===== 作品資料（v3：一張卡 = 一件作品）=====
// 想調整分組或標題，直接改這個檔案。
// files 有多張圖的作品：卡片會輪播、燈箱內可捲動看全部。
//
// 縮圖（卡片用）放在 public/img/thumbs/，由這個指令一次產生（在 public/img 執行）：
//   for d in illus plastic/2017 ... plastic/2023; do
//     mkdir -p "thumbs/$d"
//     for f in "$d"/*.jpg; do sips -Z 640 -s format jpeg -s formatOptions 78 "$f" --out "thumbs/$f"; done
//   done

export const works = [
  // ---------- 插畫 12 件（各 1 張圖）----------
  // w / h 是原圖尺寸，燈箱用來預留位置避免版面跳動
  { id: 'illus-dont-wake-up', type: 'illustration', title: "Don't Wake Up", dir: 'illus', files: ['dont-wake-up.jpg'], w: 2360, h: 1640 },
  { id: 'illus-two', type: 'illustration', title: 'Two', dir: 'illus', files: ['two.jpg'], w: 1640, h: 1612 },
  { id: 'illus-always-cow', type: 'illustration', title: 'Always Cow', dir: 'illus', files: ['always-cow.jpg'], w: 1640, h: 2360 },
  { id: 'illus-calling', type: 'illustration', title: 'Calling', dir: 'illus', files: ['calling.jpg'], w: 2360, h: 1640 },
  { id: 'illus-chaos', type: 'illustration', title: 'Chaos', dir: 'illus', files: ['chaos.jpg'], w: 1640, h: 2360 },
  { id: 'illus-escape', type: 'illustration', title: 'Escape', dir: 'illus', files: ['escape.jpg'], w: 2360, h: 1640 },
  { id: 'illus-face', type: 'illustration', title: 'Face', dir: 'illus', files: ['face.jpg'], w: 1640, h: 2360 },
  { id: 'illus-missing-call', type: 'illustration', title: 'Missing Call', dir: 'illus', files: ['missing-call.jpg'], w: 2360, h: 1640 },
  { id: 'illus-moai', type: 'illustration', title: 'Moai', dir: 'illus', files: ['moai.jpg'], w: 1640, h: 2360 },
  { id: 'illus-rainy-night', type: 'illustration', title: 'Rainy Night', dir: 'illus', files: ['rainy-night.jpg'], w: 2360, h: 1640 },
  { id: 'illus-staircase', type: 'illustration', title: 'Staircase', dir: 'illus', files: ['staircase.jpg'], w: 2360, h: 1640 },
  { id: 'illus-star-tears', type: 'illustration', title: 'Star Tears', dir: 'illus', files: ['star-tears.jpg'], w: 1640, h: 2360 },

  // ---------- 立體作品 24 件 ----------
  // 2023：整檔展覽是同一件作品（9 張）
  {
    id: 'plastic-2023', type: 'plastic', year: 2023, title: '2023', dir: 'plastic/2023',
    files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg', '08.jpg', '09.jpg'],
  },

  // 2022：純數字每張獨立一件（13 件）
  { id: 'plastic-2022-01', type: 'plastic', year: 2022, title: '2022 · 01', dir: 'plastic/2022', files: ['01.jpg'] },
  { id: 'plastic-2022-02', type: 'plastic', year: 2022, title: '2022 · 02', dir: 'plastic/2022', files: ['02.jpg'] },
  { id: 'plastic-2022-03', type: 'plastic', year: 2022, title: '2022 · 03', dir: 'plastic/2022', files: ['03.jpg'] },
  { id: 'plastic-2022-04', type: 'plastic', year: 2022, title: '2022 · 04', dir: 'plastic/2022', files: ['04.jpg'] },
  { id: 'plastic-2022-05', type: 'plastic', year: 2022, title: '2022 · 05', dir: 'plastic/2022', files: ['05.jpg'] },
  { id: 'plastic-2022-06', type: 'plastic', year: 2022, title: '2022 · 06', dir: 'plastic/2022', files: ['06.jpg'] },
  { id: 'plastic-2022-07', type: 'plastic', year: 2022, title: '2022 · 07', dir: 'plastic/2022', files: ['07.jpg'] },
  { id: 'plastic-2022-10', type: 'plastic', year: 2022, title: '2022 · 10', dir: 'plastic/2022', files: ['10.jpg'] },
  { id: 'plastic-2022-11', type: 'plastic', year: 2022, title: '2022 · 11', dir: 'plastic/2022', files: ['11.jpg'] },
  { id: 'plastic-2022-12', type: 'plastic', year: 2022, title: '2022 · 12', dir: 'plastic/2022', files: ['12.jpg'] },
  { id: 'plastic-2022-13', type: 'plastic', year: 2022, title: '2022 · 13', dir: 'plastic/2022', files: ['13.jpg'] },
  { id: 'plastic-2022-14', type: 'plastic', year: 2022, title: '2022 · 14', dir: 'plastic/2022', files: ['14.jpg'] },
  { id: 'plastic-2022-15', type: 'plastic', year: 2022, title: '2022 · 15', dir: 'plastic/2022', files: ['15.jpg'] },

  // 2022：字母系列各一件（4 件）
  {
    id: 'plastic-2022-a', type: 'plastic', year: 2022, title: '2022 · Series A', dir: 'plastic/2022',
    files: ['a01.jpg', 'a02.jpg', 'a03.jpg', 'a04.jpg', 'a05.jpg', 'a06.jpg'],
  },
  {
    id: 'plastic-2022-b', type: 'plastic', year: 2022, title: '2022 · Series B', dir: 'plastic/2022',
    files: ['b01.jpg', 'b02.jpg', 'b03.jpg', 'b04.jpg'],
  },
  {
    id: 'plastic-2022-c', type: 'plastic', year: 2022, title: '2022 · Series C', dir: 'plastic/2022',
    files: ['c01.jpg', 'c02.jpg', 'c03.jpg'],
  },
  {
    id: 'plastic-2022-d', type: 'plastic', year: 2022, title: '2022 · Series D', dir: 'plastic/2022',
    files: ['d01.jpg', 'd02.jpg', 'd03.jpg', 'd04.jpg', 'd05.jpg', 'd06.jpg', 'd07.jpg', 'd08.jpg', 'd09.jpg', 'd10.jpg', 'd11.jpg'],
  },

  // 2021：兩件，各 3 張
  { id: 'plastic-2021-1', type: 'plastic', year: 2021, title: '2021 · I', dir: 'plastic/2021', files: ['01.jpg', '02.jpg', '03.jpg'] },
  { id: 'plastic-2021-2', type: 'plastic', year: 2021, title: '2021 · II', dir: 'plastic/2021', files: ['04.jpg', '05.jpg', '06.jpg'] },

  // 2020～2017：每年各一件
  { id: 'plastic-2020', type: 'plastic', year: 2020, title: '2020', dir: 'plastic/2020', files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'] },
  { id: 'plastic-2019', type: 'plastic', year: 2019, title: '2019', dir: 'plastic/2019', files: ['01.jpg', '02.jpg', '03.jpg'] },
  { id: 'plastic-2018', type: 'plastic', year: 2018, title: '2018', dir: 'plastic/2018', files: ['01.jpg', '02.jpg', '03.jpg'] },
  { id: 'plastic-2017', type: 'plastic', year: 2017, title: '2017', dir: 'plastic/2017', files: ['01.jpg', '02.jpg'] },
]

// 組出圖片路徑（BASE_URL 讓部署到子目錄也不會壞圖）
const BASE = import.meta.env.BASE_URL
export const thumbSrc = (work, file) => `${BASE}img/thumbs/${work.dir}/${file}` // 卡片用縮圖
export const fullSrc = (work, file) => `${BASE}img/${work.dir}/${file}`         // 燈箱用原圖

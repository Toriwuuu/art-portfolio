// ===== 作品資料（v3：一張卡 = 一件作品）=====
// 想調整分組或標題，直接改這個檔案。
// files 有多張圖的作品：卡片會輪播、燈箱左側用縮圖或左右鍵切換主圖。
// 想加作品說明：在該物件加 desc: '...'（顯示在燈箱右側，可用 \n 換行）。
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

  // ---------- 立體作品 12 件 ----------
  // 2023：整檔展覽是同一件作品（9 張）
  {
    id: 'plastic-2023', type: 'plastic', year: 2023, title: '2023', dir: 'plastic/2023',
    files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg', '08.jpg', '09.jpg'],
    name: 'I Sea the Sunset',
    desc: 'See（看）改成 Sea（海）的雙關——看夕陽，也把夕陽變成海。數片工業薄膜自地面展開至天花板，刷上橘紅油漆、留下大量筆痕，成為一張張畫布；透光與皺褶在光照下閃爍，像看海時水面的點點波光，只是這片海是橘紅夕陽的化身，可以穿梭其中。投影是手機隨手錄下、再模糊調色的日常影片，光穿過薄膜照向機車、陽傘、拖鞋、海灘椅，牆上浮現色調變化；混雜的環境聲似可辨又不可辨。看海看夕陽時的發呆與回憶湧現，都被收進這片橘紅。',
  },

  // 2022：純數字（01-07、10-15）是同一件作品（13 張）
  {
    id: 'plastic-2022-main', type: 'plastic', year: 2022, title: '2022', dir: 'plastic/2022',
    files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg',
            '10.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg'],
    name: '隱沒的表象',
    desc: '走進幽暗展場，循著橘色線條前行：原屬空間的電線壓條、塑膠水管、黑燈管與冷氣窗框被抽離功能，化為藍綠紫橘的線。轉角的牆與柱以黑色塑膠袋包覆，視覺上失去深度、成為無底的黑色畫布，得靠聽覺與觸覺喚回失去的維度。水龍頭接著風管口、瓦斯桶連著紙箱，只剩「釋放」「容納」的荒謬連結。最後牆上寫著「WHEN IS ESSENCE?」——不問何為本質，而問它何時顯現。以繪畫性召喚身體感，揭露物被日常遮蔽的另一種面貌。',
  },

  // 2022：字母系列各一件（4 件）
  {
    id: 'plastic-2022-a', type: 'plastic', year: 2022, title: '2022 · Series A', dir: 'plastic/2022',
    files: ['a01.jpg', 'a02.jpg', 'a03.jpg', 'a04.jpg', 'a05.jpg', 'a06.jpg'],
    name: 'See You Later',
    desc: '把電風扇、電話、椅子塗上白漆，安置在角落，以投影機的漸層色光作為唯一光源；電扇朝外吹動吊在投影機與物件間的氣泡布，布的影子也落進投影邊界內。白漆讓色光直接染上物件，30 秒像走過一整天：沒掛上的電話、隨意靠牆的椅子、仍在轉的電扇、輕飄的布——彷彿有人剛接完電話便匆匆離去。物的意義與色光的時間性之間的張力道出繪畫性，創造出主體不在場的詩意；當觀者走入，身體的影子也成了畫布中的元素。',
  },
  {
    id: 'plastic-2022-b', type: 'plastic', year: 2022, title: '2022 · Series B', dir: 'plastic/2022',
    files: ['b01.jpg', 'b02.jpg', 'b03.jpg', 'b04.jpg'],
    name: 'Annoises',
    desc: '以電風扇擺頭卡住的聲音為發想，在會議空間的平台架上佈置成一齣荒謬劇場。第一區六台站立電扇，四台前後錯開不停卡頓，像多人不間斷地交談；兩台面壁低語，如愛人私密耳語。第二區兩台故障電扇相互傾倒、規律卡頓，隱喻權力與性的關係。第三區一台被反吊架下，因慣性與牆角反射不規律旋轉，像孤獨者困在無法逃離的循環。電線垂下匯入一個壁插，觀者坐在旁邊椅子上聆聽——對聽覺的持續干擾召喚出身體感，受不了時，可以離去，或拔掉插頭結束鬧劇。',
  },
  {
    id: 'plastic-2022-c', type: 'plastic', year: 2022, title: '2022 · Series C', dir: 'plastic/2022',
    files: ['c01.jpg', 'c02.jpg', 'c03.jpg'],
    name: '伸展',
    desc: '把軟性棉繩浸入反應中的發泡劑，發泡附著繩面，支撐與被支撐互為表裡。延長成條狀後，五條筆直自頂樓垂下，經五層樓約 30 公尺到達底層，再沿最後一段階梯的斜度聚成一處、發散佔據走道。作品無法一次被整體看見：以普通視角只見未被階梯遮住的一小段，要看不同部分，就得走到不同樓層、或自頂端底端從縫隙俯仰窺看。身體因觀看模式不同而生差異，作品對身體感的召喚便在此發生，也讓人重新察覺樓梯間平時被忽略的隱匿空間。',
  },
  {
    id: 'plastic-2022-d', type: 'plastic', year: 2022, title: '2022 · Series D', dir: 'plastic/2022',
    files: ['d01.jpg', 'd02.jpg', 'd03.jpg', 'd04.jpg', 'd05.jpg', 'd06.jpg', 'd07.jpg', 'd08.jpg', 'd09.jpg', 'd10.jpg', 'd11.jpg'],
    name: '離不開',
    desc: '生活總離不開某些物、某種情緒、某個念頭，我們與它們若即若離。展場裡，機車、冷氣、床墊、電視、沙發、遮雨棚被膠膜層層包裹、再刷上橘紅油漆，只剩體積，化為佔據空間的橘紅團塊，有的躺地、有的靠牆，像失去力氣的人。橘紅膠膜把它們串成一個迴圈般的場域。投影是下雨、行走、大海等被模糊處理的日常畫面，配上鏡像手寫字「起來」「走不動了」「去看海」「你愛我嗎」。當我們越靠近慾望，就越遠離自己——在這迴圈裡，我們總是搖擺不定。',
  },

  // 2021：兩件，各 3 張
  { id: 'plastic-2021-1', type: 'plastic', year: 2021, title: '2021 · I', dir: 'plastic/2021', files: ['01.jpg', '02.jpg', '03.jpg'],
    name: '生生',
    desc: '一尊全身 FRP 人像站在一灘凝結的黑色 FRP 上，側後方牆面掛著一塊由 FRP 碎片拼貼的黑色長方形。人像由下而上逐漸分解，呼應從虛無而生、又終將消逝再生的想像：從傾倒於地的 FRP、被形塑的人形，到破壞後重組的牆上「FRP 畫」，是一場由立體、半立體到平面的辯證。黑色純色塊的濃淡與物質筆觸彼此交融，讓人聯想馬列維奇的黑方塊，也成為對雕塑存有的一次反思。' },
  { id: 'plastic-2021-2', type: 'plastic', year: 2021, title: '2021 · II', dir: 'plastic/2021', files: ['04.jpg', '05.jpg', '06.jpg'],
    name: '我在哪',
    desc: '挪用傑克梅第的人形，翻製成 170 公分高的白色雕塑，再分解、懸吊於空中。將 36 部 YouTube 發燒影片並置、極速播放成閃爍雜訊，向上投影到雕塑的白色表面，內容無法辨識——隱喻 21 世紀的「資訊焦慮症」：我們浸泡在無盡資訊裡，卻無法把它結構成知識。未被遮擋的光打上天花板，雕塑傾斜的影子化為大小不一的黑色塊，讓影像的類平面性再次詮釋繪畫性，也讓存在主義的不安重新聚焦於當代。' },

  // 2020～2017：每年各一件
  { id: 'plastic-2020', type: 'plastic', year: 2020, title: '2020', dir: 'plastic/2020', files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'],
    name: '自作多情',
    desc: '半身女性大理石像，以肩膀為界，其下連同台座塗滿粉紅，其上保留大理石的白。她面向牆上的圓鏡，鏡心卻被一塊粉紅方塊遮住，看不見自己——就像被情感佔據思緒：旁人看來她是清醒的（白），她卻最清楚自己仍為情所困。若從她的視角看鏡中，肩膀以上成了一塊粉紅色塊，雕塑、鏡面與鏡中影像三者疊合，讓「色塊」這種繪畫性透過影像的類平面性被說出。' },
  { id: 'plastic-2019', type: 'plastic', year: 2019, title: '2019', dir: 'plastic/2019', files: ['01.jpg', '02.jpg', '03.jpg'] },
  { id: 'plastic-2018', type: 'plastic', year: 2018, title: '2018', dir: 'plastic/2018', files: ['01.jpg', '02.jpg', '03.jpg'] },
  { id: 'plastic-2017', type: 'plastic', year: 2017, title: '2017', dir: 'plastic/2017', files: ['01.jpg', '02.jpg'] },
]

// 組出圖片路徑（BASE_URL 讓部署到子目錄也不會壞圖）
const BASE = import.meta.env.BASE_URL
export const thumbSrc = (work, file) => `${BASE}img/thumbs/${work.dir}/${file}` // 卡片用縮圖
export const fullSrc = (work, file) => `${BASE}img/${work.dir}/${file}`         // 燈箱用原圖

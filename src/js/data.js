// ===== 作品資料（v3：一張卡 = 一件作品）=====
// 想調整分組或標題，直接改這個檔案。
// files 有多張圖的作品：卡片會輪播、燈箱左側用縮圖或左右鍵切換主圖。
// 想加作品說明：在該物件加 desc: '...'（顯示在燈箱右側，可用 \n 換行）。
// 中英雙語：name/desc 是中文，name_en/desc_en 是英文（英文留空會自動 fallback 中文）。
//   英文是先機翻的版本，可直接改字；插畫的 title 是英文專名，中英兩種模式都照顯示。
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
    name_en: 'I Sea the Sunset',
    desc_en: "A pun turning 'See' into 'Sea'—watching the sunset while turning it into a sea. Sheets of industrial film stretch from floor to ceiling, brushed with orange-red paint that leaves heavy strokes, each becoming a canvas; under light their translucence and creases shimmer like sparkles on the sea at dusk—only this sea is the sunset made flesh, and you can wander through it. The projections are everyday phone clips, blurred and recolored into a moving light that passes through the film onto a scooter, parasol, slippers and a beach chair, shifting tones across the walls; ambient sounds drift in and out of recognition. The daydreaming and welling memories of watching a seaside sunset are all gathered into this orange-red.",
    desc: 'See（看）改成 Sea（海）的雙關——看夕陽，也把夕陽變成海。數片工業薄膜自地面展開至天花板，刷上橘紅油漆、留下大量筆痕，成為一張張畫布；透光與皺褶在光照下閃爍，像看海時水面的點點波光，只是這片海是橘紅夕陽的化身，可以穿梭其中。投影是手機隨手錄下、再模糊調色的日常影片，光穿過薄膜照向機車、陽傘、拖鞋、海灘椅，牆上浮現色調變化；混雜的環境聲似可辨又不可辨。看海看夕陽時的發呆與回憶湧現，都被收進這片橘紅。',
  },

  // 2022：純數字（01-07、10-15）是同一件作品（13 張）
  {
    id: 'plastic-2022-main', type: 'plastic', year: 2022, title: '2022', dir: 'plastic/2022',
    files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg', '07.jpg',
            '10.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg'],
    name: '隱沒的表象',
    name_en: 'Vanishing Appearances',
    desc_en: "Stepping into a dark hall, you follow orange lines: the venue's own cable trunking, plastic pipes, black light tubes and an AC window frame are stripped of function and turned into lines of blue, green, purple and orange. Walls and pillars in the corners are wrapped in black plastic bags, losing depth to become a bottomless black canvas—only touch and hearing restore the lost dimension. A faucet meets an air vent, a gas cylinder meets a cardboard box, joined only by the absurd logic of 'release' and 'contain'. On the wall: 'WHEN IS ESSENCE?'—not asking what essence is, but when it appears. Painterliness summons bodily sense, revealing another face of objects hidden by the everyday.",
    desc: '走進幽暗展場，循著橘色線條前行：原屬空間的電線壓條、塑膠水管、黑燈管與冷氣窗框被抽離功能，化為藍綠紫橘的線。轉角的牆與柱以黑色塑膠袋包覆，視覺上失去深度、成為無底的黑色畫布，得靠聽覺與觸覺喚回失去的維度。水龍頭接著風管口、瓦斯桶連著紙箱，只剩「釋放」「容納」的荒謬連結。最後牆上寫著「WHEN IS ESSENCE?」——不問何為本質，而問它何時顯現。以繪畫性召喚身體感，揭露物被日常遮蔽的另一種面貌。',
  },

  // 2022：字母系列各一件（4 件）
  {
    id: 'plastic-2022-a', type: 'plastic', year: 2022, title: '2022 · Series A', dir: 'plastic/2022',
    files: ['a01.jpg', 'a02.jpg', 'a03.jpg', 'a04.jpg', 'a05.jpg', 'a06.jpg'],
    name: 'See You Later',
    name_en: 'See You Later',
    desc_en: "A fan, a telephone and a chair are painted white and set in a corner, lit only by a projector's gradient of shifting color; the fan blows outward at bubble wrap hung between projector and objects, and its shadow falls within the projected frame. The white paint lets the colored light dye the objects directly—thirty seconds pass like a whole day: a phone off the hook, a chair leaning carelessly, a fan still turning, fabric drifting—as if someone just took a call and hurried away. The tension between the objects' meaning and the time-bound light speaks of painterliness, creating the poetry of an absent subject; when you step in, your own shadow becomes an element on the canvas.",
    desc: '把電風扇、電話、椅子塗上白漆，安置在角落，以投影機的漸層色光作為唯一光源；電扇朝外吹動吊在投影機與物件間的氣泡布，布的影子也落進投影邊界內。白漆讓色光直接染上物件，30 秒像走過一整天：沒掛上的電話、隨意靠牆的椅子、仍在轉的電扇、輕飄的布——彷彿有人剛接完電話便匆匆離去。物的意義與色光的時間性之間的張力道出繪畫性，創造出主體不在場的詩意；當觀者走入，身體的影子也成了畫布中的元素。',
  },
  {
    id: 'plastic-2022-b', type: 'plastic', year: 2022, title: '2022 · Series B', dir: 'plastic/2022',
    files: ['b01.jpg', 'b02.jpg', 'b03.jpg', 'b04.jpg'],
    name: 'Annoises',
    name_en: 'Annoises',
    desc_en: "Inspired by the stuttering sound of an electric fan's stuck oscillation, an absurd theater is staged on platform racks in a meeting room. In the first zone, six standing fans: four offset front-to-back stutter ceaselessly like many people talking without pause; two facing the wall murmur like lovers' whispers. In the second, two broken fans tip into each other in regular stutters, hinting at power and sex. In the third, a single fan hangs upside-down beneath a rack, spinning erratically from inertia and wall reflection like a lonely person trapped in an inescapable loop. Cords drip down into one wall socket; you sit on a chair beside it and listen—the relentless aural assault summons bodily sense, and when you can't bear it, you may leave, or pull the plug to end the farce.",
    desc: '以電風扇擺頭卡住的聲音為發想，在會議空間的平台架上佈置成一齣荒謬劇場。第一區六台站立電扇，四台前後錯開不停卡頓，像多人不間斷地交談；兩台面壁低語，如愛人私密耳語。第二區兩台故障電扇相互傾倒、規律卡頓，隱喻權力與性的關係。第三區一台被反吊架下，因慣性與牆角反射不規律旋轉，像孤獨者困在無法逃離的循環。電線垂下匯入一個壁插，觀者坐在旁邊椅子上聆聽——對聽覺的持續干擾召喚出身體感，受不了時，可以離去，或拔掉插頭結束鬧劇。',
  },
  {
    id: 'plastic-2022-c', type: 'plastic', year: 2022, title: '2022 · Series C', dir: 'plastic/2022',
    files: ['c01.jpg', 'c02.jpg', 'c03.jpg'],
    name: '造型練習',
    name_en: 'Form Study',
    desc_en: "Soft cotton rope is dipped into reacting foam, which clings to its surface so that support and supported become each other's inside and outside. They stick together into a whole, yet keep deforming and collapsing through the material's own nature—like the process of a form study: finding a point of balance through trial, only to break it and rebuild again.",
    desc: '把軟性棉繩浸入反應中的發泡劑，發泡附著繩面，支撐與被支撐互為表裡。互相黏著以成為一個整體，卻又因為物質特性而不斷變形、崩解，像是造型練習的過程：在嘗試中找到平衡點，卻又不斷被打破、再重建。',
  },
  {
    id: 'plastic-2022-d', type: 'plastic', year: 2022, title: '2022 · Series D', dir: 'plastic/2022',
    files: ['d01.jpg', 'd02.jpg', 'd03.jpg', 'd04.jpg', 'd05.jpg', 'd06.jpg', 'd07.jpg', 'd08.jpg', 'd09.jpg', 'd10.jpg', 'd11.jpg'],
    name: '離不開',
    name_en: 'Can Not Leave',
    desc_en: "Life is inseparable from certain things—an object, an emotion, a thought—and our bond with them is always near yet distant. In the hall, a scooter, air conditioner, mattress, TV, sofa and awning are wrapped layer by layer in film and brushed orange-red, left as mere volumes, turned into orange-red masses that occupy space, some lying down, some leaning on walls like people drained of strength. The orange-red film links them into a loop-like field. The projections are everyday scenes—rain, walking figures, the sea—blurred, with mirror-written words: 'Get up', 'Can't walk anymore', 'Go see the sea', 'Do you love me'. The closer we get to desire, the further from ourselves—in this loop, we always waver.",
    desc: '生活總離不開某些物、某種情緒、某個念頭，我們與它們若即若離。展場裡，機車、冷氣、床墊、電視、沙發、遮雨棚被膠膜層層包裹、再刷上橘紅油漆，只剩體積，化為佔據空間的橘紅團塊，有的躺地、有的靠牆，像失去力氣的人。橘紅膠膜把它們串成一個迴圈般的場域。投影是下雨、行走、大海等被模糊處理的日常畫面，配上鏡像手寫字「起來」「走不動了」「去看海」「你愛我嗎」。當我們越靠近慾望，就越遠離自己——在這迴圈裡，我們總是搖擺不定。',
  },

  // 2021：兩件，各 3 張
  { id: 'plastic-2021-1', type: 'plastic', year: 2021, title: '2021 · I', dir: 'plastic/2021', files: ['01.jpg', '02.jpg', '03.jpg'],
    name: '生生',
    name_en: 'Live again and again',
    desc_en: "A full-body FRP figure stands on a pool of congealed black FRP (image lost), with a black rectangle collaged from FRP shards hanging on the wall behind. The figure dissolves gradually from bottom to top, echoing an imagining of life born from the void and, in passing, reborn: from FRP poured onto the ground, to the shaped human form, to the wall's reconstructed 'FRP painting'—a dialectic moving from the three-dimensional through the semi-dimensional to the flat. The gradations of pure black mass merge with the material's brushwork, recalling Malevich's black square and becoming a reflection on the being of sculpture.",
    desc: '一尊全身 FRP 人像站在一灘凝結的黑色 FRP 上（圖片遺失），側後方牆面掛著一塊由 FRP 碎片拼貼的黑色長方形。人像由下而上逐漸分解，呼應從虛無而生、又終將消逝再生的想像：從傾倒於地的 FRP、被形塑的人形，到破壞後重組的牆上「FRP 畫」，是一場由立體、半立體到平面的辯證。黑色純色塊的濃淡與物質筆觸彼此交融，讓人聯想馬列維奇的黑方塊，也成為對雕塑存有的一次反思。' },
  { id: 'plastic-2021-2', type: 'plastic', year: 2021, title: '2021 · II', dir: 'plastic/2021', files: ['04.jpg', '05.jpg', '06.jpg'],
    name: '我在哪',
    name_en: 'Where Am I?',
    desc_en: "Appropriating Giacometti's figure, cast into a 170 cm white sculpture, then dismantled and suspended in the air. Thirty-six trending YouTube clips are juxtaposed and played at extreme speed into flickering noise, projected upward onto the sculpture's white surface, illegible—a metaphor for 21st-century 'information anxiety': we soak in endless information yet cannot structure it into knowledge. Light that misses the figure hits the ceiling, and the tilted sculpture's shadows become black blocks of varying size, letting the image's quasi-flatness interpret painterliness once more, and refocusing existentialist unease onto the present.",
    desc: '挪用傑克梅第的人形，翻製成 170 公分高的白色雕塑，再分解、懸吊於空中。將 36 部 YouTube 發燒影片並置、極速播放成閃爍雜訊，向上投影到雕塑的白色表面，內容無法辨識——隱喻 21 世紀的「資訊焦慮症」：我們浸泡在無盡資訊裡，卻無法把它結構成知識。未被遮擋的光打上天花板，雕塑傾斜的影子化為大小不一的黑色塊，讓影像的類平面性再次詮釋繪畫性，也讓存在主義的不安重新聚焦於當代。' },

  // 2020～2017：每年各一件
  { id: 'plastic-2020', type: 'plastic', year: 2020, title: '2020', dir: 'plastic/2020', files: ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'],
    name: '自作多情',
    name_en: 'Flattered by My Own Feelings',
    desc_en: "A half-body female marble figure: below the shoulders, including the plinth, is painted pink; above stays marble white. She faces a round mirror on the wall, but its center is covered by a pink square so she cannot see herself—as if seized by emotion: to others she seems clear-headed (white), yet she alone knows she is still caught in love. Seen from her own viewpoint, everything above the shoulders becomes a pink block in the mirror; sculpture, mirror surface and mirrored image overlap, letting 'the color block' as painterliness be spoken through the image's quasi-flatness.",
    desc: '半身女性大理石像，以肩膀為界，其下連同台座塗滿粉紅，其上保留大理石的白。她面向牆上的圓鏡，鏡心卻被一塊粉紅方塊遮住，看不見自己——就像被情感佔據思緒：旁人看來她是清醒的（白），她卻最清楚自己仍為情所困。若從她的視角看鏡中，肩膀以上成了一塊粉紅色塊，雕塑、鏡面與鏡中影像三者疊合，讓「色塊」這種繪畫性透過影像的類平面性被說出。' },
  { id: 'plastic-2019', type: 'plastic', year: 2019, title: '2019', dir: 'plastic/2019', files: ['01.jpg', '02.jpg', '03.jpg'],
    name: '失眠',
    name_en: 'Insomnia',
    desc_en: 'An imagining of insomnia.',
    desc: '對於失眠的想像' },
  { id: 'plastic-2018', type: 'plastic', year: 2018, title: '2018', dir: 'plastic/2018', files: ['01.jpg', '02.jpg', '03.jpg'],
    name: '至死不渝的愛',
    name_en: 'Love to death',
    desc_en: 'Embracing skeletons as a metaphor for eternal love.',
    desc: '以擁抱的骷髏隱喻永恆的愛' },
  { id: 'plastic-2017', type: 'plastic', year: 2017, title: '2017', dir: 'plastic/2017', files: ['01.jpg', '02.jpg'],
    name: '想破頭了',
    name_en: 'Racking My Brain',
    desc_en: 'Flowing imagery fused with a realistic human head.',
    desc: '流動的意象與寫實的人頭結合' },
]

// 組出圖片路徑（BASE_URL 讓部署到子目錄也不會壞圖）
const BASE = import.meta.env.BASE_URL
export const thumbSrc = (work, file) => `${BASE}img/thumbs/${work.dir}/${file}` // 卡片用縮圖
export const fullSrc = (work, file) => `${BASE}img/${work.dir}/${file}`         // 燈箱用原圖

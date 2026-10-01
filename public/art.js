// 메뉴 카드 일러스트: 말랑한 액자 모양 + 소품을 입은 깨비 (페이지의 #kb 심볼 사용)
// 좌표계 200x200. 깨비(#kb, 140x140)를 가운데 아래쪽에 놓고 소품을 덧그림.

const KB = (x = 30, y = 46, s = 140) => `<use href="#kb" x="${x}" y="${y}" width="${s}" height="${s}"/>`;
// 깨비 눈 위치 (x=30,y=46,s=140 기준): 왼눈 (82,126), 오른눈 (118,126)

const FRAMES = {
  // 네모 말랑
  squircle: (c) => `<rect x="8" y="8" width="184" height="184" rx="48" fill="${c}"/>`,
  // 구름(네잎)
  clover: (c) => `<g fill="${c}"><circle cx="70" cy="70" r="62"/><circle cx="130" cy="70" r="62"/><circle cx="70" cy="130" r="62"/><circle cx="130" cy="130" r="62"/></g>`,
  // 별
  star: (c) => `<path d="M100 14 L124 70 L186 76 L139 116 L153 178 L100 146 L47 178 L61 116 L14 76 L76 70 Z" fill="${c}" stroke="${c}" stroke-width="22" stroke-linejoin="round"/>`,
  // 하트
  heart: (c) => `<path d="M100 182 C38 140 8 104 8 66 C8 32 34 10 62 10 C80 10 92 20 100 34 C108 20 120 10 138 10 C166 10 192 32 192 66 C192 104 162 140 100 182 Z" fill="${c}"/>`,
  // 동그라미
  circle: (c) => `<circle cx="100" cy="100" r="92" fill="${c}"/>`,
  // 꽃(여섯잎)
  flower: (c) => `<g fill="${c}">${[0, 60, 120, 180, 240, 300].map((a) => {
    const r = (a * Math.PI) / 180; return `<circle cx="${100 + 46 * Math.cos(r)}" cy="${100 + 46 * Math.sin(r)}" r="52"/>`;
  }).join("")}<circle cx="100" cy="100" r="60"/></g>`,
};

const SUNGLASSES = (y = 122, dark = "#2B2233") => `
  <g><rect x="64" y="${y - 12}" width="32" height="24" rx="11" fill="${dark}"/><rect x="104" y="${y - 12}" width="32" height="24" rx="11" fill="${dark}"/>
  <rect x="94" y="${y - 4}" width="12" height="5" rx="2" fill="${dark}"/>
  <rect x="70" y="${y - 7}" width="9" height="4" rx="2" fill="#fff" opacity=".7"/><rect x="110" y="${y - 7}" width="9" height="4" rx="2" fill="#fff" opacity=".7"/></g>`;

const ART = {
  // 990원 사주: 밀짚모자 + 선글라스 + 주스
  saju: { frame: "squircle", bg: "#FFE9A8", draw: () => `
    ${KB()}${SUNGLASSES()}
    <ellipse cx="100" cy="86" rx="70" ry="14" fill="#E9C27A"/>
    <path d="M62 86 Q64 50 100 48 Q136 50 138 86 Z" fill="#F2D394"/>
    <rect x="62" y="76" width="76" height="9" fill="#FF8FAB"/>
    <g transform="translate(18 120)"><path d="M0 0 H30 L26 52 H4 Z" fill="#FFB347" opacity=".9"/><path d="M0 0 H30 L29 10 H1 Z" fill="#fff" opacity=".5"/>
    <rect x="18" y="-22" width="3" height="28" fill="#FF6B8A" transform="rotate(12 19 -8)"/><circle cx="26" cy="2" r="7" fill="#FFD166"/></g>` },

  // 990원 연애운: 하트 눈 + 날아다니는 하트
  love: { frame: "heart", bg: "#FFD3E0", draw: () => `
    ${KB(30, 50)}
    <path d="M82 138 c-9-7-13-12-13-17 a6.5 6.5 0 0 1 13-2 a6.5 6.5 0 0 1 13 2 c0 5-4 10-13 17z" fill="#FF4D7A"/>
    <path d="M118 138 c-9-7-13-12-13-17 a6.5 6.5 0 0 1 13-2 a6.5 6.5 0 0 1 13 2 c0 5-4 10-13 17z" fill="#FF4D7A"/>
    <g fill="#FF6B8A"><path d="M40 56 c-6-5-9-8-9-11 a4.5 4.5 0 0 1 9-1.5 a4.5 4.5 0 0 1 9 1.5 c0 3-3 6-9 11z"/>
    <path d="M162 70 c-5-4-7-7-7-9 a3.5 3.5 0 0 1 7-1 a3.5 3.5 0 0 1 7 1 c0 2-2 5-7 9z" opacity=".8"/>
    <path d="M150 38 c-4-3-6-5-6-7 a3 3 0 0 1 6-1 a3 3 0 0 1 6 1 c0 2-2 4-6 7z" opacity=".6"/></g>` },

  // 990원 궁합: 깨비 둘 + 가운데 하트
  gunghap: { frame: "clover", bg: "#D7F2C2", draw: () => `
    <g opacity=".95">${KB(4, 70, 112)}</g><g transform="translate(200 0) scale(-1 1)">${KB(4, 70, 112)}</g>
    <g transform="translate(84 58)"><path d="M16 30 C4 21 0 15 0 9 A8 8 0 0 1 16 6 A8 8 0 0 1 32 9 C32 15 28 21 16 30 Z" fill="#FF6B8A"/></g>
    <g fill="#FFD166"><circle cx="40" cy="58" r="4"/><circle cx="162" cy="52" r="3"/></g>` },

  // 990원 연운: 폭죽 + 반짝이
  yearly: { frame: "flower", bg: "#E4DAFF", draw: () => `
    ${KB()}
    <g stroke="#FFD166" stroke-width="4" stroke-linecap="round">
      <line x1="150" y1="58" x2="150" y2="38"/><line x1="150" y1="58" x2="168" y2="46"/><line x1="150" y1="58" x2="172" y2="62"/>
      <line x1="150" y1="58" x2="132" y2="44"/><line x1="150" y1="58" x2="162" y2="76"/></g>
    <line x1="150" y1="58" x2="128" y2="150" stroke="#B48A5A" stroke-width="4" stroke-linecap="round"/>
    <g fill="#FFF3B0"><circle cx="40" cy="60" r="4"/><circle cx="56" cy="40" r="3"/><circle cx="30" cy="90" r="3"/></g>
    <path d="M96 52 L100 38 L104 52 L118 56 L104 60 L100 74 L96 60 L82 56 Z" fill="#fff" opacity=".85" transform="translate(-50 -10) scale(.8)"/>
    <rect x="70" y="160" width="60" height="12" rx="6" fill="#B9A4F2"/>` },

  // 990원 대운: 수건 머리 + 각진 선글라스 + 돈주머니
  daewoon: { frame: "star", bg: "#CDEBFF", draw: () => `
    ${KB(30, 52)}
    <path d="M58 92 Q60 52 100 50 Q140 52 142 92 Q120 78 100 80 Q80 78 58 92 Z" fill="#9FD8F5"/>
    <path d="M100 50 Q112 34 128 40 Q118 48 116 58 Z" fill="#8ACDEF"/>
    <path d="M62 116 L98 112 L96 136 L66 134 Z M102 112 L138 116 L134 134 L104 136 Z" fill="#2B2233"/>
    <rect x="96" y="117" width="8" height="4" fill="#2B2233"/>
    <g transform="translate(140 136)"><path d="M6 6 Q0 30 18 32 Q36 30 30 6 Z" fill="#E9B44C"/><path d="M8 6 L28 6 L22 0 L14 0 Z" fill="#C9902E"/>
    <text x="18" y="25" font-size="14" font-weight="700" text-anchor="middle" fill="#7A5310">₩</text></g>` },

  // 990원 택일: 머리띠 + 달력
  taekil: { frame: "circle", bg: "#FFE0CC", draw: () => `
    ${KB()}
    <path d="M60 86 Q100 60 140 86" fill="none" stroke="#FF8FAB" stroke-width="9" stroke-linecap="round"/>
    <circle cx="134" cy="78" r="9" fill="#FF8FAB"/><circle cx="146" cy="74" r="7" fill="#FFB3C7"/>
    <g transform="translate(130 128) rotate(8)"><rect width="46" height="44" rx="8" fill="#fff" stroke="#E7C7B5" stroke-width="2"/>
    <rect width="46" height="13" rx="6" fill="#FF6B6B"/><rect y="7" width="46" height="6" fill="#FF6B6B"/>
    <path d="M12 28 L20 36 L35 21" fill="none" stroke="#5CBF8A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>` },
};

export function menuArt(id) {
  const a = ART[id] || ART.saju;
  return `<svg viewBox="0 0 200 200" class="art" aria-hidden="true">${FRAMES[a.frame](a.bg)}
    <g clip-path="none">${a.draw()}</g></svg>`;
}

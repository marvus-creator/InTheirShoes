const MOODS = {
  neutral: { brow: [[70, 82, 90, 81], [110, 81, 130, 82]], eyes: 'open', mouth: 'M90 129 Q100 132 110 129' },
  happy: { brow: [[70, 78, 90, 76], [110, 76, 130, 78]], eyes: 'smile', mouth: 'M86 124 Q100 141 114 124', blush: true },
  laugh: { brow: [[70, 76, 90, 73], [110, 73, 130, 76]], eyes: 'smile', mouth: 'M85 122 Q100 148 115 122 Z', open: true, blush: true },
  sad: { brow: [[70, 85, 90, 78], [110, 78, 130, 85]], eyes: 'low', mouth: 'M88 135 Q100 125 112 135' },
  worried: { brow: [[70, 84, 90, 76], [110, 76, 130, 84]], eyes: 'open', mouth: 'M90 133 Q95 129 100 133 Q105 137 110 133' },
  nervous: { brow: [[70, 84, 90, 76], [110, 76, 130, 84]], eyes: 'open', mouth: 'M89 132 L111 132', sweat: true },
  angry: { brow: [[70, 77, 91, 86], [109, 86, 130, 77]], eyes: 'open', mouth: 'M88 133 Q100 128 112 133' },
  surprised: { brow: [[70, 73, 90, 70], [110, 70, 130, 73]], eyes: 'wide', mouth: 'O' },
  tired: { brow: [[70, 84, 90, 83], [110, 83, 130, 84]], eyes: 'tired', mouth: 'M91 131 L109 131', sweat: true },
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function hairBack(p) {
  const c = p.hairColor;
  if (p.hair === 'puff') return `<circle cx="100" cy="62" r="62" fill="${c}"/>`;
  if (p.hair === 'braids') return `<rect x="42" y="70" width="18" height="110" rx="9" fill="${c}"/><rect x="140" y="70" width="18" height="110" rx="9" fill="${c}"/>`;
  if (p.hair === 'bunches') return `<circle cx="44" cy="58" r="20" fill="${c}"/><circle cx="156" cy="58" r="20" fill="${c}"/>`;
  if (p.hair === 'bun') return `<circle cx="100" cy="30" r="20" fill="${c}"/>`;
  return '';
}

function hairFront(p) {
  const c = p.hairColor;
  if (p.hair === 'wrap') {
    const d = shade(c, -40);
    return `<path d="M44 92 Q40 30 100 26 Q160 30 156 92 Q140 62 100 60 Q60 62 44 92Z" fill="${c}"/><path d="M60 52 Q100 40 140 52" stroke="${d}" stroke-width="5" fill="none"/><path d="M70 40 Q100 30 130 40" stroke="${d}" stroke-width="4" fill="none"/><ellipse cx="146" cy="34" rx="20" ry="14" fill="${c}" transform="rotate(-25 146 34)"/>`;
  }
  if (p.hair === 'short') return `<path d="M47 90 Q44 38 100 35 Q156 38 153 90 Q148 64 100 60 Q52 64 47 90Z" fill="${c}"/>`;
  return `<path d="M46 92 Q42 36 100 33 Q158 36 154 92 Q144 60 100 57 Q56 60 46 92Z" fill="${c}"/>`;
}

function eyes(type) {
  const ink = '#1b1410';
  return [80, 120]
    .map((x) => {
      if (type === 'smile') return `<path d="M${x - 7} 101 Q${x} 93 ${x + 7} 101" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      if (type === 'tired') return `<path d="M${x - 6} 99 Q${x} 107 ${x + 6} 99Z" fill="${ink}"/><path d="M${x - 8} 99 L${x + 8} 99" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
      const ry = type === 'wide' ? 8 : 6;
      const cy = type === 'low' ? 102 : 100;
      return `<ellipse cx="${x}" cy="${cy}" rx="${type === 'wide' ? 6 : 5}" ry="${ry}" fill="${ink}"/><circle cx="${x + 2}" cy="${cy - 2}" r="1.8" fill="#fff"/>`;
    })
    .join('');
}

function face(p, mood = 'neutral') {
  const m = MOODS[mood] ?? MOODS.neutral;
  const skin = p.skin;
  const dark = shade(skin, -28);
  const ink = '#1b1410';
  const brows = m.brow.map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${p.hairColor === '#d9902f' ? ink : p.hairColor}" stroke-width="5" stroke-linecap="round"/>`).join('');
  const mouth = m.mouth === 'O'
    ? `<ellipse cx="100" cy="132" rx="7" ry="9" fill="#4a1f1a"/>`
    : m.open
      ? `<path d="${m.mouth}" fill="#4a1f1a"/><path d="M90 126 Q100 130 110 126" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : `<path d="${m.mouth}" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const blush = m.blush ? `<ellipse cx="68" cy="117" rx="9" ry="5" fill="#e0675a" opacity=".35"/><ellipse cx="132" cy="117" rx="9" ry="5" fill="#e0675a" opacity=".35"/>` : '';
  const sweat = m.sweat ? `<path d="M150 70 Q156 82 150 88 Q144 82 150 70Z" fill="#9fd4f5" stroke="#5fa9d8" stroke-width="1.5"/>` : '';
  const shirt = p.shirt;
  return `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${hairBack(p)}
    <path d="M18 230 Q18 172 100 166 Q182 172 182 230Z" fill="${shirt}"/>
    <path d="M78 168 L100 196 L122 168Z" fill="#f4f1ea"/>
    <rect x="86" y="140" width="28" height="32" rx="10" fill="${dark}"/>
    <circle cx="49" cy="102" r="11" fill="${dark}"/><circle cx="151" cy="102" r="11" fill="${dark}"/>
    <ellipse cx="100" cy="98" rx="52" ry="58" fill="${skin}"/>
    ${hairFront(p)}
    ${blush}${brows}${eyes(m.eyes)}
    <path d="M97 108 Q100 116 104 112" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${mouth}${sweat}
  </svg>`;
}

function wave(y, amp, seed) {
  let d = `M0 900 L0 ${y}`;
  const n = 5;
  for (let i = 1; i <= n; i++) {
    const x = (i * 1600) / n;
    const cx = x - 1600 / n / 2;
    const k = 0.6 + (((seed * 7 + i * 3) % 5) / 10);
    d += ` Q${cx} ${y - amp * k * (i % 2 ? 1 : -0.4)} ${x} ${y + (((seed + i) % 3) - 1) * amp * 0.25}`;
  }
  return `${d} L1600 900 Z`;
}

const hills = (layers) => layers.map(([y, amp, c, s]) => `<path d="${wave(y, amp, s)}" fill="${c}"/>`).join('');

function sky(id, stops) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="1600" height="900" fill="url(#${id})"/>`;
}

const house = (x, y, wall, roof, lit) => `
  <g transform="translate(${x} ${y})">
    <rect x="0" y="60" width="230" height="140" fill="${wall}"/>
    <path d="M-20 64 L115 -10 L250 64Z" fill="${roof}"/>
    <rect x="30" y="100" width="54" height="46" rx="4" fill="${lit ? '#ffd47a' : '#5b4636'}"/>
    ${lit ? '<circle cx="57" cy="123" r="70" fill="#ffcf6b" opacity=".18"/>' : ''}
    <rect x="130" y="110" width="52" height="90" rx="4" fill="${shade(wall, -45)}"/>
  </g>`;

function jerrycan(x, y, c = '#f2c230') {
  return `<g transform="translate(${x} ${y})"><rect x="0" y="12" width="46" height="58" rx="8" fill="${c}"/><rect x="10" y="0" width="16" height="16" rx="3" fill="${shade(c, -40)}"/><rect x="28" y="4" width="14" height="8" rx="3" fill="${shade(c, -40)}"/></g>`;
}

function figure(x, y, c) {
  return `<g transform="translate(${x} ${y})" opacity=".85"><circle cx="0" cy="0" r="22" fill="${shade(c, -10)}"/><path d="M-36 100 Q-36 34 0 32 Q36 34 36 100Z" fill="${c}"/></g>`;
}

const SCENES = {
  dawn: () => `
    ${sky('sd', [[0, '#1c2350'], [0.55, '#6a4a7c'], [0.85, '#e98d63'], [1, '#f6b878']])}
    ${[[120, 90], [300, 160], [520, 70], [760, 130], [980, 60], [1250, 110], [1450, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" opacity=".8"/>`).join('')}
    <ellipse cx="800" cy="640" rx="520" ry="120" fill="#ffc98a" opacity=".35"/>
    ${hills([[560, 90, '#4b3a6e', 1], [640, 80, '#35295a', 3], [730, 70, '#231b40', 5]])}
    ${house(1130, 520, '#2c2346', '#1b1530', true)}`,
  home: () => `
    ${sky('sh', [[0, '#8fc6e4'], [0.7, '#f6d6a6'], [1, '#f9c88c']])}
    <circle cx="300" cy="420" r="70" fill="#ffe3a3" opacity=".9"/>
    ${hills([[520, 90, '#93bd7a', 2], [600, 80, '#6fa25e', 4], [700, 70, '#4f8547', 1]])}
    ${house(1100, 500, '#c98b5b', '#7b4a32', false)}
    <path d="M1260 900 Q1240 790 1290 700" stroke="#d9b98a" stroke-width="70" fill="none"/>`,
  waterpoint: () => `
    ${sky('sw', [[0, '#a5d3e9'], [0.75, '#f5dcae'], [1, '#f3c890']])}
    ${hills([[500, 90, '#9cc282', 3], [590, 70, '#78aa64', 1], [690, 60, '#5b9150', 4]])}
    <rect x="0" y="740" width="1600" height="160" fill="#c9a774"/>
    <g transform="translate(260 520)"><rect x="0" y="0" width="34" height="230" rx="6" fill="#7d8a93"/><rect x="-10" y="40" width="80" height="18" rx="6" fill="#7d8a93"/><rect x="58" y="50" width="12" height="26" rx="3" fill="#5c666d"/></g>
    ${[380, 450, 520, 590, 660, 730, 800, 870].map((x, i) => jerrycan(x, 690, ['#f2c230', '#e2683c', '#f2c230', '#3d8fd1', '#f2c230', '#5aa15a', '#e2683c', '#f2c230'][i])).join('')}
    ${figure(960, 640, '#8c5a3c')}${figure(1050, 650, '#3d6fb6')}${figure(1140, 640, '#a04a5c')}${figure(1230, 655, '#6b7a3c')}${figure(1320, 645, '#8c5a3c')}`,
  yard: () => `
    ${sky('sy', [[0, '#8fcdee'], [1, '#e6f3ef']])}
    <circle cx="1350" cy="170" r="60" fill="#fff2c4"/>
    ${hills([[470, 80, '#a7cf8f', 5], [540, 70, '#86bb73', 2], [620, 50, '#6aa45d', 3]])}
    <rect x="0" y="700" width="1600" height="200" fill="#d9b88a"/>
    <rect x="190" y="420" width="46" height="300" rx="14" fill="#7a5134"/>
    <circle cx="210" cy="380" r="140" fill="#4f8f4a"/><circle cx="110" cy="440" r="90" fill="#5d9f55"/><circle cx="320" cy="430" r="100" fill="#478342"/>
    <g transform="translate(1180 620)"><rect x="0" y="0" width="260" height="22" rx="6" fill="#9a6a43"/><rect x="20" y="22" width="16" height="70" fill="#7a5134"/><rect x="224" y="22" width="16" height="70" fill="#7a5134"/></g>
    <circle cx="1000" cy="770" r="26" fill="#fff"/><path d="M984 760 L1000 752 L1016 760 L1012 778 L988 778Z" fill="#222"/>`,
  classroom: (chalk = '') => `
    ${sky('sc', [[0, '#f0e2c6'], [1, '#e3cca3']])}
    <rect x="0" y="690" width="1600" height="210" fill="#b98a5e"/>
    <rect x="0" y="682" width="1600" height="12" fill="#9b6f48"/>
    <rect x="360" y="110" width="880" height="380" rx="10" fill="#8a5e3b"/>
    <rect x="378" y="128" width="844" height="344" rx="6" fill="#2f4b3e"/>
    <text x="800" y="250" text-anchor="middle" font-family="'Caveat','Comic Sans MS',cursive" font-size="64" fill="#f4f1e6" opacity=".92">${chalk}</text>
    <path d="M520 320 Q640 300 760 320 T1000 320" stroke="#f4f1e6" stroke-width="4" fill="none" opacity=".5"/>
    <rect x="80" y="160" width="200" height="250" rx="8" fill="#8a5e3b"/>
    <rect x="94" y="174" width="172" height="222" rx="4" fill="#9fd1ea"/>
    <path d="M94 330 Q140 290 190 320 T266 300 L266 396 L94 396Z" fill="#6fa25e"/>
    <rect x="176" y="174" width="8" height="222" fill="#8a5e3b"/>
    <circle cx="1400" cy="200" r="54" fill="#fbf7ef" stroke="#8a5e3b" stroke-width="8"/>
    <path d="M1400 200 L1400 166 M1400 200 L1424 212" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>
    <rect x="1330" y="330" width="170" height="210" rx="8" fill="#e8d6b2" stroke="#c9b089" stroke-width="4"/>
    <rect x="1350" y="350" width="60" height="70" fill="#f0a35e"/><rect x="1420" y="350" width="60" height="50" fill="#7fb6d9"/><rect x="1350" y="430" width="130" height="90" fill="#9ccf8a"/>`,
  night: () => `
    ${sky('sn', [[0, '#1c2142'], [1, '#2e3160']])}
    <rect x="160" y="150" width="380" height="300" rx="10" fill="#151832" stroke="#3b3f6e" stroke-width="10"/>
    <circle cx="430" cy="240" r="46" fill="#f3efd8"/><circle cx="450" cy="228" r="40" fill="#151832"/>
    ${[[220, 200], [300, 320], [260, 390], [480, 380], [360, 210]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" opacity=".8"/>`).join('')}
    <path d="M160 420 Q260 380 350 410 T540 400 L540 450 L160 450Z" fill="#0f1126"/>
    <rect x="1080" y="140" width="280" height="420" rx="140" fill="#3b3f6e"/>
    <rect x="1096" y="156" width="248" height="388" rx="124" fill="#8c9bd6" opacity=".55"/>
    <circle cx="840" cy="150" r="240" fill="#ffcf6b" opacity=".08"/>
    <rect x="0" y="700" width="1600" height="200" fill="#232647"/>`,
};

function scene(key, chalk) {
  const make = SCENES[key] ?? SCENES.classroom;
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${make(chalk)}</svg>`;
}

/* =====================================================================
   scene.js: draws our little pixel San Francisco on a 320x180 canvas
   Golden Gate · Sutro Tower · Coit Tower · Transamerica · Salesforce Tower
   Painted Ladies · a cable car · Karl the Fog · and the two of us ♥
   ===================================================================== */
(function () {
  'use strict';

  const W = 320, H = 180, HORIZON = 108, STREET = 172;
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const layer = document.createElement('canvas');
  layer.width = W; layer.height = H;
  const lctx = layer.getContext('2d');
  let g = ctx; // current drawing target

  /* ---------------- helpers ---------------- */
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r, gg, b) { return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(gg) << 8) | Math.round(b)).toString(16).slice(1); }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  function mixPal(a, b, t) {
    const o = {};
    for (const k in a) {
      const va = a[k], vb = b[k];
      if (Array.isArray(va)) o[k] = va.map((c, i) => mix(c, vb[i], t));
      else if (typeof va === 'number') o[k] = va + (vb - va) * t;
      else o[k] = mix(va, vb, t);
    }
    return o;
  }
  function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function px(x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function circle(cx, cy, r, c) {
    g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    for (let dy = -r; dy <= r; dy++) { const dx = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); }
  }
  function line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy; g.fillStyle = c;
    for (;;) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  function sprite(rows, pal, x, y, target) {
    const t = target || g;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) { const col = pal[row[c]]; if (col) { t.fillStyle = col; t.fillRect(x + c, y + r, 1, 1); } }
    }
  }

  /* ---------------- palettes for each time of day ---------------- */
  const PHASES = {
    dawn: {
      sky: ['#7a86d8', '#a294de', '#c9a0dc', '#eeaacb', '#ffc4bc', '#ffe0c8'],
      cloud: '#fff0f5', cloudShade: '#e9b7d6', sun: '#fff1c9', sunGlow: '#ffd3c0',
      sunX: 186, sunY: 84, sunA: 1, moonA: 0, starA: 0.15,
      hillFar: '#9b87c4', hillFar2: '#8a77b6',
      water: ['#ffd9d0', '#a9bdee', '#86a6e6', '#6e8fd8'], waterHi: '#fff3f8',
      bridge: '#e0574d', bridgeShade: '#b03c42',
      bldA: '#c6b3e0', bldB: '#a996cf', bldC: '#d6c6ea', bldLight: '#f3ebfa', win: '#8e7cbf', winLit: 0.25,
      grass: '#93d0a0', grassShade: '#77b88d', grassDark: '#5c9c7c', fog: '#fff4fb', path: '#c8b6c8',
      tint: '#ff9ec0', tintA: 0.1,
    },
    day: {
      sky: ['#5d9fe6', '#76b3ee', '#91c6f3', '#acd6f6', '#c9e5f8', '#e6f3fb'],
      cloud: '#ffffff', cloudShade: '#cfe3f5', sun: '#fffbe0', sunGlow: '#fff3b8',
      sunX: 150, sunY: 22, sunA: 1, moonA: 0, starA: 0,
      hillFar: '#86b88f', hillFar2: '#74a682',
      water: ['#cdeef8', '#6cc3e6', '#3fa9d8', '#2f8fc6'], waterHi: '#ffffff',
      bridge: '#d9473c', bridgeShade: '#a8352e',
      bldA: '#ece6ee', bldB: '#cbc4d6', bldC: '#f6f2ec', bldLight: '#ffffff', win: '#8fb8de', winLit: 0,
      grass: '#8fd694', grassShade: '#72bf7f', grassDark: '#5aa56c', fog: '#ffffff', path: '#d9d2c8',
      tint: '#ffffff', tintA: 0,
    },
    sunset: {
      sky: ['#5b6fd6', '#8a7fdc', '#b48ae0', '#e39ad6', '#f7b3cf', '#fdd8c6'],
      cloud: '#ffd6ec', cloudShade: '#d98bd0', sun: '#fff4c2', sunGlow: '#ffd0b5',
      sunX: 140, sunY: 99, sunA: 1, moonA: 0, starA: 0.12,
      hillFar: '#8f6fb8', hillFar2: '#7a5fa8',
      water: ['#ffe9b8', '#5fd0e0', '#3ab4d8', '#2b95c8'], waterHi: '#fff8e0',
      bridge: '#d8443f', bridgeShade: '#a33440',
      bldA: '#a588c9', bldB: '#8a6db6', bldC: '#bb9fd8', bldLight: '#f2d8f0', win: '#7a5fa8', winLit: 0.55,
      grass: '#9bcf9f', grassShade: '#7fb48e', grassDark: '#679a80', fog: '#ffe4f4', path: '#d1b2c8',
      tint: '#ff7fb0', tintA: 0.14,
    },
    night: {
      sky: ['#0f1433', '#171e45', '#212a5a', '#2e3570', '#433f82', '#5d4a8e'],
      cloud: '#4c4c88', cloudShade: '#383a72', sun: '#fff7d6', sunGlow: '#c9c4ff',
      sunX: 150, sunY: 24, sunA: 0, moonA: 1, starA: 1,
      hillFar: '#2a2a5a', hillFar2: '#232350',
      water: ['#4a4386', '#26306a', '#1c2556', '#151b44'], waterHi: '#c9c4ff',
      bridge: '#9a3550', bridgeShade: '#66243e',
      bldA: '#30336a', bldB: '#272a58', bldC: '#3a3f78', bldLight: '#50558f', win: '#1d2045', winLit: 1,
      grass: '#46767a', grassShade: '#3a6266', grassDark: '#2c4c55', fog: '#a3a6dc', path: '#4a4a70',
      tint: '#1b2050', tintA: 0.28,
    },
  };
  const ORDER = ['dawn', 'day', 'sunset', 'night'];

  function autoPhase() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    if (h >= 5.5 && h < 8) return 'dawn';
    if (h >= 8 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'sunset';
    return 'night';
  }

  let mode = 'auto';
  let phase = autoPhase();
  let fromPal = PHASES[phase], toPal = fromPal, trans = 1, pal = fromPal;
  function goPhase(name) { if (name === phase) return; fromPal = pal; toPal = PHASES[name]; phase = name; trans = 0; }

  /* ---------------- static world data ---------------- */
  const R = rng(20230214);
  const stars = Array.from({ length: 85 }, () => ({ x: (R() * W) | 0, y: (R() * 92) | 0, big: R() < 0.12, ph: R() * 6.28, sp: 0.6 + R() * 2.2 }));
  const clouds = [
    { x: 14, y: 16, w: 46, sp: 1.1 }, { x: 118, y: 36, w: 30, sp: 0.8 }, { x: 196, y: 10, w: 58, sp: 1.0 },
    { x: 276, y: 46, w: 34, sp: 1.4 }, { x: -70, y: 62, w: 40, sp: 0.6 },
  ];
  const ripples = Array.from({ length: 46 }, () => ({ x: R() * W, y: HORIZON + 3 + ((R() * 34) | 0), len: 2 + ((R() * 8) | 0), sp: 1 + R() * 3, ph: R() * 6.28 }));
  const gulls = [{ x: 40, y: 58, sp: 6, ph: 0 }, { x: 52, y: 52, sp: 6, ph: 1.3 }, { x: 180, y: 40, sp: 4.5, ph: 0.6 }];

  const backBld = [{ x: 226, w: 10, h: 30 }, { x: 244, w: 8, h: 38 }, { x: 266, w: 9, h: 48 }, { x: 296, w: 9, h: 54 }, { x: 312, w: 8, h: 40 }];
  const frontBld = [{ x: 218, w: 8, h: 16 }, { x: 225, w: 10, h: 24 }, { x: 235, w: 8, h: 19 }, { x: 243, w: 12, h: 31 }, { x: 274, w: 10, h: 35 }, { x: 299, w: 10, h: 43 }, { x: 310, w: 10, h: 28 }];
  [...backBld, ...frontBld].forEach((b) => {
    b.wins = [];
    for (let wy = HORIZON - b.h + 3; wy < HORIZON - 2; wy += 3)
      for (let wx = b.x + 2; wx < b.x + b.w - 2; wx += 3) b.wins.push({ x: wx, y: wy, lit: R() < 0.55, fl: R() });
  });

  const gy = (x) => Math.round(146 + 3 * Math.sin(x * 0.035) + 1.5 * Math.sin(x * 0.11) - (x > 190 ? (x - 190) * 0.06 : 0));
  const tufts = Array.from({ length: 70 }, () => { const x = (R() * W) | 0; return { x, y: gy(x) + 2 + ((R() * (STREET - gy(x) - 3)) | 0) }; });
  const FLOWER_COLORS = ['#ff9ec7', '#fff4a3', '#ffffff', '#c9a7ff', '#ffb38a'];
  const flowers = Array.from({ length: 46 }, () => { const x = (R() * 205) | 0; return { x, y: gy(x) + 2 + ((R() * (STREET - gy(x) - 4)) | 0), c: FLOWER_COLORS[(R() * 5) | 0] }; });

  const HOUSE_COLORS = [['#f6a6c1', '#c9708f'], ['#a8e0c8', '#6fae95'], ['#c7b3ef', '#937cc4'], ['#ffc9a0', '#d4936a'], ['#9fd3f2', '#6aa2c7']];
  const houses = HOUSE_COLORS.map((c, i) => {
    const x = 210 + i * 22, top = STREET - 22;
    const panes = [
      [x + 3, top + 4, 2, 6], [x + 6, top + 4, 2, 6], [x + 13, top + 4, 3, 6],
      [x + 3, top + 14, 2, 6], [x + 6, top + 14, 2, 6], [x + 9, top - 6, 2, 3],
    ];
    return { x, top, col: c[0], roof: c[1], panes, lit: panes.map(() => R() < 0.6) };
  });

  /* ---------------- sprites ---------------- */
  const HIM = [
    '....H.HH.HH.H...',
    '...HHHHHHHHHHH..',
    '..HHhHHhHHhHHHH.',
    '..HhHHhHHhHHhHH.',
    '..HHSSSSSSSSSHH.',
    '..HSSSSSSSSSSSH.',
    '..sSSEeSSSEeSSs.',
    '..sSSEESSSEESSs.',
    '...SCSSSsSSSCS..',
    '...SSSMMMMMSSS..',
    '...SSSSWWWSSSS..',
    '....SMMMMMMMS...',
    '.....sMMMMMs....',
    '......sSSs......',
    '...BBBYGGYBBB...',
    '..BBBBYyYyBBBB..',
    '..BbBBYyYyBBbB..',
    '..BbBBYyYyBBbB..',
    '..SbBBYyYyBBbS..',
    '...BBBYyYyBBB...',
    '....PPPPPPPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '...OOOO..OOOO...',
  ];
  const HER = [
    '................',
    '.....HHHHHH.....',
    '...HHHHHHHhHH...',
    '..HHHHHHHhhHHH..',
    '..HHHFFFFFFHHH..',
    '..HHFFFFFFFFHH..',
    '..HFFEeFFFEeFH..',
    '..HFFEEFFFEEFH..',
    '.GHFCFFFFFFCFHG.',
    '.GHFFFFMMFFFFHG.',
    '..HHFFFFFFFFHH..',
    '..HHHfFFFFfHHH..',
    '..HHHHfFFfHHHH..',
    '..HHHFFFFFFDHH..',
    '..HHFFFFFDDDdH..',
    '..HHFDDDDDDDdH..',
    '..HHFDDDDDDDdH..',
    '..HH.DDDDDDDdF..',
    '..HHFDDDDDDDd...',
    '...HDDDDDDDDDd..',
    '...DDDDDDDDDDd..',
    '....DDDDDDDDd...',
    '.....FF...FF....',
    '.....OO...OO....',
  ];
  const HIM_PAL = { H: '#1a1212', h: '#3b2a26', S: '#c88a60', s: '#a56e4a', E: '#1a1010', e: '#ffffff', C: '#e89a8a', M: '#2a1c18', W: '#ffffff', B: '#34477a', b: '#25345c', Y: '#f8eab0', y: '#e8c96a', G: '#f2c14e', P: '#2f3448', O: '#3a2a2a' };
  const HER_PAL = { H: '#1d1416', h: '#3d2a2e', F: '#c98f6b', f: '#a97556', E: '#1a1010', e: '#ffffff', C: '#ef9c9c', M: '#d9707a', G: '#f2c14e', D: '#f7e6a1', d: '#e3c66e', O: '#d8a85a' };
  const HIM_BLINK = { ...HIM_PAL, E: HIM_PAL.S, e: HIM_PAL.S };
  const HER_BLINK = { ...HER_PAL, E: HER_PAL.F, e: HER_PAL.F };
  const HEART = ['.PP.PP.', 'PPPPPPP', 'PPPPPPP', '.PPPPP.', '..PPP..', '...P...'];
  const HEART_S = ['PP.PP', 'PPPPP', '.PPP.', '..P..'];

  /* ---------------- dynamic state ---------------- */
  let time = 0, last = performance.now();
  const particles = [], rockets = [];
  const shoot = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 };
  let hovered = null, wishes = [], blinkT = 0, autoHeart = 4;
  const fog = { x: 30, y: 84, w: 64 };
  const bottle = { x: 98, y: 134 };

  /* ---------------- drawing: sky ---------------- */
  function drawSky() {
    const bands = pal.sky, bh = HORIZON / bands.length;
    for (let i = 0; i < bands.length; i++) {
      const y0 = Math.round(i * bh), y1 = Math.round((i + 1) * bh);
      rect(0, y0, W, y1 - y0, bands[i]);
      if (i > 0) { // checkerboard dither for that 8-bit gradient feel
        g.fillStyle = bands[i - 1];
        for (let x = 0; x < W; x += 2) { g.fillRect(x, y0, 1, 1); g.fillRect(x + 1, y0 + 2, 1, 1); }
      }
    }
  }

  function drawStars(t) {
    if (pal.starA < 0.02) return;
    for (const s of stars) {
      const a = pal.starA * (0.45 + 0.55 * Math.sin(t * s.sp + s.ph));
      if (a <= 0.02) continue;
      g.globalAlpha = a;
      px(s.x, s.y, '#ffffff');
      if (s.big) { px(s.x - 1, s.y, '#cfd2ff'); px(s.x + 1, s.y, '#cfd2ff'); px(s.x, s.y - 1, '#cfd2ff'); px(s.x, s.y + 1, '#cfd2ff'); }
    }
    // her wishes become permanent pink stars
    wishes.forEach((w, i) => {
      let h = 0; for (let k = 0; k < w.length; k++) h = (h * 31 + w.charCodeAt(k)) | 0;
      const r2 = rng(h + i * 977), x = 8 + ((r2() * 304) | 0), y = 5 + ((r2() * 62) | 0);
      const a = pal.starA * (0.7 + 0.3 * Math.sin(t * 1.5 + i));
      g.globalAlpha = a;
      px(x, y, '#ffffff');
      ['#ff9ed2', '#ff9ed2', '#ff9ed2', '#ff9ed2'].forEach((c, k) => px(x + [1, -1, 0, 0][k], y + [0, 0, 1, -1][k], c));
      g.globalAlpha = a * 0.5;
      [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([dx, dy]) => px(x + dx, y + dy, '#ffc6e6'));
    });
    g.globalAlpha = 1;

    // shooting star
    if (shoot.active) {
      for (let k = 0; k < 10; k++) {
        g.globalAlpha = (1 - k / 10) * Math.min(1, shoot.life);
        px(shoot.x - shoot.vx * k * 0.03, shoot.y - shoot.vy * k * 0.03, k < 2 ? '#ffffff' : '#ffd6f0');
      }
      g.globalAlpha = 1;
    }
  }

  function drawSun(t) {
    const x = pal.sunX, y = pal.sunY + Math.sin(t * 0.4) * 0.6;
    if (pal.sunA > 0.01) {
      g.globalAlpha = 0.18 * pal.sunA; circle(x, y, 18, pal.sunGlow);
      g.globalAlpha = 0.3 * pal.sunA; circle(x, y, 13, pal.sunGlow);
      g.globalAlpha = pal.sunA; circle(x, y, 9, pal.sun);
      g.globalAlpha = 1;
    }
    if (pal.moonA > 0.01) {
      g.globalAlpha = 0.16 * pal.moonA; circle(x, y, 15, '#a9a6ff');
      g.globalAlpha = pal.moonA; circle(x, y, 8, '#fff7d6');
      circle(x - 3, y - 2, 1, '#eadfb6'); circle(x + 2, y + 3, 2, '#eadfb6'); px(x + 3, y - 3, '#eadfb6');
      g.globalAlpha = 1;
    }
  }

  function drawCloud(x, y, w, light, shade) {
    x = Math.round(x);
    const r1 = Math.max(3, Math.round(w * 0.16)), r2 = Math.max(4, Math.round(w * 0.24)), r3 = Math.max(3, Math.round(w * 0.18));
    for (const [c, off] of [[shade, 2], [light, 0]]) {
      circle(x + w * 0.22, y + off, r1, c);
      circle(x + w * 0.48, y - r2 * 0.35 + off, r2, c);
      circle(x + w * 0.76, y + off, r3, c);
      rect(x + w * 0.1, y + off, w * 0.8, r1 + 1, c);
    }
  }

  function drawClouds(dt) {
    for (const c of clouds) {
      c.x += c.sp * dt * 1.4;
      if (c.x > W + 10) c.x = -c.w - 20;
      drawCloud(c.x, c.y, c.w, pal.cloud, pal.cloudShade);
    }
  }

  /* ---------------- drawing: water ---------------- */
  function drawWater(t) {
    const hs = [3, 7, 11, 14];
    let y = HORIZON;
    pal.water.forEach((c, i) => {
      rect(0, y, W, hs[i], c);
      if (i > 0) { g.fillStyle = pal.water[i - 1]; for (let x = 0; x < W; x += 2) g.fillRect(x + ((y >> 1) % 2), y, 1, 1); }
      y += hs[i];
    });
    rect(0, y, W, STREET - y, pal.water[3]);
    for (const r of ripples) {
      const x = ((r.x + t * r.sp) % (W + 20)) - 10;
      g.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.3 + r.ph));
      rect(x, r.y, r.len, 1, pal.waterHi);
    }
    // sun / moon glitter path
    const strength = Math.max(pal.sunA * (pal.sunY > 60 ? 1 : 0.35), pal.moonA * 0.8);
    if (strength > 0.05) {
      for (let k = 0; k < 10; k++) {
        const wy = HORIZON + 1 + k * 3, ww = Math.max(2, 12 - k + 2 * Math.sin(t * 2 + k));
        g.globalAlpha = 0.65 * strength * (1 - k / 14);
        rect(pal.sunX - ww / 2 + Math.sin(t * 1.7 + k) * 1.5, wy, ww, 1, pal.moonA > 0.5 ? '#fff7d6' : pal.sun);
      }
    }
    g.globalAlpha = 1;
  }

  const boat = { x: 0, y: 122 };
  function drawBoat(t) {
    const x = Math.round(((t * 3.2 + 150) % 400) - 40), y = 122 + Math.round(Math.sin(t * 1.5));
    boat.x = x; boat.y = y;
    rect(x, y, 13, 2, '#8a5a48'); rect(x + 1, y + 2, 11, 1, '#6a4038');
    rect(x + 6, y - 13, 1, 13, '#5a4040');
    for (let r = 0; r < 11; r++) rect(x + 7, y - 12 + r, Math.floor(r * 0.5) + 1, 1, '#ffffff');
    for (let r = 0; r < 8; r++) { const w = Math.floor(r * 0.4) + 1; rect(x + 6 - w, y - 9 + r, w, 1, '#ffd6ea'); }
    px(x + 6, y - 14, '#ff8fb8');
  }

  function drawBottle(t) {
    bottle.y = 134 + Math.round(Math.sin(t * 1.8) * 1.2);
    const x = bottle.x, y = bottle.y;
    g.globalAlpha = 0.5; rect(x - 2, y + 6, 9, 1, pal.waterHi); g.globalAlpha = 1;
    rect(x + 1, y - 2, 2, 2, '#b5835a');
    rect(x, y, 4, 6, '#9fe8d8'); rect(x + 1, y + 1, 2, 4, '#ffffff'); px(x + 3, y + 1, '#d9fff6');
  }

  /* ---------------- drawing: the far world (tinted) ---------------- */
  function drawHills() {
    const distant = mix(pal.hillFar2, pal.sky[5], 0.45);
    for (let x = 176; x < W; x++) { const h = Math.round(7 + 3 * Math.sin(x * 0.07) + 2 * Math.sin(x * 0.21)); rect(x, HORIZON - h, 1, h, distant); }
    for (let x = 0; x <= 150; x++) { // Marin Headlands
      const e = x < 108 ? 1 : Math.max(0, (150 - x) / 42);
      const h = (25 + 10 * Math.sin(x * 0.05 + 0.8) + 4 * Math.sin(x * 0.15)) * e;
      const top = Math.round(HORIZON - h), mid = top + Math.round((HORIZON - top) * 0.55);
      rect(x, top, 1, HORIZON - top, pal.hillFar); rect(x, mid, 1, HORIZON - mid, pal.hillFar2);
    }
    for (let x = 128; x < W; x++) { // SF land + Twin Peaks with Sutro
      const h = Math.round(16 * Math.exp(-Math.pow((x - 172) / 17, 2)) + 3);
      rect(x, HORIZON - h, 1, h, pal.hillFar);
    }
  }

  function drawSutro(t) {
    const cx = 172, base = 92, top = 72;
    const band = (y) => (Math.floor((y - 60) / 4) % 2 === 0 ? pal.bridge : pal.bldLight);
    for (let y = top; y <= base; y++) {
      const k = (y - top) / (base - top), off = Math.round(2 + k * 5);
      px(cx - off, y, band(y)); px(cx + off, y, band(y));
    }
    [78, 84, 89].forEach((y) => { const off = Math.round(2 + ((y - top) / (base - top)) * 5); rect(cx - off, y, off * 2 + 1, 1, pal.bldB); });
    rect(cx - 6, top, 13, 1, pal.bldLight); rect(cx - 5, top + 1, 11, 1, pal.bldB);
    [-5, 0, 5].forEach((dx) => { for (let y = top - 11; y < top; y++) px(cx + dx, y, band(y)); });
  }

  function drawBridge() {
    const c = pal.bridge, s = pal.bridgeShade, deckY = 94;
    rect(0, deckY, 138, 2, c); rect(0, deckY + 2, 138, 1, s);
    for (let x = 0; x < 138; x += 3) { px(x, deckY + 3, s); px(x + 1, deckY + 4, s); }
    // main cable (between towers) + suspenders
    const cable = (x) => {
      if (x <= 33) { const u = (33 - x) / 33; return 45 + 37 * u + 8 * u * (1 - u); }
      if (x >= 103) { const u = (x - 103) / 35; return 45 + 48 * u + 8 * u * (1 - u); }
      const tt = (x - 68) / 35; return 45 + 43 * (1 - tt * tt);
    };
    let py = cable(0);
    for (let x = 0; x <= 138; x++) {
      const y = Math.round(cable(x));
      line(x, Math.min(py, y), x, Math.max(py, y), c); py = y;
      if (x % 3 === 0 && y < deckY - 1) { g.globalAlpha = 0.55; rect(x, y + 1, 1, deckY - y - 1, s); g.globalAlpha = 1; }
    }
    // towers
    for (const tx of [30, 100]) {
      rect(tx, 42, 2, HORIZON - 42, c); rect(tx + 4, 42, 2, HORIZON - 42, c);
      rect(tx + 1, 44, 1, HORIZON - 44, s); rect(tx + 5, 44, 1, HORIZON - 44, s);
      [44, 54, 66, 80].forEach((y) => rect(tx, y, 6, 2, c));
      rect(tx - 1, 41, 8, 1, c); rect(tx, 40, 2, 1, c); rect(tx + 4, 40, 2, 1, c);
    }
    bridgeCable = cable;
  }
  let bridgeCable = () => 60;

  function drawCity() {
    for (const b of backBld) { rect(b.x, HORIZON - b.h, b.w, b.h, pal.bldB); for (const w of b.wins) px(w.x, w.y, pal.win); }
    // Transamerica Pyramid
    const cx = 265, start = 44;
    rect(cx, 33, 1, start - 33, pal.bldLight);
    for (let y = start; y < HORIZON; y++) {
      const hw = 1 + Math.floor(((y - start) / (HORIZON - start)) * 6.5), wing = y >= 58 && y <= 70 ? 1 : 0;
      rect(cx - hw - wing, y, hw + wing, 1, pal.bldLight);
      rect(cx, y, hw + wing + 1, 1, pal.bldC);
      if (y % 3 === 0 && hw > 2) for (let x = cx - hw + 1; x < cx + hw; x += 2) px(x, y, pal.win);
    }
    for (const b of frontBld) {
      rect(b.x, HORIZON - b.h, b.w, b.h, pal.bldA);
      rect(b.x + b.w - 2, HORIZON - b.h, 2, b.h, pal.bldB);
      rect(b.x, HORIZON - b.h, b.w, 1, pal.bldC);
      for (const w of b.wins) px(w.x, w.y, pal.win);
    }
    // Salesforce Tower
    const sx = 284, sw = 14, top = 28;
    for (let y = top; y < HORIZON; y++) { const ins = y - top < 4 ? [4, 2, 1, 0][y - top] : 0; rect(sx + ins, y, sw - ins * 2, 1, pal.bldC); }
    for (let i = 2; i < sw - 1; i += 3) rect(sx + i, top + 7, 1, HORIZON - top - 7, pal.bldB);
    rect(sx + 1, top + 6, sw - 2, 1, pal.bldB);
    // Telegraph Hill + Coit Tower
    for (let x = 194; x < 238; x++) { const h = Math.round(13 * Math.exp(-Math.pow((x - 214) / 11, 2))); if (h > 0) rect(x, HORIZON - h, 1, h, pal.grassDark); }
    [[205, 101, 3], [222, 100, 3], [209, 98, 2], [226, 103, 2]].forEach(([x, y, r]) => circle(x, y, r, pal.grassShade));
    rect(211, 77, 5, 20, pal.bldLight); rect(214, 77, 2, 20, pal.bldC);
    rect(210, 74, 7, 3, pal.bldLight); for (let x = 210; x < 217; x += 2) px(x, 73, pal.bldLight);
    for (let x = 211; x < 216; x += 2) px(x, 75, pal.win);
  }

  function drawWorldLights(t) {
    const lit = pal.winLit;
    if (lit < 0.03) return;
    for (const b of [...backBld, ...frontBld]) for (const w of b.wins) {
      if (!w.lit) continue;
      const flick = w.fl < 0.06 ? (Math.sin(t * 3 + w.fl * 100) > 0 ? 1 : 0.2) : 1;
      g.globalAlpha = lit * flick * 0.9; px(w.x, w.y, '#ffe39a');
    }
    // Salesforce crown light show
    const sx = 284, top = 28;
    for (let y = top; y < top + 7; y++) {
      const ins = y - top < 4 ? [4, 2, 1, 0][y - top] : 0;
      g.globalAlpha = lit * 0.75; rect(sx + ins, y, 14 - ins * 2, 1, `hsl(${(t * 30 + y * 14) % 360},85%,78%)`);
    }
    // bridge necklace lights
    g.globalAlpha = lit;
    for (let x = 3; x < 138; x += 6) px(x, Math.round(bridgeCable(x)), '#ffe9b0');
    for (let x = 1; x < 138; x += 4) px(x, 93, '#ffd27a');
    const blink = Math.sin(t * 3) > 0 ? 1 : 0.15;
    g.globalAlpha = lit * blink;
    [30, 35, 100, 105].forEach((x) => px(x, 39, '#ff4d5e'));
    [167, 172, 177].forEach((x) => px(x, 60, '#ff4d5e'));
    px(213, 72, '#ff9ec0'); px(265, 32, '#ff4d5e');
    g.globalAlpha = 1;
  }

  function drawFog(t, dt) {
    fog.x = 26 + Math.sin(t * 0.05) * 22;
    fog.y = 84 + Math.round(Math.sin(t * 0.21));
    const a = 0.62 + 0.18 * Math.sin(t * 0.13);
    g.globalAlpha = a * 0.7;
    drawCloud(fog.x + 40, fog.y + 6, 36, pal.fog, pal.fog);
    g.globalAlpha = a;
    drawCloud(fog.x, fog.y, fog.w, pal.fog, mix(pal.fog, pal.cloudShade, 0.4));
    // Karl's little face ^_^
    g.globalAlpha = Math.min(1, a + 0.2);
    const fx = Math.round(fog.x + fog.w * 0.48), fy = Math.round(fog.y - 2);
    const blink = (t % 5) < 0.15;
    if (blink) { rect(fx - 5, fy, 2, 1, '#5a4a7a'); rect(fx + 4, fy, 2, 1, '#5a4a7a'); }
    else { rect(fx - 5, fy - 1, 2, 2, '#5a4a7a'); rect(fx + 4, fy - 1, 2, 2, '#5a4a7a'); }
    px(fx - 7, fy + 2, '#ffa6c9'); px(fx + 7, fy + 2, '#ffa6c9');
    px(fx - 1, fy + 2, '#5a4a7a'); px(fx, fy + 3, '#5a4a7a'); px(fx + 1, fy + 2, '#5a4a7a');
    g.globalAlpha = 1;
  }

  /* ---------------- drawing: foreground (tinted) ---------------- */
  function drawGround() {
    const hi = mix(pal.grass, '#ffffff', 0.25);
    for (let x = 0; x < W; x++) {
      const top = gy(x);
      rect(x, top, 1, STREET - top, pal.grass);
      rect(x, top + 9, 1, Math.max(0, STREET - top - 9), pal.grassShade);
      px(x, top, hi);
    }
    for (const tf of tufts) { px(tf.x, tf.y, pal.grassDark); px(tf.x + 1, tf.y - 1, pal.grassDark); }
    for (const f of flowers) { px(f.x, f.y, f.c); px(f.x, f.y + 1, pal.grassDark); }
    const dark = mix(pal.path, '#000000', 0.22);
    rect(0, STREET, W, H - STREET, pal.path);
    rect(0, STREET, W, 1, mix(pal.path, '#ffffff', 0.3));
    rect(0, STREET + 3, W, 1, dark); rect(0, STREET + 6, W, 1, dark);
    for (let x = 4; x < W; x += 10) rect(x, STREET + 4, 4, 1, mix(pal.path, '#000000', 0.1));
  }

  function drawCypress() {
    const bx = 90, by = gy(90);
    line(bx, by, bx + 3, by - 10, '#6b4a3a'); line(bx + 1, by, bx + 4, by - 10, '#6b4a3a');
    line(bx + 3, by - 10, bx - 3, by - 14, '#6b4a3a'); line(bx + 3, by - 10, bx + 10, by - 15, '#6b4a3a');
    [[84, -16, 4], [92, -18, 5], [101, -17, 4], [108, -15, 3]].forEach(([x, dy, r]) => circle(x, by + dy, r, '#3f7350'));
    [[85, -18, 3], [92, -20, 4], [101, -19, 3]].forEach(([x, dy, r]) => circle(x, by + dy, r, '#4f8a5f'));
    [[90, -22], [99, -21], [86, -20]].forEach(([x, dy]) => px(x, by + dy, '#6eaa76'));
  }

  function drawVictorian(h) {
    const x = h.x, top = h.top, w = 20, trim = '#fff6f0';
    rect(x, top, w, STREET - top, h.col);
    for (let r = 0; r < 11; r++) { const hw = 11 - r; if (hw <= 0) break; rect(x + 10 - hw, top - 1 - r, hw * 2, 1, h.roof); }
    rect(x - 1, top - 1, w + 2, 1, trim);
    rect(x + 8, top - 7, 4, 5, trim);
    rect(x + 2, top + 3, 7, 8, trim); rect(x + 12, top + 3, 5, 8, trim);
    rect(x + 2, top + 13, 7, 8, trim);
    rect(x, top + 12, w, 1, trim);
    rect(x + 12, STREET - 9, 5, 9, trim); rect(x + 13, STREET - 8, 3, 8, h.roof);
    rect(x + 11, STREET - 1, 7, 1, trim);
    for (const p of h.panes) rect(p[0], p[1], p[2], p[3], '#6f7fb5');
    px(x + 15, STREET - 4, '#f2c14e');
  }

  function drawHouseLights() {
    if (pal.winLit < 0.03) return;
    g.globalAlpha = pal.winLit * 0.9;
    for (const h of houses) h.panes.forEach((p, i) => { if (h.lit[i]) rect(p[0], p[1], p[2], p[3], '#ffd98a'); });
    g.globalAlpha = 1;
  }

  function drawCableCar(t) {
    const x = 9, base = STREET + 2, top = base - 21, w = 44;
    const bob = hovered && hovered.id === 'cablecar' ? Math.round(Math.sin(t * 12)) : 0;
    const y = top + bob;
    rect(x + 2, y - 1, w - 4, 1, '#6b2f36');
    rect(x, y, w, 2, '#8a3a42');
    rect(x, y + 2, w, 8, '#f6e7c8');
    for (let i = 0; i < 6; i++) rect(x + 3 + i * 7, y + 3, 5, 6, '#8fb7e0');
    rect(x + 3, y + 6, 2, 3, '#e07a8a'); rect(x + 24, y + 5, 2, 4, '#7a8ae0'); // tiny passengers
    rect(x, y + 10, w, 8, '#c9433f');
    rect(x, y + 12, w, 1, '#f2c14e');
    rect(x + 18, y + 14, 8, 3, '#f2c14e'); rect(x + 19, y + 15, 6, 1, '#c9433f');
    rect(x - 1, y + 18, w + 2, 1, '#6b2f36');
    rect(x + 5, base - 2, 5, 2, '#3a2f3a'); rect(x + w - 10, base - 2, 5, 2, '#3a2f3a');
    rect(x + 21, y - 3, 3, 2, '#f2c14e');
    rect(x + w - 1, y + 13, 2, 2, '#fff2b0');
  }

  function drawCablecarLights(t) {
    if (pal.winLit < 0.03) return;
    const x = 9, y = STREET + 2 - 21;
    g.globalAlpha = pal.winLit * 0.85;
    for (let i = 0; i < 6; i++) rect(x + 3 + i * 7, y + 3, 5, 6, '#ffe7a3');
    g.globalAlpha = pal.winLit * 0.35; circle(x + 44, y + 14, 4, '#fff2b0');
    g.globalAlpha = 1;
  }

  function drawPicnic() {
    for (let y = 166; y < 172; y++) for (let x = 110; x < 172; x++) {
      const on = ((x >> 1) + (y >> 1)) % 2 === 0;
      px(x - (171 - y) * 0, y, on ? '#f7a8c8' : '#fff4fa');
    }
    rect(112, 161, 9, 5, '#c08a5a'); rect(113, 162, 7, 1, '#9a6a44');
    line(113, 161, 115, 158, '#9a6a44'); line(119, 161, 117, 158, '#9a6a44'); rect(115, 158, 3, 1, '#9a6a44');
    px(114, 160, '#ff6b81'); px(118, 160, '#ffd35c');
    // lantern
    rect(165, 160, 5, 6, '#4a3a4a'); rect(166, 161, 3, 4, '#ffe39a'); rect(166, 158, 3, 2, '#4a3a4a');
  }

  function drawCouple(t) {
    blinkT -= 1 / 60;
    const blink = (t % 4.2) < 0.13, blink2 = ((t + 1.7) % 5.1) < 0.13;
    const b1 = Math.floor(t * 1.1) % 2, b2 = Math.floor(t * 1.1 + 0.5) % 2;
    g.globalAlpha = 0.25; rect(127, 170, 30, 2, '#3a2a4a'); g.globalAlpha = 1;
    sprite(HIM, blink ? HIM_BLINK : HIM_PAL, 126, 146 + b1);
    sprite(HER, blink2 ? HER_BLINK : HER_PAL, 140, 146 + b2);
  }

  function drawLantern(t) {
    if (pal.winLit < 0.03) return;
    const f = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.1);
    g.globalAlpha = pal.winLit * 0.12 * f; circle(167, 163, 22, '#ffd98a');
    g.globalAlpha = pal.winLit * 0.18 * f; circle(167, 163, 12, '#ffe39a');
    g.globalAlpha = pal.winLit * f; rect(166, 161, 3, 4, '#fff2b0');
    g.globalAlpha = 1;
  }

  function drawGulls(t, dt) {
    const a = 1 - pal.starA;
    if (a < 0.05) return;
    g.globalAlpha = a;
    for (const gl of gulls) {
      gl.x += gl.sp * dt; if (gl.x > W + 10) { gl.x = -10; gl.y = 35 + Math.random() * 35; }
      const y = Math.round(gl.y + Math.sin(t * 0.8 + gl.ph) * 3), x = Math.round(gl.x), up = Math.floor(t * 4 + gl.ph) % 2;
      const c = '#fdfbff';
      px(x, y, c); px(x - 1, y, c); px(x + 1, y, c);
      px(x - 2, y + (up ? -1 : 1), c); px(x + 2, y + (up ? -1 : 1), c);
    }
    g.globalAlpha = 1;
  }

  /* ---------------- particles: hearts & fireworks ---------------- */
  const HEART_COLORS = ['#ff7eb3', '#ff9ec7', '#f15b80', '#c9a7ff', '#ffb3d1'];
  function burstHearts(x, y, n = 10) {
    for (let i = 0; i < n; i++) particles.push({ type: 'heart', x, y, vx: (Math.random() - 0.5) * 30, vy: -15 - Math.random() * 25, life: 1.6 + Math.random(), c: HEART_COLORS[(Math.random() * 5) | 0], small: Math.random() < 0.6 });
  }
  function fireworks(n = 7) {
    for (let i = 0; i < n; i++) setTimeout(() => {
      rockets.push({ x: 60 + Math.random() * 200, y: HORIZON, vy: -60 - Math.random() * 25, fuse: 0.7 + Math.random() * 0.5, c: HEART_COLORS[(Math.random() * 5) | 0] });
      window.SFAudio && SFAudio.sfx.whoosh();
    }, i * 450);
  }
  function updateParticles(dt) {
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.y += r.vy * dt; r.fuse -= dt;
      particles.push({ type: 'spark', x: r.x, y: r.y, vx: 0, vy: 4, life: 0.4, c: '#fff2b0' });
      if (r.fuse <= 0) {
        rockets.splice(i, 1);
        window.SFAudio && SFAudio.sfx.boom();
        const heartShape = Math.random() < 0.5;
        for (let k = 0; k < 36; k++) {
          const a = (k / 36) * Math.PI * 2;
          let vx = Math.cos(a), vy = Math.sin(a);
          if (heartShape) { vx = 16 * Math.pow(Math.sin(a), 3) / 16; vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16; }
          particles.push({ type: 'spark', x: r.x, y: r.y, vx: vx * 34, vy: vy * 34, life: 1.4 + Math.random() * 0.4, c: k % 3 ? r.c : '#ffffff', grav: 12 });
        }
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'heart') { p.vx *= 0.97; p.vy += 4 * dt; p.x += Math.sin(p.life * 5) * 0.2; }
      else { p.vx *= 0.98; p.vy = p.vy * 0.98 + (p.grav || 0) * dt; }
    }
  }
  function drawParticles() {
    for (const p of particles) {
      g.globalAlpha = Math.min(1, p.life);
      if (p.type === 'heart') sprite(p.small ? HEART_S : HEART, { P: p.c }, Math.round(p.x), Math.round(p.y));
      else px(p.x, p.y, p.c);
    }
    for (const r of rockets) { g.globalAlpha = 1; px(r.x, r.y, '#ffffff'); }
    g.globalAlpha = 1;
  }

  /* ---------------- clickable regions ---------------- */
  const regions = [
    { id: 'wish', label: 'Catch the shooting star ✦ make a wish', anchor: () => [shoot.x, shoot.y - 4], box: () => (shoot.active ? [shoot.x - 8, shoot.y - 8, 18, 18] : null), hint: false },
    { id: 'note', label: 'Message in a bottle 💌', anchor: () => [bottle.x + 2, bottle.y - 5], box: () => [bottle.x - 4, bottle.y - 8, 12, 16] },
    { id: 'games', label: 'Sailboat · daily games 🎮', anchor: () => [boat.x + 7, boat.y - 17], box: () => (boat.x > -14 && boat.x < W ? [boat.x - 1, boat.y - 15, 15, 19] : null) },
    { id: 'couple', label: 'Us ♥ (click for a reason I love you)', anchor: () => [141, 141], box: () => [126, 144, 30, 28] },
    { id: 'study', label: 'Cable car · study timer 🍅', anchor: () => [31, 145], box: () => [7, 148, 48, 26] },
    { id: 'memories', label: 'Painted Ladies · our memories 📸', anchor: () => [264, 124], box: () => [208, 128, 112, 44] },
    { id: 'breathe', label: 'Karl the Fog · breathe with me ☁', anchor: () => [fog.x + fog.w / 2, fog.y - 14], box: () => [fog.x - 2, fog.y - 14, fog.w + 4, 20] },
    { id: 'us', label: 'Coit Tower · our days together', anchor: () => [213, 69], box: () => [204, 70, 20, 30] },
    { id: 'music', label: 'Sutro Tower · our radio 📻', anchor: () => [172, 57], box: () => [163, 58, 19, 36] },
    { id: 'letters', label: 'Downtown · open-when letters ✉', anchor: () => [291, 24], box: () => [238, 26, 82, 82] },
    { id: 'sun', label: () => (pal.moonA > 0.5 ? 'The moon · change the sky' : 'The sun · change the sky'), anchor: () => [pal.sunX, pal.sunY - 13], box: () => [pal.sunX - 10, pal.sunY - 10, 20, 20] },
    { id: 'quotes', label: 'Golden Gate · our quotes 💬', anchor: () => [68, 36], box: () => [0, 38, 140, 70] },
    { id: 'wish', label: 'Make a wish on the stars ✦', anchor: () => [0, 0], box: () => (pal.starA > 0.5 ? [0, 0, W, 92] : null), hint: false },
  ];

  function drawHints(t) {
    regions.forEach((r, i) => {
      if (r.hint === false || !r.box()) return;
      const isHover = hovered === r;
      const ph = (t + i * 1.37) % 7;
      if (!isHover && ph > 0.9) return;
      const [ax, ay] = r.anchor();
      if (isHover) {
        const by = Math.round(ay - 3 + Math.sin(t * 6) * 1.5);
        sprite(HEART_S, { P: '#ffffff' }, Math.round(ax) - 2, by - 1);
        sprite(HEART_S, { P: '#ff6f9f' }, Math.round(ax) - 2, by);
      } else {
        const s = Math.sin((ph / 0.9) * Math.PI), len = s > 0.6 ? 2 : 1;
        g.globalAlpha = s;
        px(ax, ay, '#ffffff');
        for (let k = 1; k <= len; k++) { px(ax - k, ay, '#fff6c8'); px(ax + k, ay, '#fff6c8'); px(ax, ay - k, '#fff6c8'); px(ax, ay + k, '#fff6c8'); }
        g.globalAlpha = 1;
      }
    });
  }

  /* ---------------- main loop ---------------- */
  let frame = 0, onRegion = () => {}, onPhase = () => {};
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt; frame++;
    if (trans < 1) { trans = Math.min(1, trans + dt / 2.5); const e = trans * trans * (3 - 2 * trans); pal = mixPal(fromPal, toPal, e); }
    else pal = toPal;
    if (mode === 'auto' && frame % 600 === 0) { const p = autoPhase(); if (p !== phase) { goPhase(p); onPhase(phase, mode); } }

    // shooting stars
    if (!shoot.active && pal.starA > 0.5 && Math.random() < dt / 9) {
      Object.assign(shoot, { active: true, x: 40 + Math.random() * 220, y: 6 + Math.random() * 25, vx: 70 + Math.random() * 40, vy: 28 + Math.random() * 15, life: 1.6 });
    }
    if (shoot.active) { shoot.x += shoot.vx * dt * 0.5; shoot.y += shoot.vy * dt * 0.5; shoot.life -= dt * 0.55; if (shoot.life <= 0 || shoot.y > 90) shoot.active = false; }
    autoHeart -= dt; if (autoHeart <= 0) { autoHeart = 6 + Math.random() * 5; burstHearts(141, 142, 1); }

    g = ctx;
    drawSky(); drawStars(time); drawSun(time); drawClouds(dt); drawWater(time);

    // far world → tinted layer
    g = lctx; lctx.clearRect(0, 0, W, H);
    drawHills(); drawSutro(time); drawCity(); drawBridge();
    tintLayer();
    g = ctx; ctx.drawImage(layer, 0, 0);
    drawWorldLights(time); drawBoat(time); drawBottle(time); drawFog(time, dt); drawGulls(time, dt);

    // foreground → tinted layer
    g = lctx; lctx.clearRect(0, 0, W, H);
    drawGround(); drawCypress(); houses.forEach(drawVictorian); drawPicnic(); drawCableCar(time); drawCouple(time);
    tintLayer();
    g = ctx; ctx.drawImage(layer, 0, 0);
    drawHouseLights(); drawCablecarLights(time); drawLantern(time);

    updateParticles(dt); drawParticles(); drawHints(time);

    if (frame % 15 === 0) {
      const st = document.documentElement.style;
      st.setProperty('--sky-top', pal.sky[0]); st.setProperty('--sky-mid', pal.sky[3]); st.setProperty('--ground', pal.path);
    }
    requestAnimationFrame(step);
  }
  function tintLayer() {
    if (pal.tintA < 0.01) return;
    lctx.globalCompositeOperation = 'source-atop';
    lctx.globalAlpha = pal.tintA; lctx.fillStyle = pal.tint; lctx.fillRect(0, 0, W, H);
    lctx.globalAlpha = 1; lctx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- input ---------------- */
  const tip = document.getElementById('tip');
  function toScene(e) { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; }
  function hit(x, y) { for (const r of regions) { const b = r.box(); if (b && x >= b[0] && x < b[0] + b[2] && y >= b[1] && y < b[1] + b[3]) return r; } return null; }
  function labelOf(r) { return typeof r.label === 'function' ? r.label() : r.label; }
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const p = toScene(e), r = hit(p.x, p.y);
    if (r !== hovered && r && window.SFAudio) SFAudio.sfx.blip();
    hovered = r; canvas.style.cursor = r ? 'pointer' : 'default';
    if (r && tip) { tip.textContent = labelOf(r); tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; tip.classList.add('show'); }
    else if (tip) tip.classList.remove('show');
  });
  canvas.addEventListener('pointerleave', () => { hovered = null; tip && tip.classList.remove('show'); });
  canvas.addEventListener('click', (e) => {
    const p = toScene(e), r = hit(p.x, p.y);
    if (!r) return;
    if (r.id === 'couple') burstHearts(p.x, p.y - 4, 9);
    if (r.id === 'wish' && shoot.active) { shoot.active = false; burstHearts(p.x, p.y, 4); }
    onRegion(r.id, { x: p.x, y: p.y });
  });

  /* ---------------- public API ---------------- */
  window.Scene = {
    W, H,
    onRegion(cb) { onRegion = cb; },
    onPhase(cb) { onPhase = cb; },
    getPhase: () => phase,
    getMode: () => mode,
    setMode(m) { mode = m; goPhase(m === 'auto' ? autoPhase() : m); onPhase(phase, mode); },
    cycleMode() { const list = ['auto', ...ORDER], i = list.indexOf(mode); this.setMode(list[(i + 1) % list.length]); },
    nextPhase() { const i = ORDER.indexOf(phase); mode = ORDER[(i + 1) % 4]; goPhase(mode); onPhase(phase, mode); },
    burstHearts, fireworks,
    burstAt(id) { const r = regions.find((x) => x.id === id); if (r) { const [x, y] = r.anchor(); burstHearts(x, y + 6, 8); } },
    setWishes(list) { wishes = list.slice(); },
    drawCouple(target, scale) { // used by the welcome screen
      const c2 = target.getContext('2d'); target.width = 34 * scale; target.height = 26 * scale;
      c2.imageSmoothingEnabled = false;
      const tmp = document.createElement('canvas'); tmp.width = 34; tmp.height = 26; const t2 = tmp.getContext('2d');
      sprite(HIM, HIM_PAL, 1, 1, t2); sprite(HER, HER_PAL, 16, 1, t2);
      c2.drawImage(tmp, 0, 0, 34 * scale, 26 * scale);
    },
    sprite,
  };
  requestAnimationFrame((n) => { last = n; step(n); });
})();

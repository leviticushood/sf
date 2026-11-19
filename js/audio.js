/* =====================================================================
   audio.js: tiny chiptune synth, ambient sounds & sound effects.
   Everything is generated live with the Web Audio API (no files needed).
   ===================================================================== */
(function () {
  'use strict';

  let ac = null, master, musicIn, musicBus, ambBus, sfxBus;

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 1.25; master.connect(ac.destination);

      // music: soft low-pass + a gentle echo so the square waves feel cozy
      musicBus = ac.createGain(); musicBus.gain.value = 0.45; musicBus.connect(master);
      musicIn = ac.createBiquadFilter(); musicIn.type = 'lowpass'; musicIn.frequency.value = 2400; musicIn.Q.value = 0.2;
      musicIn.connect(musicBus);
      const delay = ac.createDelay(1); delay.delayTime.value = 0.36;
      const fb = ac.createGain(); fb.gain.value = 0.28;
      const wet = ac.createGain(); wet.gain.value = 0.3;
      musicIn.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(musicBus);

      ambBus = ac.createGain(); ambBus.gain.value = 0.55; ambBus.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.45; sfxBus.connect(master);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone({ freq, time, dur, type = 'square', vol = 0.08, attack = 0.012, release = 0.12, dest, slideTo }) {
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, time + dur);
    gn.gain.setValueAtTime(0.0001, time);
    gn.gain.linearRampToValueAtTime(vol, time + attack);
    gn.gain.linearRampToValueAtTime(vol * 0.6, time + Math.max(attack + 0.01, dur));
    gn.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);
    o.connect(gn); gn.connect(dest || musicIn);
    o.start(time); o.stop(time + dur + release + 0.05);
  }

  /* ---------- noise ---------- */
  const buffers = {};
  function noiseBuffer(kind) {
    if (buffers[kind]) return buffers[kind];
    const len = ac.sampleRate * 3, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w;
      else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
    return (buffers[kind] = b);
  }
  function noiseSrc(kind) { const s = ac.createBufferSource(); s.buffer = noiseBuffer(kind); s.loop = true; return s; }
  function filt(type, freq, q) { const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q != null) f.Q.value = q; return f; }

  /* ---------- ambient soundscapes ---------- */
  const AMBIENT = {
    waves: () => {
      const s = noiseSrc('brown'), lp = filt('lowpass', 650), gn = ac.createGain();
      gn.gain.value = 0.45;
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 0.085; lg.gain.value = 0.38; lfo.connect(lg); lg.connect(gn.gain);
      s.connect(lp); lp.connect(gn);
      return { out: gn, srcs: [s, lfo] };
    },
    rain: () => {
      const s = noiseSrc('pink'), hp = filt('highpass', 450), lp = filt('lowpass', 5200), gn = ac.createGain();
      gn.gain.value = 0.42; s.connect(hp); hp.connect(lp); lp.connect(gn);
      return { out: gn, srcs: [s] };
    },
    wind: () => {
      const s = noiseSrc('white'), bp = filt('bandpass', 420, 0.8), gn = ac.createGain();
      gn.gain.value = 0.16;
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 0.06; lg.gain.value = 260; lfo.connect(lg); lg.connect(bp.frequency);
      s.connect(bp); bp.connect(gn);
      return { out: gn, srcs: [s, lfo] };
    },
    cafe: () => { // a warm murmur, like a cozy café in the Mission
      const s = noiseSrc('pink'), bp = filt('bandpass', 700, 1.4), gn = ac.createGain();
      gn.gain.value = 0.32;
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 0.23; lg.gain.value = 0.08; lfo.connect(lg); lg.connect(gn.gain);
      s.connect(bp); bp.connect(gn);
      return { out: gn, srcs: [s, lfo] };
    },
  };
  const ambOn = {};
  let foghornTimer = null;

  function playFoghorn() {
    if (!ac) return;
    const t = ac.currentTime + 0.05, lp = filt('lowpass', 380), gn = ac.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(0.22, t + 0.5);
    gn.gain.setValueAtTime(0.22, t + 2.0);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
    lp.connect(gn); gn.connect(ambBus);
    [92, 138.5].forEach((f) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 3.6); });
  }

  function setAmbient(name, on) {
    if (!ensure()) return;
    if (name === 'foghorn') {
      if (on && !foghornTimer) { setTimeout(playFoghorn, 1500); foghornTimer = setInterval(playFoghorn, 32000); ambOn.foghorn = true; }
      if (!on && foghornTimer) { clearInterval(foghornTimer); foghornTimer = null; delete ambOn.foghorn; }
      return;
    }
    if (on && !ambOn[name]) {
      const a = AMBIENT[name](), fade = ac.createGain();
      fade.gain.setValueAtTime(0.0001, ac.currentTime);
      fade.gain.exponentialRampToValueAtTime(1, ac.currentTime + 2);
      a.out.connect(fade); fade.connect(ambBus);
      a.srcs.forEach((s) => s.start());
      ambOn[name] = { ...a, fade };
    } else if (!on && ambOn[name]) {
      const a = ambOn[name]; delete ambOn[name];
      a.fade.gain.setValueAtTime(a.fade.gain.value, ac.currentTime);
      a.fade.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2);
      setTimeout(() => { a.srcs.forEach((s) => { try { s.stop(); } catch (e) { /* already stopped */ } }); a.fade.disconnect(); }, 1400);
    }
  }

  /* ---------- sound effects ---------- */
  const sfx = {
    ding() { if (!ensure()) return; const t = ac.currentTime; [0, 0.28].forEach((d) => { tone({ freq: 1568, time: t + d, dur: 0.05, type: 'triangle', vol: 0.3, release: 0.7, dest: sfxBus }); tone({ freq: 3136, time: t + d, dur: 0.03, type: 'sine', vol: 0.08, release: 0.4, dest: sfxBus }); }); },
    chime() { if (!ensure()) return; const t = ac.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => tone({ freq: mtof(m), time: t + i * 0.13, dur: 0.12, type: 'square', vol: 0.12, release: 0.5, dest: sfxBus })); },
    pop() { if (!ensure()) return; tone({ freq: 660, slideTo: 1320, time: ac.currentTime, dur: 0.08, type: 'square', vol: 0.1, release: 0.06, dest: sfxBus }); },
    blip() { if (!ensure()) return; tone({ freq: 988, time: ac.currentTime, dur: 0.04, type: 'square', vol: 0.06, release: 0.04, dest: sfxBus }); },
    open() { if (!ensure()) return; const t = ac.currentTime; tone({ freq: 784, time: t, dur: 0.05, type: 'square', vol: 0.07, release: 0.05, dest: sfxBus }); tone({ freq: 1175, time: t + 0.06, dur: 0.06, type: 'square', vol: 0.07, release: 0.08, dest: sfxBus }); },
    close() { if (!ensure()) return; const t = ac.currentTime; tone({ freq: 1175, time: t, dur: 0.05, type: 'square', vol: 0.06, release: 0.05, dest: sfxBus }); tone({ freq: 784, time: t + 0.06, dur: 0.06, type: 'square', vol: 0.06, release: 0.08, dest: sfxBus }); },
    sparkle() { if (!ensure()) return; const t = ac.currentTime; [84, 88, 91, 96, 100].forEach((m, i) => tone({ freq: mtof(m), time: t + i * 0.07, dur: 0.05, type: 'triangle', vol: 0.12, release: 0.3, dest: sfxBus })); },
    whoosh() { if (!ensure()) return; const s = noiseSrc('white'), bp = filt('bandpass', 400, 1), gn = ac.createGain(), t = ac.currentTime; bp.frequency.exponentialRampToValueAtTime(3000, t + 0.6); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(0.2, t + 0.2); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); s.connect(bp); bp.connect(gn); gn.connect(sfxBus); s.start(t); s.stop(t + 0.9); },
    boom() { if (!ensure()) return; const s = noiseSrc('brown'), lp = filt('lowpass', 500), gn = ac.createGain(), t = ac.currentTime; gn.gain.setValueAtTime(0.5, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); s.connect(lp); lp.connect(gn); gn.connect(sfxBus); s.start(t); s.stop(t + 1.3); },
  };


  /* =====================================================================
     8-BIT SONGBOOK: original chiptunes written in the styles Isa loves.
     Each song is described by its chords, groove and instruments; the
     melody is composed from those chords with a fixed seed, so it is the
     same tune every time it plays.
     ===================================================================== */
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- instruments ---------- */
  const pulseCache = {};
  function pulseWave(duty) {
    if (pulseCache[duty]) return pulseCache[duty];
    const n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(Math.PI * k * duty);
    return (pulseCache[duty] = ac.createPeriodicWave(re, im));
  }
  function voice(o) {
    const end = o.time + o.dur, osc = ac.createOscillator(), g = ac.createGain();
    if (o.wave === 'pulse25' || o.wave === 'pulse12') osc.setPeriodicWave(pulseWave(o.wave === 'pulse25' ? 0.25 : 0.125));
    else osc.type = o.wave;
    const f = mtof(o.midi);
    if (o.glideFrom) { osc.frequency.setValueAtTime(mtof(o.glideFrom), o.time); osc.frequency.exponentialRampToValueAtTime(f, o.time + 0.09); }
    else osc.frequency.setValueAtTime(f, o.time);
    if (o.detune) osc.detune.value = o.detune;
    const a = o.attack || 0.008;
    g.gain.setValueAtTime(0.0001, o.time);
    g.gain.linearRampToValueAtTime(o.vol, o.time + a);
    if (o.pluck) g.gain.setTargetAtTime(0.0001, o.time + a, o.pluck / 3);
    else g.gain.linearRampToValueAtTime(o.vol * 0.75, Math.max(o.time + a + 0.01, end));
    g.gain.setTargetAtTime(0.0001, Math.max(o.time + a + 0.01, end), o.release || 0.04);
    if (o.vib && o.dur > 0.3) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = 5.4; lg.gain.setValueAtTime(0, o.time); lg.gain.linearRampToValueAtTime(o.vib, o.time + Math.min(0.4, o.dur));
      l.connect(lg); lg.connect(osc.detune); l.start(o.time); l.stop(end + 0.4);
    }
    osc.connect(g); g.connect(o.dest || musicIn);
    osc.start(o.time); osc.stop(end + (o.release || 0.04) * 6 + 0.05);
  }
  const INST = {
    square: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'square', vol: 0.045 * v, vib: 12, release: 0.08 }),
    pulse25: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'pulse25', vol: 0.06 * v, vib: 10, release: 0.08 }),
    pulse12: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'pulse12', vol: 0.065 * v, vib: 10, release: 0.08 }),
    triangle: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'triangle', vol: 0.13 * v, vib: 14, release: 0.1 }),
    whistle: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'sine', vol: 0.06 * v, vib: 28, attack: 0.03, release: 0.12 }),
    accordion: (m, t, d, v) => { voice({ midi: m, time: t, dur: d, wave: 'pulse25', vol: 0.035 * v, detune: -7, vib: 6, attack: 0.03 }); voice({ midi: m, time: t, dur: d, wave: 'pulse25', vol: 0.035 * v, detune: 7, attack: 0.03 }); },
    piano: (m, t, d, v) => { voice({ midi: m, time: t, dur: d, wave: 'pulse25', vol: 0.05 * v, pluck: 1.1, release: 0.15 }); voice({ midi: m + 12, time: t, dur: d, wave: 'triangle', vol: 0.02 * v, pluck: 0.4 }); },
    rhodes: (m, t, d, v) => { voice({ midi: m, time: t, dur: d, wave: 'sine', vol: 0.07 * v, pluck: 1.8, release: 0.2 }); voice({ midi: m + 12, time: t, dur: d, wave: 'triangle', vol: 0.014 * v, pluck: 0.5 }); },
    musicbox: (m, t, d, v) => { voice({ midi: m + 12, time: t, dur: d, wave: 'sine', vol: 0.09 * v, pluck: 0.9, release: 0.3 }); voice({ midi: m + 24, time: t, dur: d, wave: 'triangle', vol: 0.015 * v, pluck: 0.2 }); },
    pad: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'triangle', vol: 0.03 * v, attack: 0.25, release: 0.3 }),
    pluck: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'pulse12', vol: 0.05 * v, pluck: 0.22 }),
    arp: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'pulse25', vol: 0.032 * v, pluck: 0.45 }),
    stab: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'pulse25', vol: 0.035 * v, pluck: 0.12 }),
    bass: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'triangle', vol: 0.18 * v, release: 0.05 }),
    fbass: (m, t, d, v) => voice({ midi: m, time: t, dur: d, wave: 'triangle', vol: 0.2 * v, pluck: 0.25 }),
    sub808: (m, t, d, v, prev) => voice({ midi: m, time: t, dur: d, wave: 'sine', vol: 0.19 * v, glideFrom: prev, release: 0.12, dest: musicBus }),
  };

  /* ---------- drums ---------- */
  function noiseHit(t, v, type, freq, q, decay, kind) {
    const s = ac.createBufferSource(); s.buffer = noiseBuffer(kind || 'white');
    const f = filt(type, freq, q), g = ac.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    s.connect(f); f.connect(g); g.connect(musicBus); s.start(t, Math.random() * 2); s.stop(t + decay + 0.02);
  }
  const DRUM = {
    k: (t, v) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.15); g.gain.setValueAtTime(0.26 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.26); },
    s: (t, v) => { noiseHit(t, 0.07 * v, 'bandpass', 1900, 0.8, 0.15); const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08); g.gain.setValueAtTime(0.06 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.12); },
    h: (t, v) => noiseHit(t, 0.022 * v, 'highpass', 7500, 0.5, 0.045),
    o: (t, v) => noiseHit(t, 0.022 * v, 'highpass', 6500, 0.5, 0.22),
    sh: (t, v) => noiseHit(t, 0.016 * v, 'bandpass', 6000, 1.2, 0.05),
    tam: (t, v) => noiseHit(t, 0.03 * v, 'highpass', 9000, 0.7, 0.12),
    r: (t, v) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = 1700; g.gain.setValueAtTime(0.025 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.04); },
    c: (t, v) => { [0, 0.012, 0.024].forEach((d) => noiseHit(t + d, 0.04 * v, 'bandpass', 1300, 1.2, 0.08)); },
    b: (t, v) => noiseHit(t, 0.03 * v, 'bandpass', 3000, 0.6, 0.18, 'pink'),
  };
  const DRUMS = {
    ballad: { k: 'x.......x.x.....', s: '....x.......x...', h: 'o.o.o.o.o.o.o.o.' },
    jazz: { h: 'x...x.xx x...x.x'.replace(/ /g, '.'), b: '....o.......o...', k: 'o...........o...' },
    soul: { k: 'x.....x.x.......', s: '....x.......x...', tam: 'o.o.x.o.o.o.x.o.' },
    rnb90: { k: 'x......x..x.....', s: '....x.......x...', h: 'o.o.o.o.o.o.o.o.', c: '............o...' },
    afro: { k: 'x...x...x...x...', r: '...x..x....x..x.', sh: 'xoooxoooxoooxooo', c: '....x.......x...' },
    dancehall: { k: 'x..x..x.x..x..x.', s: '....x.......x...', h: '..o...o...o...o.' },
    trap: { k: 'x.........x..x..', s: '........x.......', h: 'x.x.x.x.xxx.x.xx', c: '........o.......' },
    indie: { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.o.x.o.x.o.x.o.' },
    disco: { k: 'x...x...x...x...', s: '....x.......x...', o: '..x...x...x...x.', h: 'oxo.oxo.oxo.oxo.' },
    lofi: { k: 'x.......x.x.....', s: '....x.......x...', h: 'o.o.o.o.o.o.o.o.' },
    cumbia: { k: 'x.......x.......', sh: 'x.xxx.xxx.xxx.xx', r: '..x...x...x...x.' },
    waltz: { k: 'o...........', tam: '....o...o...' },
  };

  /* ---------- harmony ---------- */
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14],
    9: [0, 4, 7, 10, 14], 13: [0, 4, 10, 14, 21], m11: [0, 3, 7, 10, 14, 17], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9], sus4: [0, 5, 7],
    '7sus4': [0, 5, 7, 10], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], add9: [0, 4, 7, 14], '7b9': [0, 4, 7, 10, 13],
  };
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], dorian: [0, 2, 3, 5, 7, 9, 10], penta: [0, 2, 4, 7, 9], minpenta: [0, 3, 5, 7, 10] };
  const pc = (n) => ((n % 12) + 12) % 12;
  function parseNote(s) { return NOTE[s[0]] + (s[1] === '#' ? 1 : s[1] === 'b' ? -1 : 0); }
  function parseChord(s) {
    const m = s.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
    if (!m || !QUAL[m[2]]) throw new Error('Unknown chord: ' + s);
    const root = parseNote(m[1]);
    return { root, tones: QUAL[m[2]], bass: m[3] ? parseNote(m[3]) : root, pcs: QUAL[m[2]].map((t) => pc(root + t)) };
  }
  function voicing(ch) {
    const base = 48 + pc(ch.root);
    const ns = ch.tones.filter((t) => t <= 17).map((t) => { let n = base + t; while (n < 55) n += 12; while (n > 74) n -= 12; return n; });
    return [...new Set(ns)].sort((a, b) => a - b);
  }

  /* ---------- grooves ---------- */
  function bassPart(style, seg, next, spb) {
    const r = 36 + pc(seg.chord.bass), nr = 36 + pc(next.chord.bass);
    const fifth = r + 7 > 49 ? r - 5 : r + 7, third = r + seg.chord.tones[1], oct = r + 12, L = seg.len, out = [];
    const add = (s, d, m, v = 1) => { if (s < L) out.push({ s, d: Math.min(d, L - s), m, v }); };
    const approach = nr + (r < nr ? -1 : 1);
    switch (style) {
      case 'ballad': add(0, L > 8 ? 7 : L, r); add(8, 4, fifth, 0.8); add(12, 4, oct, 0.7); break;
      case 'root': add(0, L > 8 ? 6 : L - 1, r); add(8, 6, fifth, 0.85); break;
      case 'walk': { const ns = L > 8 ? [r, third, fifth, approach] : [r, approach]; ns.forEach((m, i) => add(i * 4, 3, m, i ? 0.85 : 1)); break; }
      case 'soul': add(0, 5, r); add(6, 2, r, 0.8); add(8, 5, fifth, 0.9); add(14, 2, approach, 0.8); break;
      case 'afro': add(0, 3, r); add(3, 3, r, 0.8); add(7, 3, fifth, 0.85); add(10, 2, r, 0.8); add(12, 4, oct, 0.7); break;
      case 'dance': add(0, 3, r); add(3, 4, r, 0.85); add(8, 2, fifth, 0.85); add(10, 2, fifth, 0.7); add(14, 2, oct, 0.7); break;
      case '808': add(0, L > 8 ? 10 : L, r); add(10, 6, pc(seg.chord.root + 7) + 36, 0.85); break;
      case 'funk': for (let s = 0; s < L; s += 2) if (s !== 6 && s !== 12) add(s, 1, (s / 2) % 2 ? oct : r, (s / 2) % 2 ? 0.75 : 1); break;
      case 'waltz': add(0, 4, r); add(8, 2, fifth, 0.6); break;
      case 'cumbia': add(0, 4, r); add(6, 2, fifth, 0.85); add(8, 4, r, 0.9); add(14, 2, fifth, 0.85); break;
    }
    return out;
  }
  function compPart(style, seg, spb) {
    const v = voicing(seg.chord), L = seg.len, out = [];
    const chord = (s, d, vol = 1, notes = v) => { if (s < L) notes.forEach((m) => out.push({ s, d: Math.min(d, L - s), m, v: vol })); };
    switch (style) {
      case 'arp': [0, 1, 2, 3, 2, 1, 2, 3].forEach((i, k) => { if (k * 2 < L) out.push({ s: k * 2, d: 2, m: v[i % v.length] + 12, v: 1 }); }); break;
      case 'ballad': chord(0, 4, 0.55, v.slice(0, 2)); [2, 1, 3, 2, 1, 3, 2].forEach((i, k) => { const s = (k + 1) * 2; if (s < L) out.push({ s, d: 2, m: v[i % v.length], v: 0.8 }); }); break;
      case 'charleston': chord(0, 3, 0.9); chord(6, 2, 0.8); break;
      case 'block24': chord(4, 2, 0.9); chord(12, 2, 0.9); chord(14, 1, 0.5); break;
      case 'pad': chord(0, L, 1); break;
      case 'stab': [2, 6, 10, 14].forEach((s) => chord(s, 1, 0.9)); break;
      case 'afro': [2, 5, 8, 11, 14].forEach((s, k) => { if (s < L) out.push({ s, d: 2, m: v[(k * 2) % v.length] + 12, v: 1 }); }); break;
      case 'waltz': chord(4, 2, 0.8); chord(8, 2, 0.7); break;
      case 'gospel': chord(0, L, 0.6); chord(6, 2, 0.6); chord(10, 2, 0.6); break;
    }
    return out;
  }
  const RHYTHMS = {
    slow: [[0, 8], [0, 6, 8], [0, 4, 8, 12], [2, 8, 12], [0, 10], [0, 6, 12]],
    mid: [[0, 4, 6, 8, 12], [0, 3, 6, 8, 12], [2, 4, 8, 10], [0, 6, 8, 10, 14], [0, 4, 8, 10, 12]],
    busy: [[0, 2, 4, 6, 8, 10, 12], [0, 3, 6, 8, 10, 12, 14], [2, 4, 6, 10, 12, 14], [0, 2, 6, 8, 12, 14]],
    sync: [[0, 3, 6, 10, 12], [3, 6, 8, 11, 14], [0, 3, 6, 8, 11], [2, 6, 10, 12], [0, 3, 6, 10]],
    waltz: [[0, 4, 8], [0, 6, 8], [0, 4, 6, 8], [0, 8], [0, 2, 4, 8]],
  };

  /* ---------- the songbook ---------- */
  const SONGBOOK = [
    { id: 'nov13', title: 'November 13th', vibe: 'piano ballad · for the Elton John fan · our song',
      key: 'F', scale: 'major', bpm: 78, prog: 'F | C/E | Dm7 | Bb | Gm7 | F/A | Bb | C7sus4 C7', bass: 'ballad', comp: 'ballad', compInst: 'piano',
      lead: 'pulse25', range: [65, 81], rhythm: 'mid', drums: 'ballad', cutoff: 2600, seed: 1113 },
    { id: 'cherie', title: 'Mon Cœur, Ma Chérie', vibe: 'swing ballad · Nat King Cole style', study: true,
      key: 'Bb', scale: 'major', bpm: 112, swing: 0.3, prog: 'Bbmaj7 | G7b9 | Cm7 | F7 | Dm7 G7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7', bass: 'walk', comp: 'charleston', compInst: 'piano',
      lead: 'triangle', range: [62, 77], rhythm: 'mid', drums: 'jazz', cutoff: 2200, seed: 26 },
    { id: 'velvet', title: 'Velvet Objection', vibe: 'retro soul · Amy Winehouse vibes',
      key: 'D', scale: 'harmonic', bpm: 96, swing: 0.18, prog: 'Dm | Gm7 | Bbmaj7 | A7 | Dm | Gm7 | Em7b5 A7 | Dm', bass: 'soul', comp: 'block24', compInst: 'stab',
      lead: 'square', range: [62, 79], rhythm: 'sync', drums: 'soul', cutoff: 2400, seed: 3 },
    { id: 'whistle', title: 'Whistle Note for Isa', vibe: '90s R&B ballad · Mariah mode',
      key: 'Eb', scale: 'major', bpm: 68, prog: 'Abmaj9 | Gm7 | Fm9 | Bb13 | Ebmaj9 | Cm9 | Fm9 | Bb7sus4 Bb7', bass: 'root', comp: 'pad', compInst: 'rhodes',
      lead: 'triangle', range: [63, 82], rhythm: 'slow', drums: 'rnb90', flourish: true, cutoff: 2600, seed: 1970 },
    { id: 'golden', title: 'Golden Hour, Tucson', vibe: 'afrobeats · Burna Boy feels',
      key: 'F', scale: 'minor', bpm: 104, prog: 'Bbm7 | Eb | Ab | Fm7', bass: 'afro', comp: 'afro', compInst: 'pluck',
      lead: 'square', range: [65, 80], rhythm: 'sync', drums: 'afro', cutoff: 2800, seed: 104 },
    { id: 'riddim', title: 'Sunny Riddim', vibe: 'dancehall · Popcaan & Kes energy',
      key: 'G', scale: 'major', bpm: 98, prog: 'G | Em | C | D', bass: 'dance', comp: 'stab', compInst: 'stab',
      lead: 'pulse25', range: [67, 81], rhythm: 'sync', drums: 'dancehall', cutoff: 2800, seed: 98 },
    { id: 'library', title: 'Late Night Library', vibe: 'late-night R&B · Brent & Summer moods', study: true,
      key: 'E', scale: 'major', bpm: 70, prog: 'Amaj7 | G#m7 | F#m9 | Emaj7', bass: '808', comp: 'pad', compInst: 'rhodes',
      lead: 'pulse12', range: [64, 80], rhythm: 'slow', drums: 'trap', cutoff: 2000, seed: 70 },
    { id: 'saguaro', title: 'Saguaro Sunshine', vibe: 'sunny indie · Rex Orange County & Steve Lacy style',
      key: 'D', scale: 'major', bpm: 92, swing: 0.12, prog: 'Dmaj7 | Bm7 | Em9 | A13 | Gmaj7 | F#m7 | Em7 | A7sus4 A7', bass: 'root', comp: 'arp', compInst: 'arp',
      lead: 'square', range: [66, 81], rhythm: 'mid', drums: 'indie', cutoff: 3000, seed: 520 },
    { id: 'beardown', title: 'Bear Down Boogie', vibe: 'funk & disco · Bruno Mars & the Jacksons',
      key: 'E', scale: 'dorian', bpm: 116, prog: 'Em9 | A13 | Em9 | A13 | Cmaj7 | B7 | Em9 | B7', bass: 'funk', comp: 'stab', compInst: 'stab',
      lead: 'square', range: [64, 79], rhythm: 'busy', drums: 'disco', cutoff: 3400, seed: 1885 },
    { id: 'valse', title: 'Valse pour Isa', vibe: 'French musette waltz · pour mon amour', meter: 3,
      key: 'A', scale: 'harmonic', bpm: 150, prog: 'Am | E7 | E7 | Am | Dm | Am | E7 | Am', bass: 'waltz', comp: 'waltz', compInst: 'accordion',
      lead: 'accordion', range: [64, 81], rhythm: 'waltz', drums: 'waltz', cutoff: 2600, seed: 75 },
    { id: 'cumbia', title: 'Cumbia de Sacramento', vibe: 'cumbia · from Sacramento with love',
      key: 'C', scale: 'major', bpm: 96, prog: 'C | G7 | G7 | C | F | C | G7 | C', bass: 'cumbia', comp: 'stab', compInst: 'accordion',
      lead: 'accordion', range: [64, 81], rhythm: 'sync', drums: 'cumbia', cutoff: 2800, seed: 916 },
    { id: 'torts', title: 'Torts & Tea', vibe: 'lo-fi · for case briefs & outlines', study: true,
      key: 'Eb', scale: 'major', bpm: 72, swing: 0.24, prog: 'Ebmaj7 | Cm9 | Abmaj7 | Bb13', bass: 'root', comp: 'block24', compInst: 'rhodes',
      lead: 'pulse12', range: [63, 79], rhythm: 'slow', drums: 'lofi', cutoff: 1900, seed: 1 },
    { id: 'study', title: 'Fog City Study Beat', vibe: 'lo-fi · study', study: true,
      key: 'A', scale: 'minor', bpm: 76, swing: 0.2, prog: 'Am9 | Dm9 | G13 | Cmaj7 Fmaj7', bass: 'root', comp: 'pad', compInst: 'rhodes',
      lead: 'square', range: [64, 79], rhythm: 'mid', drums: 'lofi', cutoff: 2000, seed: 5 },
    { id: 'lullaby', title: 'Bay Lullaby', vibe: 'lullaby · for sleepy nights', study: true,
      key: 'C', scale: 'major', bpm: 64, prog: 'Fmaj7 | Em7 | Dm7 | Cmaj7', bass: 'ballad', comp: 'arp', compInst: 'arp',
      lead: 'triangle', range: [64, 79], rhythm: 'slow', cutoff: 1800, seed: 11 },
  ];

  /* ---------- composer ---------- */
  const built = {};
  function build(def) {
    if (built[def.id]) return built[def.id];
    const R = rng(def.seed), spb = def.meter === 3 ? 12 : 16;
    const bars = def.prog.split('|').map((b) => {
      const names = b.trim().split(/\s+/), len = spb / names.length;
      return names.map((n, i) => ({ chord: parseChord(n), start: i * len, len }));
    });
    const P = bars.length, loopBars = 16, loopLen = loopBars * spb;
    const segAt = (bar, s) => bars[bar % P].find((g) => s >= g.start && s < g.start + g.len) || bars[bar % P][0];
    const events = [];
    for (let bar = 0; bar < loopBars; bar++) {
      bars[bar % P].forEach((seg, i, arr) => {
        const next = arr[i + 1] || bars[(bar + 1) % P][0], off = bar * spb + seg.start;
        bassPart(def.bass, seg, next, spb).forEach((e) => events.push({ step: off + e.s, d: e.d, m: e.m, v: e.v, i: def.bass === '808' ? 'sub808' : def.bass === 'funk' ? 'fbass' : 'bass' }));
        compPart(def.comp, seg, spb).forEach((e) => events.push({ step: off + e.s, d: e.d, m: e.m, v: e.v, i: def.compInst }));
      });
    }
    // melody: 4 phrases of 4 bars, shaped A A' B A (or A B A B' for 8-bar songs)
    const key = parseNote(def.key), scalePcs = SCALES[def.scale].map((x) => pc(key + x));
    const [lo, hi] = def.range, rh = RHYTHMS[def.rhythm];
    let prev = Math.round((lo + hi) / 2), prev2 = prev;
    function barNotes(bar, rhythm, cadence, tonic) {
      const onsets = cadence ? (spb === 12 ? [0] : R() < 0.5 ? [0] : [0, 8]) : rhythm, out = [];
      const target = lo + R() * (hi - lo); // gives each bar a direction to travel
      onsets.forEach((s, k) => {
        const seg = segAt(bar, s), strong = s % (spb === 12 ? 12 : 8) === 0 || k === 0, last = cadence && k === onsets.length - 1;
        let pool = [];
        for (let n = lo; n <= hi; n++) {
          const p = pc(n);
          if (last && tonic) { if (p === key) pool.push(n); }
          else if (last) { if (p === pc(seg.chord.root) || p === seg.chord.pcs[1]) pool.push(n); }
          else if (strong) { if (seg.chord.pcs.includes(p)) pool.push(n); }
          else if (scalePcs.includes(p) || seg.chord.pcs.includes(p)) pool.push(n);
        }
        if (!pool.length) pool = [prev];
        let best = pool[0], bestScore = 1e9;
        for (const n of pool) {
          const dist = Math.abs(n - prev), sc = dist * 0.8 + (n === prev ? 2.5 : 0) + (n === prev2 ? 2 : 0) + (dist > 7 ? 6 : 0) + Math.abs(n - target) * 0.35 + R() * 3;
          if (sc < bestScore) { bestScore = sc; best = n; }
        }
        prev2 = prev; prev = best;
        const nextS = onsets[k + 1] != null ? onsets[k + 1] : spb;
        out.push({ s, d: Math.max(1, nextS - s - (R() < 0.25 ? 1 : 0)), m: best });
      });
      return out;
    }
    function phrase(startBar) {
      const r1 = rh[Math.floor(R() * rh.length)], r2 = R() < 0.5 ? r1 : rh[Math.floor(R() * rh.length)];
      return [barNotes(startBar, r1), barNotes(startBar + 1, r2), barNotes(startBar + 2, r1), barNotes(startBar + 3, null, true, false)];
    }
    function variant(p, startBar) { const q = p.slice(0, 3); q.push(barNotes(startBar + 3, null, true, true)); return q; }
    let plan;
    if (P >= 8) { const A = phrase(0), B = phrase(4); plan = [A, B, A, variant(B, 4)]; }
    else { const A = phrase(0), B = phrase(0); plan = [A, variant(A, 0), B, variant(A, 0)]; }
    const melody = [];
    plan.forEach((ph, k) => ph.forEach((bn, b) => bn.forEach((n) => {
      const step = (k * 4 + b) * spb + n.s;
      events.push({ step, d: n.d, m: n.m, v: 1, i: def.lead, lead: true }); melody.push(n.m);
    })));
    if (def.flourish) [1, 3].forEach((k) => { // a little Mariah whistle-register run
      const bar = k * 4 + 3, top = hi + 12; let n = hi - 2; const run = [];
      for (let s = 8; s < 16; s += 1) { while (!scalePcs.includes(pc(n))) n++; run.push({ s, m: Math.min(n, top) }); n += 2; }
      run.forEach((x, j) => events.push({ step: bar * spb + x.s, d: j === run.length - 1 ? 6 : 1, m: x.m, v: 0.8, i: 'whistle' }));
    });
    const byStep = Array.from({ length: loopLen }, () => []);
    events.forEach((e) => byStep[e.step % loopLen].push(e));
    return (built[def.id] = { def, spb, loopLen, byStep, melody, drums: DRUMS[def.drums] || null });
  }

  /* ---------- player ---------- */
  let seq = null, last808 = null;
  function playStep(song, step, t0, stepDur) {
    const { def, spb } = song, b = step % spb;
    let t = t0;
    if (def.swing && b % 4 === 2) t += def.swing * 2 * stepDur;
    for (const e of song.byStep[step]) {
      if (e.i === 'sub808') { INST.sub808(e.m, t, e.d * stepDur, e.v, last808); last808 = e.m; }
      else INST[e.i](e.m, t, e.d * stepDur * 0.95, e.v);
    }
    if (song.drums) {
      for (const k in song.drums) {
        const ch = song.drums[k][b];
        if (ch === 'x' || ch === 'o') DRUM[k](t, ch === 'x' ? 1 : 0.55);
      }
      const bar = Math.floor(step / spb);
      if (bar % 8 === 7 && spb === 16 && b >= 12 && song.drums.s) DRUM.s(t, 0.45 + (b - 12) * 0.12); // little fill
    }
  }
  function playSong(id) {
    if (!ensure()) return;
    stopSong();
    const def = SONGBOOK.find((x) => x.id === id) || SONGBOOK[0], song = build(def);
    musicIn.frequency.setTargetAtTime(def.cutoff || 2400, ac.currentTime, 0.1);
    seq = { song, step: 0, next: ac.currentTime + 0.15 };
    seq.timer = setInterval(() => {
      if (!seq) return;
      const stepDur = 60 / seq.song.def.bpm / 4;
      while (seq.next < ac.currentTime + 0.25) { playStep(seq.song, seq.step % seq.song.loopLen, seq.next, stepDur); seq.next += stepDur; seq.step++; }
    }, 25);
  }
  function stopSong() { if (seq) { clearInterval(seq.timer); seq = null; } }

  window.SFAudio = {
    ensure,
    songs: SONGBOOK.map((s) => ({ id: s.id, title: s.title, vibe: s.vibe, study: !!s.study })),
    playSong, stopSong,
    isSongPlaying: () => !!seq,
    currentSong: () => (seq ? seq.song.def.id : null),
    getMelody(id) { const def = SONGBOOK.find((x) => x.id === id) || SONGBOOK[0]; return build(def).melody.slice(); },
    playNote(midi, inst = 'piano', dur = 0.6) { if (!ensure()) return; (INST[inst] || INST.piano)(midi, ac.currentTime + 0.005, dur, 1.6); },
    setMusicVolume(v) { if (ensure()) musicBus.gain.setTargetAtTime(v, ac.currentTime, 0.05); },
    setAmbientVolume(v) { if (ensure()) ambBus.gain.setTargetAtTime(v, ac.currentTime, 0.05); },
    setAmbient, isAmbientOn: (n) => !!ambOn[n],
    sfx,
    // used by the offline test renderer only
    _renderAll(id, seconds) { ensure(); const def = SONGBOOK.find((x) => x.id === id), song = build(def), sd = 60 / def.bpm / 4; let t = 0.05, st = 0; while (t < seconds) { playStep(song, st % song.loopLen, t, sd); t += sd; st++; } musicIn.frequency.value = def.cutoff || 2400; },
  };
})();

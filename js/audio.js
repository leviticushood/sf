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
      master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);

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

  /* ---------- chiptune sequencer ---------- */
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const SONGS = [
    { id: 'lullaby', title: 'Bay Lullaby', bpm: 64, seed: 11, density: 0.34, lead: 'triangle', arp: 'square', arpVol: 0.03,
      chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], scale: [60, 62, 64, 67, 69, 72, 74, 76] },
    { id: 'study', title: 'Fog City Study Beat', bpm: 76, seed: 5, density: 0.28, lead: 'square', arp: 'triangle', arpVol: 0.05, drums: true, study: true,
      chords: [[57, 60, 64, 67], [50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59]], scale: [69, 72, 74, 76, 79, 81] },
    { id: 'sunset', title: 'Sunset at Ocean Beach', bpm: 70, seed: 23, density: 0.38, lead: 'square', arp: 'triangle', arpVol: 0.05,
      chords: [[58, 62, 65, 69], [57, 60, 64, 67], [55, 58, 62, 65], [53, 57, 60, 64]], scale: [65, 67, 69, 72, 74, 77, 79] },
    { id: 'cablecar', title: 'Cable Car Dreams', bpm: 82, seed: 42, density: 0.3, lead: 'square', arp: 'triangle', arpVol: 0.045, drums: true, study: true,
      chords: [[48, 52, 55, 59], [45, 48, 52, 55], [53, 57, 60, 64], [55, 59, 62, 65]], scale: [60, 62, 64, 67, 69, 72, 74] },
  ];
  SONGS.forEach((s) => {
    const R = rng(s.seed), mel = [];
    for (let b = 0; b < 8; b++) {
      for (let i = 0; i < 8; i++) {
        let n = null;
        const strong = i % 2 === 0;
        if (R() < (strong ? s.density * 1.5 : s.density * 0.45)) {
          if (R() < 0.55) { n = s.chords[b % 4][Math.floor(R() * 4)]; while (n < s.scale[0]) n += 12; }
          else n = s.scale[Math.floor(R() * s.scale.length)];
        }
        mel.push(n);
      }
    }
    mel[56] = s.scale[0]; // resolve home at the last bar
    s.melody = mel;
  });

  let seq = null;
  function kick(t) { const o = ac.createOscillator(), gn = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16); gn.gain.setValueAtTime(0.22, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(gn); gn.connect(musicBus); o.start(t); o.stop(t + 0.25); }
  function hat(t, v) { const s = ac.createBufferSource(); s.buffer = noiseBuffer('white'); const hp = filt('highpass', 7000), gn = ac.createGain(); gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); s.connect(hp); hp.connect(gn); gn.connect(musicBus); s.start(t, Math.random()); s.stop(t + 0.06); }
  function snare(t) { const s = ac.createBufferSource(); s.buffer = noiseBuffer('white'); const bp = filt('bandpass', 1800, 0.9), gn = ac.createGain(); gn.gain.setValueAtTime(0.05, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); s.connect(bp); bp.connect(gn); gn.connect(musicBus); s.start(t, Math.random()); s.stop(t + 0.16); }

  function playStep(s, step, t) {
    const spb = 60 / s.bpm / 2, bar = Math.floor(step / 8) % 8, i = step % 8, chord = s.chords[bar % 4];
    if (i === 0) tone({ freq: mtof(chord[0] - 12), time: t, dur: spb * 3.6, type: 'triangle', vol: 0.17 });
    if (i === 4) tone({ freq: mtof(chord[0] - 12 + (s.drums ? 0 : 7)), time: t, dur: spb * 3.2, type: 'triangle', vol: 0.12 });
    const pat = [0, 1, 2, 3, 2, 1, 2, 3];
    tone({ freq: mtof(chord[pat[i]] + 12), time: t, dur: spb * 0.8, type: s.arp, vol: s.arpVol, release: 0.18 });
    const n = s.melody[step % 64];
    if (n) {
      tone({ freq: mtof(n), time: t, dur: spb * 1.6, type: s.lead, vol: s.lead === 'square' ? 0.045 : 0.11, release: 0.3 });
    }
    if (s.drums) {
      if (i === 0 || i === 5) kick(t);
      if (i === 4) snare(t);
      if (i % 2 === 1) hat(t, 0.02);
    }
  }

  function playSong(id) {
    if (!ensure()) return;
    stopSong();
    const s = SONGS.find((x) => x.id === id) || SONGS[0];
    seq = { s, step: 0, next: ac.currentTime + 0.12 };
    seq.timer = setInterval(() => {
      if (!seq) return;
      const spb = 60 / seq.s.bpm / 2;
      while (seq.next < ac.currentTime + 0.2) { playStep(seq.s, seq.step, seq.next); seq.next += spb; seq.step++; }
    }, 30);
  }
  function stopSong() { if (seq) { clearInterval(seq.timer); seq = null; } }

  window.SFAudio = {
    ensure,
    songs: SONGS.map((s) => ({ id: s.id, title: s.title, study: !!s.study })),
    playSong, stopSong,
    isSongPlaying: () => !!seq,
    setMusicVolume(v) { if (ensure()) musicBus.gain.setTargetAtTime(v, ac.currentTime, 0.05); },
    setAmbientVolume(v) { if (ensure()) ambBus.gain.setTargetAtTime(v, ac.currentTime, 0.05); },
    setAmbient, isAmbientOn: (n) => !!ambOn[n],
    sfx,
  };
})();

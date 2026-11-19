/* =====================================================================
   app.js: windows, study timer, music player, letters, wishes & more
   ===================================================================== */
(function () {
  'use strict';
  const C = window.SF_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const A = window.SFAudio;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('oursf_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('oursf_' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const list = (k) => (Array.isArray(C[k]) ? C[k] : []);

  /* ---------------- pixel icons ---------------- */
  const ICON_PAL = { K: '#3b2a4d', W: '#ffffff', P: '#f58bb8', R: '#ef5b6b', G: '#6cc28a', B: '#8cc4f2', Y: '#ffd35c', C: '#9fe8d8', N: '#b5835a', L: '#c9b6ff' };
  const ICONS = {
    quotes: ['.KKKKKKK.', 'KWWWWWWWK', 'KWPPWPPWK', 'KWPPWPPWK', 'KWWPWWPWK', 'KWWWWWWWK', '.KKWKKKK.', '..KWK....', '..KK.....'],
    memories: ['KKKKKKKKK', 'KBBBBBBBK', 'KBBBBYYBK', 'KBBBBYYBK', 'KBBGBBBBK', 'KBGGGBGBK', 'KGGGGGGGK', 'KKKKKKKKK', '.........'],
    study: ['...G.G...', '..KGGGK..', '.KRRGRRK.', 'KRWRRRRRK', 'KRRRRRRRK', 'KRRRRRRRK', '.KRRRRRK.', '..KKKKK..', '.........'],
    music: ['...KKKKKK', '...KPPPPK', '...KKKKKK', '...K....K', '...K....K', '.KKK..KKK', 'KPPK.KPPK', 'KPPK.KPPK', '.KK...KK.'],
    letters: ['.........', 'KKKKKKKKK', 'KKWWWWWKK', 'KWKWWWKWK', 'KWWKPKWWK', 'KWWWKWWWK', 'KWWWWWWWK', 'KKKKKKKKK', '.........'],
    breathe: ['.........', '...KKK...', '..KWWWKK.', '.KKWWWWWK', 'KWWWWWWWK', 'KWKWWWKWK', 'KWPWWWPWK', '.KKKKKKK.', '.........'],
    us: ['.K.....K.', 'KKKKKKKKK', 'KRRRRRRRK', 'KWWWWWWWK', 'KWRRWRRWK', 'KWRRRRRWK', 'KWWRRRWWK', 'KWWWRWWWK', 'KKKKKKKKK'],
    wish: ['....K....', '...KYK...', 'KKKKYKKKK', 'KYYYYYYYK', '.KYYYYYK.', '..KYYYK..', '.KYYKYYK.', 'KYKK.KKYK', 'KK.....KK'],
    note: ['...KK....', '...NK....', '..KWWK...', '..KCCK...', '.KCWWCK..', '.KCWWCK..', '.KCCCCK..', '.KCCCCK..', '..KKKK...'],
    sun: ['....Y....', '.Y.KKK.Y.', '..KYYYK..', '.KYYYYYK.', 'YKYYYYYKY', '.KYYYYYK.', '..KYYYK..', '.Y.KKK.Y.', '....Y....'],
    moon: ['...KKK...', '..KWWK...', '.KWWK....', '.KWWK....', '.KWWK....', '.KWWWK...', '..KWWWKK.', '...KKKK..', '.........'],
    dawn: ['.........', '.........', '.........', '..KKKKK..', '.KYYYYYK.', 'KYYYYYYYK', 'KKKKKKKKK', '.B.B.B.B.', 'B.B.B.B.B'],
    auto: ['..KKKKK..', '.KYYKWWK.', 'KYYYKWWWK', 'KYYYKWWWK', 'KYYYKWKWK', 'KYYYKWWWK', '.KYYKWWK.', '..KKKKK..', '.........'],
    games: ['.........', '..KKKKK..', '.KLLLLLK.', 'KLWLLLPLK', 'KWWWLPLPK', 'KLWLLLPLK', 'KLLKKKLLK', '.KK...KK.', '.........'],
    piano: ['.........', 'KKKKKKKKK', 'KWKKWKKWK', 'KWKKWKKWK', 'KWWKWWKWK', 'KWWKWWKWK', 'KPPPPPPPK', 'KKKKKKKKK', '.........'],
    heart: ['.KK...KK.', 'KPPK.KPPK', 'KPWPKPPPK', 'KPPPPPPPK', 'KPPPPPPPK', '.KPPPPPK.', '..KPPPK..', '...KPK...', '....K....'],
  };
  const iconCache = {};
  function icon(name) {
    if (iconCache[name]) return iconCache[name];
    const c = document.createElement('canvas'); c.width = 9; c.height = 9;
    Scene.sprite(ICONS[name] || ICONS.heart, ICON_PAL, 0, 0, c.getContext('2d'));
    return (iconCache[name] = c.toDataURL());
  }

  /* ---------------- dates ---------------- */
  function parseDate(s) { const [y, m, d] = String(s || '2023-01-01').split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  const START = parseDate(C.startDate);
  function dayDiff(a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000); }
  function ymd(a, b) {
    let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    return { y, m, d };
  }
  const daysTogether = () => dayDiff(START, new Date());
  const fmtDate = (s) => parseDate(s).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const plural = (n, w) => `${n.toLocaleString()} ${w}${n === 1 ? '' : 's'}`;

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg, ms = 4500) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------------- modal windows ---------------- */
  let cleanup = null, openId = null;
  function openPanel(id) {
    const p = PANELS[id]; if (!p) return;
    if (cleanup) { cleanup(); cleanup = null; }
    openId = id;
    $('#win-title').textContent = p.title;
    $('#win-icon').src = icon(p.icon || id);
    const old = $('#win-body'), body = old.cloneNode(false); // fresh element = no leftover listeners
    old.replaceWith(body);
    cleanup = p.render(body) || null;
    $('#modal').classList.add('open'); $('#modal').setAttribute('aria-hidden', 'false');
    A.sfx.open();
    setTimeout(() => $('#win-close').focus(), 50);
  }
  function closePanel() {
    if (!openId) return;
    if (cleanup) { cleanup(); cleanup = null; }
    openId = null;
    $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden', 'true');
    A.sfx.close();
  }
  $('#win-close').addEventListener('click', closePanel);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closePanel(); });

  /* =================================================================
     MUSIC PLAYER (your mp3s + built-in chiptunes)
     ================================================================= */
  const player = (() => {
    const tracks = list('playlist').map((t) => ({ ...t, kind: 'file' }));
    if (C.includeBuiltInSongs !== false || !tracks.length) A.songs.forEach((s) => tracks.push({ title: s.title, artist: s.vibe, builtin: s.id, study: s.study }));
    const el = new Audio(); el.preload = 'none';
    let idx = store.get('trackIdx', 0) % tracks.length, playing = false, loadedIdx = -1, vol = store.get('vol', C.defaultVolume == null ? 0.45 : C.defaultVolume);
    const listeners = [];
    const emit = () => { listeners.forEach((f) => f()); updateNowPlaying(); };
    el.addEventListener('ended', () => next());
    el.addEventListener('error', () => {
      if (!tracks[idx] || tracks[idx].kind !== 'file' || !el.getAttribute('src')) return;
      toast(`Couldn't load "${tracks[idx].src}". Check the file name in /music 🎵`);
      const b = tracks.findIndex((t) => t.builtin); if (b >= 0) play(b);
    });
    function applyVol() { el.volume = vol; A.setMusicVolume(vol); }
    function play(i) {
      if (i != null && i !== idx) { stopAll(); idx = (i + tracks.length) % tracks.length; }
      const t = tracks[idx]; A.ensure(); applyVol();
      if (t.builtin) { A.playSong(t.builtin); }
      else {
        if (loadedIdx !== idx) { el.src = t.src; loadedIdx = idx; }
        el.play().catch(() => {});
      }
      playing = true; store.set('trackIdx', idx); emit();
    }
    function stopAll() { A.stopSong(); el.pause(); }
    function pause() { const t = tracks[idx]; if (t.builtin) A.stopSong(); else el.pause(); playing = false; emit(); }
    function toggle() { playing ? pause() : play(); }
    function next() { stopAll(); idx = (idx + 1) % tracks.length; play(); }
    function prev() { stopAll(); idx = (idx - 1 + tracks.length) % tracks.length; play(); }
    function playStudy() { const st = tracks.map((t, i) => (t.study ? i : -1)).filter((i) => i >= 0); play(st.length ? st[Math.floor(Math.random() * st.length)] : idx); }
    function playById(id) { const i = tracks.findIndex((t) => t.builtin === id); if (i >= 0) play(i); }
    return {
      tracks, play, pause, toggle, next, prev, playStudy, playById,
      get idx() { return idx; }, get playing() { return playing; }, get vol() { return vol; },
      setVol(v) { vol = v; store.set('vol', v); applyVol(); },
      on(f) { listeners.push(f); return () => listeners.splice(listeners.indexOf(f), 1); },
    };
  })();

  function updateNowPlaying() {
    const t = player.tracks[player.idx];
    $('#np-title').textContent = player.playing ? t.title : 'Music off';
    $('.np-icon').textContent = player.playing ? '♪' : '♫';
  }
  $('#now-playing').addEventListener('click', () => openPanel('music'));

  /* =================================================================
     STUDY TIMER (pomodoro: keeps running when the window is closed)
     ================================================================= */
  const P = Object.assign({ focus: 25, short: 5, long: 15, longEvery: 4 }, C.pomodoro, store.get('pomoSettings', {}));
  const todayKey = () => new Date().toDateString();
  const timer = {
    mode: 'focus', running: false, endAt: 0,
    remaining: P.focus * 60, total: P.focus * 60,
    sessions: store.get('sessions', {})[todayKey()] || 0,
    listeners: [],
  };
  const MODE_LABEL = { focus: 'Focus', short: 'Short break', long: 'Long break' };
  function setMode(m) { timer.mode = m; timer.running = false; timer.total = timer.remaining = P[m] * 60; timerEmit(); }
  function startTimer() {
    A.ensure();
    timer.endAt = Date.now() + timer.remaining * 1000; timer.running = true;
    if (timer.mode === 'focus' && store.get('autoStudyMusic', true) && !player.playing) player.playStudy();
    A.sfx.ding(); timerEmit();
  }
  function pauseTimer() { timer.running = false; timerEmit(); }
  function resetTimer() { timer.running = false; timer.remaining = timer.total = P[timer.mode] * 60; timerEmit(); }
  function completeTimer() {
    timer.running = false; A.sfx.chime();
    let msg;
    if (timer.mode === 'focus') {
      timer.sessions++;
      const s = store.get('sessions', {}); s[todayKey()] = timer.sessions; store.set('sessions', s);
      msg = pick(list('encouragements').length ? list('encouragements') : ['Focus block done! ♥']);
      Scene.burstAt('study'); Scene.burstAt('couple');
      setMode(timer.sessions % P.longEvery === 0 ? 'long' : 'short');
    } else { msg = 'Break is over. You got this! 🍅'; setMode('focus'); }
    toast(msg, 6000);
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Our Little SF', { body: msg }); } catch (e) { /* ignore */ }
    if (store.get('autoContinue', false)) startTimer();
  }
  const fmt = (s) => { s = Math.ceil(s); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function timerEmit() {
    const pill = $('#timer-pill');
    const show = timer.running || timer.remaining < timer.total;
    pill.classList.toggle('hidden', !show);
    pill.textContent = `${timer.mode === 'focus' ? '🍅' : '☕'} ${fmt(timer.remaining)}${timer.running ? '' : ' ❚❚'}`;
    document.title = timer.running ? `${fmt(timer.remaining)} · ${MODE_LABEL[timer.mode]} · Our SF` : (C.siteTitle || 'Our Little San Francisco');
    timer.listeners.forEach((f) => f());
  }
  setInterval(() => {
    if (!timer.running) return;
    timer.remaining = Math.max(0, (timer.endAt - Date.now()) / 1000);
    if (timer.remaining <= 0) completeTimer(); else timerEmit();
  }, 250);
  $('#timer-pill').addEventListener('click', () => openPanel('study'));

  /* ---------------- ambience toggles (shared UI) ---------------- */
  const AMBIENCES = [['waves', '🌊 Waves'], ['rain', '🌧 Rain'], ['wind', '🌬 Fog wind'], ['cafe', '☕ Café'], ['foghorn', '📯 Foghorn']];
  function ambienceUI() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="row">${AMBIENCES.map(([k, l]) => `<button class="btn ghost amb ${A.isAmbientOn(k) ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div>`;
    $$('.amb', wrap).forEach((b) => b.addEventListener('click', () => {
      const on = !A.isAmbientOn(b.dataset.k); A.setAmbient(b.dataset.k, on); b.classList.toggle('on', on);
      const saved = store.get('amb', {}); saved[b.dataset.k] = on; store.set('amb', saved);
    }));
    return wrap;
  }

  /* =================================================================
     PANELS
     ================================================================= */
  const PANELS = {};

  /* ---- Golden Gate: quotes ---- */
  PANELS.quotes = {
    title: 'Golden Gate Quotes', icon: 'quotes', label: 'Quotes',
    render(el) {
      const quotes = list('quotes');
      if (!quotes.length) { el.innerHTML = '<p>Add quotes in js/config.js ♥</p>'; return; }
      let favs = store.get('favQuotes', []), onlyFav = false, i = store.get('quoteIdx', 0) % quotes.length;
      el.innerHTML = `
        <div class="quote-card"><p class="quote-text"></p><p class="quote-by"></p></div>
        <div class="row center">
          <button class="btn ghost" data-a="prev" aria-label="Previous">◀</button>
          <button class="btn" data-a="fav">♡ Save</button>
          <button class="btn alt2" data-a="shuffle">Shuffle</button>
          <button class="btn ghost" data-a="next" aria-label="Next">▶</button>
        </div>
        <div class="row center"><label class="check"><input type="checkbox" id="only-fav"> only show saved ♥</label></div>
        <p class="muted center counter" style="text-align:center"></p>`;
      const pool = () => (onlyFav && favs.length ? favs.filter((f) => f < quotes.length) : quotes.map((_, k) => k));
      function show() {
        const q = quotes[i], card = $('.quote-card', el);
        card.classList.remove('fade-in'); void card.offsetWidth; card.classList.add('fade-in');
        $('.quote-text', el).textContent = `“${q.text}”`;
        $('.quote-by', el).textContent = q.by ? `— ${q.by}` : '';
        $('[data-a=fav]', el).textContent = favs.includes(i) ? '♥ Saved' : '♡ Save';
        $('.counter', el).textContent = `${i + 1} / ${quotes.length} · ${favs.length} saved`;
        store.set('quoteIdx', i);
      }
      function move(d) { const p = pool(); const k = p.indexOf(i); i = p[((k < 0 ? 0 : k) + d + p.length) % p.length]; A.sfx.blip(); show(); }
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'); if (!a) return;
        if (a.dataset.a === 'prev') move(-1);
        if (a.dataset.a === 'next') move(1);
        if (a.dataset.a === 'shuffle') { const p = pool(); i = p[Math.floor(Math.random() * p.length)]; A.sfx.sparkle(); show(); }
        if (a.dataset.a === 'fav') { favs = favs.includes(i) ? favs.filter((f) => f !== i) : [...favs, i]; store.set('favQuotes', favs); A.sfx.pop(); show(); }
      });
      $('#only-fav', el).addEventListener('change', (e) => { onlyFav = e.target.checked; if (onlyFav && favs.length && !favs.includes(i)) i = favs[0]; show(); });
      const key = (e) => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); };
      document.addEventListener('keydown', key);
      show();
      return () => document.removeEventListener('keydown', key);
    },
  };

  /* ---- Painted Ladies: memories ---- */
  PANELS.memories = {
    title: 'Our Memories', icon: 'memories', label: 'Memories',
    render(el) {
      const mem = list('memories').slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
      el.innerHTML = `<p class="muted">Every house on the hill holds a little piece of us.</p>
        <div class="timeline">${mem.map((m) => `
          <article class="memory fade-in">
            <div class="date">${esc(fmtDate(m.date))} · day ${dayDiff(START, parseDate(m.date)).toLocaleString()}</div>
            <h3>${esc(m.title)}</h3>
            <p>${esc(m.text).replace(/\n/g, '<br>')}</p>
            ${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.title)}" loading="lazy" onerror="this.remove()">` : ''}
          </article>`).join('')}
          <article class="memory"><div class="date">today · day ${daysTogether().toLocaleString()}</div><h3>…and still writing our story ♥</h3></article>
        </div>`;
    },
  };

  /* ---- Cable car: study timer ---- */
  PANELS.study = {
    title: 'Study Car 🍅', icon: 'study', label: 'Study',
    render(el) {
      el.innerHTML = `
        <div class="tabs">${['focus', 'short', 'long'].map((m) => `<button class="btn ghost" data-mode="${m}">${MODE_LABEL[m]}</button>`).join('')}</div>
        <div class="big-time" aria-live="off">25:00</div>
        <div class="blocks">${'<i></i>'.repeat(20)}</div>
        <div class="row center">
          <button class="btn big" data-a="go">▶ Start</button>
          <button class="btn alt2" data-a="reset">Reset</button>
          <button class="btn ghost" data-a="skip">Skip ▸▸</button>
        </div>
        <p class="section-title">I'M STUDYING…</p>
        <input type="text" id="task" maxlength="80" placeholder="e.g. Chapter 7 flashcards">
        <p class="section-title">TODAY'S TOMATOES</p>
        <div class="tomatoes"></div>
        <p class="section-title">BACKGROUND SOUNDS</p>
        <div id="amb-slot"></div>
        <div class="row"><button class="btn alt" data-a="music">♪ Play study music</button></div>
        <p class="section-title">SETTINGS (MINUTES)</p>
        <div class="settings">
          <label>Focus <input type="number" min="1" max="120" data-p="focus"></label>
          <label>Short <input type="number" min="1" max="60" data-p="short"></label>
          <label>Long <input type="number" min="1" max="60" data-p="long"></label>
        </div>
        <div class="row" style="flex-direction:column;align-items:flex-start;gap:4px;margin-top:10px">
          <label class="check"><input type="checkbox" id="auto-music"> start study music when focus begins</label>
          <label class="check"><input type="checkbox" id="auto-cont"> auto-start the next block</label>
          <label class="check"><input type="checkbox" id="notify"> notify me when time's up</label>
        </div>`;
      $('#amb-slot', el).appendChild(ambienceUI());
      const task = $('#task', el); task.value = store.get('task', ''); task.addEventListener('input', () => store.set('task', task.value));
      $$('[data-p]', el).forEach((inp) => {
        inp.value = P[inp.dataset.p];
        inp.addEventListener('change', () => {
          const v = Math.max(1, Math.min(120, parseInt(inp.value, 10) || P[inp.dataset.p]));
          inp.value = v; P[inp.dataset.p] = v; store.set('pomoSettings', { focus: P.focus, short: P.short, long: P.long });
          if (!timer.running && inp.dataset.p === timer.mode) resetTimer();
        });
      });
      const am = $('#auto-music', el); am.checked = store.get('autoStudyMusic', true); am.addEventListener('change', () => store.set('autoStudyMusic', am.checked));
      const ac = $('#auto-cont', el); ac.checked = store.get('autoContinue', false); ac.addEventListener('change', () => store.set('autoContinue', ac.checked));
      const nt = $('#notify', el); nt.checked = 'Notification' in window && Notification.permission === 'granted';
      nt.addEventListener('change', () => { if (nt.checked && 'Notification' in window) Notification.requestPermission().then((r) => { nt.checked = r === 'granted'; }); });
      el.addEventListener('click', (e) => {
        const m = e.target.closest('[data-mode]'); if (m) { setMode(m.dataset.mode); A.sfx.blip(); return; }
        const a = e.target.closest('[data-a]'); if (!a) return;
        if (a.dataset.a === 'go') timer.running ? pauseTimer() : startTimer();
        if (a.dataset.a === 'reset') resetTimer();
        if (a.dataset.a === 'skip') { timer.remaining = 0; timer.endAt = Date.now(); if (!timer.running) { timer.running = true; } }
        if (a.dataset.a === 'music') player.playStudy();
      });
      function view() {
        $('.big-time', el).textContent = fmt(timer.remaining);
        $('[data-a=go]', el).textContent = timer.running ? '❚❚ Pause' : (timer.remaining < timer.total ? '▶ Resume' : '▶ Start');
        $$('[data-mode]', el).forEach((b) => b.classList.toggle('on', b.dataset.mode === timer.mode));
        const done = Math.round((1 - timer.remaining / timer.total) * 20);
        $$('.blocks i', el).forEach((b, k) => b.classList.toggle('on', k < done));
        $('.blocks', el).classList.toggle('break', timer.mode !== 'focus');
        $('.tomatoes', el).textContent = timer.sessions ? '🍅'.repeat(Math.min(timer.sessions, 16)) + (timer.sessions > 16 ? ` ×${timer.sessions}` : '') : 'none yet: you got this!';
      }
      timer.listeners.push(view); view();
      const key = (e) => { if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); timer.running ? pauseTimer() : startTimer(); } };
      document.addEventListener('keydown', key);
      return () => { timer.listeners.splice(timer.listeners.indexOf(view), 1); document.removeEventListener('keydown', key); };
    },
  };

  /* ---- Sutro Tower: radio ---- */
  PANELS.music = {
    title: 'Sutro Tower Radio', icon: 'music', label: 'Music',
    render(el) {
      el.innerHTML = `
        <div class="row center">
          <button class="btn ghost" data-a="prev">⏮</button>
          <button class="btn big" data-a="toggle">▶ Play</button>
          <button class="btn ghost" data-a="next">⏭</button>
        </div>
        <div class="row center"><span>volume</span><input type="range" id="vol" min="0" max="1" step="0.01"></div>
        <ul class="tracks"></ul>
        <p class="section-title">AMBIENCE</p>
        <div id="amb-slot"></div>
        <div class="row center"><span>ambience volume</span><input type="range" id="avol" min="0" max="1" step="0.01"></div>
        <p class="muted tiny">Add your own 8-bit songs: drop mp3 files in the <b>music/</b> folder and list them in <b>js/config.js</b>.</p>`;
      $('#amb-slot', el).appendChild(ambienceUI());
      const v = $('#vol', el); v.value = player.vol; v.addEventListener('input', () => player.setVol(+v.value));
      const av = $('#avol', el); av.value = store.get('avol', 0.55); av.addEventListener('input', () => { A.setAmbientVolume(+av.value); store.set('avol', +av.value); });
      el.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-i]'); if (li) { const i = +li.dataset.i; (i === player.idx && player.playing) ? player.pause() : player.play(i); return; }
        const a = e.target.closest('[data-a]'); if (!a) return;
        player[a.dataset.a]();
      });
      function view() {
        $('[data-a=toggle]', el).textContent = player.playing ? '❚❚ Pause' : '▶ Play';
        $('.tracks', el).innerHTML = player.tracks.map((t, i) => {
          const on = i === player.idx;
          return `<li data-i="${i}" class="${on && player.playing ? 'playing' : ''}">
            <span class="eq ${on && player.playing ? '' : 'paused'}"><i></i><i></i><i></i></span>
            <span>${esc(t.title)}</span><span class="tag">${t.study ? 'study · ' : ''}${esc(t.artist || '')}</span></li>`;
        }).join('');
      }
      view();
      return player.on(view);
    },
  };

  /* ---- Downtown: open-when letters ---- */
  PANELS.letters = {
    title: 'Open When…', icon: 'letters', label: 'Letters',
    render(el) {
      const letters = list('letters');
      function grid() {
        const read = store.get('read', []);
        el.innerHTML = `<p class="muted">Little letters from me, for whenever you need them.</p>
          <div class="envelopes">${letters.map((l, i) => `<button class="envelope ${read.includes(i) ? 'read' : ''}" data-i="${i}">
            <img class="pix" src="${icon(read.includes(i) ? 'heart' : 'letters')}" alt="">${esc(l.title)}</button>`).join('')}</div>`;
      }
      function open(i) {
        const l = letters[i]; const read = store.get('read', []); if (!read.includes(i)) store.set('read', [...read, i]);
        A.sfx.sparkle();
        el.innerHTML = `<p class="section-title">${esc(l.title.toUpperCase())}</p><div class="letter">${esc(l.body)}</div>
          <div class="row"><button class="btn ghost" data-back>◀ all letters</button></div>`;
        el.parentElement.scrollTop = 0;
      }
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]'); if (b) return open(+b.dataset.i);
        if (e.target.closest('[data-back]')) { A.sfx.blip(); grid(); }
      });
      grid();
    },
  };

  /* ---- Karl the Fog: breathing ---- */
  const KARL = [
    '..........KKKK..........',
    '.......KKKWWWWKK........',
    '......KWWWWWWWWWK.KKK...',
    '....KKWWWWWWWWWWWKWWWK..',
    '...KWWWWWWWWWWWWWWWWWWK.',
    '..KWWWWWWWWWWWWWWWWWWWK.',
    '.KWWWWKKWWWWWWWKKWWWWWWK',
    '.KWWWWKKWWWWWWWKKWWWWWWK',
    'KWWWWWWWWWWWWWWWWWWWWWWK',
    'KWWPPWWWWWKWWKWWWWPPWWWK',
    'KWWWWWWWWWWKKWWWWWWWWWWK',
    '.KWWWWWWWWWWWWWWWWWWWWK.',
    '..KKKWWWWKKKKKWWWWWKKK..',
    '.....KKKK.....KKKKK.....',
  ];
  PANELS.breathe = {
    title: 'Breathe with Karl', icon: 'breathe', label: 'Breathe',
    render(el) {
      const patterns = {
        box: { name: 'Box 4·4·4·4', steps: [['Breathe in', 4, 1.6], ['Hold', 4, 1.6], ['Breathe out', 4, 1], ['Hold', 4, 1]] },
        calm: { name: 'Sleepy 4·7·8', steps: [['Breathe in', 4, 1.6], ['Hold', 7, 1.6], ['Breathe out', 8, 1]] },
        easy: { name: 'Easy 4·6', steps: [['Breathe in', 4, 1.6], ['Breathe out', 6, 1]] },
      };
      let cur = store.get('breathePattern', 'box'), running = false, timeouts = [], cycles = 0;
      el.innerHTML = `<div class="breathe-wrap">
        <p class="muted" style="text-align:center">Karl the Fog breathes slow. Follow him: in as he grows, out as he shrinks.</p>
        <div class="tabs">${Object.entries(patterns).map(([k, p]) => `<button class="btn ghost" data-p="${k}">${p.name}</button>`).join('')}</div>
        <div class="breathe-stage"><canvas id="karl-big" width="24" height="14"></canvas></div>
        <div class="breathe-word">ready?</div><div class="breathe-count"></div>
        <button class="btn big" data-a="go">▶ Begin</button>
        <p class="muted tiny cycles"></p></div>`;
      const k = $('#karl-big', el); Scene.sprite(KARL, { K: '#6a5a8f', W: '#ffffff', P: '#ffa6c9' }, 0, 0, k.getContext('2d'));
      const word = $('.breathe-word', el), count = $('.breathe-count', el);
      function marks() { $$('[data-p]', el).forEach((b) => b.classList.toggle('on', b.dataset.p === cur)); }
      function clear() { timeouts.forEach(clearTimeout); timeouts = []; }
      function stop() { running = false; clear(); word.textContent = 'ready?'; count.textContent = ''; k.style.transitionDuration = '1.5s'; k.style.transform = 'scale(1)'; $('[data-a=go]', el).textContent = '▶ Begin'; }
      function run(stepIdx) {
        if (!running) return;
        const steps = patterns[cur].steps, [label, secs, scale] = steps[stepIdx % steps.length];
        if (stepIdx > 0 && stepIdx % steps.length === 0) { cycles++; $('.cycles', el).textContent = `${cycles} breath${cycles > 1 ? 's' : ''} together ♥`; }
        word.textContent = label; k.style.transitionDuration = secs + 's'; k.style.transform = `scale(${scale})`;
        for (let s = 0; s < secs; s++) timeouts.push(setTimeout(() => { count.textContent = secs - s; }, s * 1000));
        if (label === 'Breathe in') A.sfx.blip();
        timeouts.push(setTimeout(() => run(stepIdx + 1), secs * 1000));
      }
      el.addEventListener('click', (e) => {
        const p = e.target.closest('[data-p]'); if (p) { cur = p.dataset.p; store.set('breathePattern', cur); marks(); if (running) { clear(); run(0); } return; }
        if (e.target.closest('[data-a=go]')) {
          if (running) stop(); else { running = true; e.target.textContent = '■ Stop'; if (!A.isAmbientOn('waves')) A.setAmbient('waves', true); run(0); }
        }
      });
      marks();
      return stop;
    },
  };

  /* ---- Coit Tower: us ---- */
  PANELS.us = {
    title: 'Days Together', icon: 'us', label: 'Us',
    render(el) {
      function view() {
        const now = new Date(), d = daysTogether(), p = ymd(START, now);
        const secs = Math.floor((now - START) / 1000);
        let anniv = new Date(now.getFullYear(), START.getMonth(), START.getDate());
        if (dayDiff(now, anniv) < 0) anniv = new Date(now.getFullYear() + 1, START.getMonth(), START.getDate());
        const toAnniv = dayDiff(now, anniv), years = anniv.getFullYear() - START.getFullYear();
        const nextMilestone = Math.ceil((d + 1) / 100) * 100;
        el.innerHTML = `
          <p class="hero-count">together for<br><b>${p.y ? plural(p.y, 'year') + ', ' : ''}${plural(p.m, 'month')}, ${plural(p.d, 'day')}</b></p>
          <div class="stat-grid">
            <div class="stat"><b>${d.toLocaleString()}</b><span>days of us</span></div>
            <div class="stat"><b>${Math.floor(secs / 3600).toLocaleString()}</b><span>hours</span></div>
            <div class="stat"><b>${secs.toLocaleString()}</b><span>seconds (and counting)</span></div>
            <div class="stat"><b>${Math.round(secs / 60 * 72).toLocaleString()}</b><span>heartbeats ≈ side by side</span></div>
            <div class="stat"><b>${toAnniv === 0 ? 'TODAY!' : toAnniv}</b><span>${toAnniv === 0 ? `happy ${years}-year anniversary ♥` : `days until our ${years}-year anniversary`}</span></div>
            <div class="stat"><b>${(nextMilestone - d).toLocaleString()}</b><span>days until day ${nextMilestone.toLocaleString()}</span></div>
          </div>
          <p class="muted" style="text-align:center">since ${esc(fmtDate(C.startDate))} ♥</p>`;
      }
      view();
      const iv = setInterval(view, 1000);
      return () => clearInterval(iv);
    },
  };

  /* ---- Stars: wishes ---- */
  PANELS.wish = {
    title: 'Wish Upon a Star', icon: 'wish', label: 'Wish',
    render(el) {
      function view() {
        const w = store.get('wishes', []);
        const night = Scene.getPhase() === 'night';
        el.innerHTML = `
          <p>Make a wish. It'll become a <b style="color:var(--hot)">pink star</b> in our night sky, forever. ✦</p>
          ${night ? '' : '<p class="muted tiny">(stars come out at night; tap the sun to change the sky)</p>'}
          <textarea id="wish-in" maxlength="200" placeholder="I wish…"></textarea>
          <div class="row"><button class="btn" data-a="send">✦ Send to the stars</button></div>
          ${w.length ? `<p class="section-title">OUR STARS (${w.length})</p><ul class="wish-list">${w.slice().reverse().map((x) => `<li>${esc(x.text)}<br><small>${esc(new Date(x.at).toLocaleDateString())}</small></li>`).join('')}</ul>` : ''}`;
        $('[data-a=send]', el).addEventListener('click', () => {
          const t = $('#wish-in', el).value.trim(); if (!t) return;
          const all = [...store.get('wishes', []), { text: t, at: Date.now() }]; store.set('wishes', all);
          Scene.setWishes(all.map((x) => x.text)); A.sfx.sparkle();
          toast('Your wish is up in the sky now ✦'); view();
        });
      }
      view();
    },
  };

  /* ---- Our piano (we both play!) ---- */
  PANELS.piano = {
    title: 'Our Piano', icon: 'piano', label: 'Piano',
    render(el) {
      const KEYS = 'zsxdcvgbhnjmq2w3er5t6y7u'; // two octaves, C4 to B5
      const BLACK = [1, 3, 6, 8, 10], LOW = 60, HIGH = 83;
      const SOUNDS = [['piano', '8-bit piano'], ['rhodes', 'Electric piano'], ['musicbox', 'Music box'], ['accordion', 'Accordion'], ['square', 'Retro lead']];
      let sound = store.get('pianoSound', 'piano'), songId = store.get('pianoSong', C.anniversarySong || 'nov13');
      let guide = null, gi = 0, demoT = [];
      const whites = []; for (let m = LOW; m <= HIGH; m++) if (!BLACK.includes(m % 12)) whites.push(m);
      el.innerHTML = `
        <p class="muted">Play with your mouse, your fingers, or your computer keyboard (the letters on the keys). Then try <b>Follow the lights</b> to learn one of our songs.</p>
        <div class="row"><label>Sound <select id="pi-sound">${SOUNDS.map(([k, l]) => `<option value="${k}" ${k === sound ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <div class="piano" id="piano">${whites.map((m) => `<div class="wk" data-m="${m}"><span>${KEYS[m - LOW].toUpperCase()}</span>${BLACK.includes((m + 1) % 12) && m + 1 <= HIGH ? `<div class="bk" data-m="${m + 1}"><span>${KEYS[m + 1 - LOW].toUpperCase()}</span></div>` : ''}</div>`).join('')}</div>
        <p class="section-title">FOLLOW THE LIGHTS</p>
        <div class="row"><select id="pi-song">${A.songs.map((x) => `<option value="${x.id}" ${x.id === songId ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select>
          <button class="btn" data-a="learn">✦ Start</button><button class="btn alt2" data-a="demo">▶ Listen</button><button class="btn ghost" data-a="stop">Stop</button></div>
        <p class="pi-status muted"></p>`;
      const piano = $('#piano', el), status = $('.pi-status', el);
      const keyEl = (m) => piano.querySelector(`[data-m="${m}"]`);
      function flash(m, cls = 'down') { const k = keyEl(m); if (!k) return; k.classList.add(cls); setTimeout(() => k.classList.remove(cls), 180); }
      function fit(n) { while (n < LOW) n += 12; while (n > HIGH) n -= 12; return n; }
      function showNext() {
        $$('.next', piano).forEach((k) => k.classList.remove('next'));
        if (!guide) { status.textContent = ''; return; }
        if (gi >= guide.length) {
          status.innerHTML = '<b>You played it! ♥</b> I knew you would.'; A.sfx.chime(); Scene.burstAt('couple');
          guide = null; return;
        }
        keyEl(guide[gi]).classList.add('next');
        status.textContent = `note ${gi + 1} of ${guide.length}: press the glowing key`;
      }
      function play(m) {
        A.playNote(m, sound); flash(m);
        if (guide) { if (m === guide[gi]) { gi++; showNext(); } else flash(m, 'wrong'); }
      }
      function stopDemo() { demoT.forEach(clearTimeout); demoT = []; }
      let down = false;
      piano.addEventListener('pointerdown', (e) => { const k = e.target.closest('[data-m]'); if (!k) return; e.preventDefault(); down = true; play(+k.dataset.m); });
      piano.addEventListener('pointerover', (e) => { if (!down || e.pointerType === 'touch') return; const k = e.target.closest('[data-m]'); if (k) play(+k.dataset.m); });
      const up = () => { down = false; }; window.addEventListener('pointerup', up);
      const onKey = (e) => {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
        const i = KEYS.indexOf(e.key.toLowerCase()); if (i < 0) return;
        e.preventDefault(); play(LOW + i);
      };
      document.addEventListener('keydown', onKey);
      $('#pi-sound', el).addEventListener('change', (e) => { sound = e.target.value; store.set('pianoSound', sound); A.playNote(72, sound); });
      $('#pi-song', el).addEventListener('change', (e) => { songId = e.target.value; store.set('pianoSong', songId); });
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'); if (!a) return;
        stopDemo();
        if (a.dataset.a === 'learn') { if (player.playing) player.pause(); guide = A.getMelody(songId).slice(0, 32).map(fit); gi = 0; showNext(); }
        if (a.dataset.a === 'stop') { guide = null; showNext(); }
        if (a.dataset.a === 'demo') {
          if (player.playing) player.pause();
          const mel = A.getMelody(songId).slice(0, 32).map(fit);
          mel.forEach((m, i) => demoT.push(setTimeout(() => { A.playNote(m, sound); flash(m, 'next'); }, i * 330)));
        }
      });
      return () => { stopDemo(); document.removeEventListener('keydown', onKey); window.removeEventListener('pointerup', up); };
    },
  };

  /* ---- Sailboat: daily games ---- */
  PANELS.games = {
    title: 'Daily Bay Games', icon: 'games', label: 'Games',
    render(el) {
      return window.SFGames.mount(el, { store, toast, sfx: A.sfx, icon, burst: () => { Scene.burstAt('couple'); Scene.burstAt('games'); } });
    },
  };

  /* ---- Bottle: daily note ---- */
  PANELS.note = {
    title: 'Message in a Bottle', icon: 'note', label: 'Note',
    render(el) {
      const notes = list('dailyNotes'); const n = notes.length ? notes[((daysTogether() % notes.length) + notes.length) % notes.length] : 'Add notes in config.js ♥';
      el.innerHTML = `<p class="muted" style="text-align:center">${esc(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }))}</p>
        <div class="note-paper fade-in">${esc(n)}</div>
        <p class="muted tiny" style="text-align:center">a new note washes up every day 🌊</p>`;
      A.sfx.sparkle();
    },
  };

  /* =================================================================
     DOCK, SKY BUTTON, REASONS, SECRET
     ================================================================= */
  const DOCK = ['games', 'piano', 'quotes', 'memories', 'study', 'music', 'letters', 'breathe', 'us', 'wish', 'note'];
  $('#dock').innerHTML = DOCK.map((id, i) => `<button class="dock-btn" data-open="${id}" title="${PANELS[id].title} (${i + 1})"><img class="pix" src="${icon(PANELS[id].icon)}" alt=""><span>${PANELS[id].label}</span></button>`).join('');
  $('#dock').addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openPanel(b.dataset.open); });
  let tucked = store.get('tucked', false);
  function applyTuck() { $('#dock').classList.toggle('tucked', tucked); const side = matchMedia('(min-width: 641px) and (min-aspect-ratio: 4/3)').matches; $('#dock-toggle').textContent = side ? (tucked ? '▸' : '◂') : (tucked ? '▴' : '▾'); }
  $('#dock-toggle').addEventListener('click', () => { tucked = !tucked; store.set('tucked', tucked); applyTuck(); });
  applyTuck(); window.addEventListener('resize', applyTuck);

  const PHASE_LABEL = { auto: 'Auto', dawn: 'Dawn', day: 'Day', sunset: 'Sunset', night: 'Night' };
  const PHASE_ICON = { dawn: 'dawn', day: 'sun', sunset: 'dawn', night: 'moon' };
  function phaseView(phase, mode) {
    $('#phase-label').textContent = mode === 'auto' ? `Auto · ${PHASE_LABEL[phase]}` : PHASE_LABEL[mode];
    $('#phase-icon').src = icon(PHASE_ICON[phase]);
    store.set('skyMode', mode);
  }
  Scene.onPhase(phaseView);
  $('#phase-btn').addEventListener('click', () => { Scene.cycleMode(); A.sfx.blip(); });

  let reasonPool = [];
  function nextReason() {
    if (!reasonPool.length) reasonPool = list('reasons').slice().sort(() => Math.random() - 0.5);
    return reasonPool.pop() || 'I love you ♥';
  }
  let coupleClicks = 0, coupleT = 0;
  function coupleClicked() {
    const now = Date.now(); coupleClicks = now - coupleT < 1500 ? coupleClicks + 1 : 1; coupleT = now;
    A.sfx.pop();
    if (coupleClicks >= 7) {
      coupleClicks = 0; Scene.fireworks(9); A.sfx.sparkle();
      setTimeout(() => {
        $('#win-title').textContent = '★ Secret ★';
        PANELS.secret = { title: '★ You found the secret ★', icon: 'heart', render(el) { el.innerHTML = `<div class="letter">${esc(C.secretMessage || 'I love you!')}</div>`; } };
        openPanel('secret');
      }, 2600);
      return;
    }
    toast('♥ ' + nextReason());
  }

  Scene.onRegion((id) => {
    if (id === 'couple') return coupleClicked();
    if (id === 'sun') { Scene.nextPhase(); A.sfx.sparkle(); return; }
    if (id === 'study') A.sfx.ding();
    openPanel(id);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return closePanel();
    if (openId || /INPUT|TEXTAREA/.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && !$('#welcome:not(.gone)')) openPanel(DOCK[n - 1]);
  });

  /* =================================================================
     BOOT
     ================================================================= */
  document.title = C.siteTitle || document.title;
  $('#site-title').textContent = C.siteTitle || 'Our Little San Francisco';
  $('#welcome-title').textContent = C.siteTitle || 'Our Little San Francisco';
  function togetherLine() { const d = daysTogether(); $('#together-line').textContent = d >= 0 ? `♥ day ${(d + 1).toLocaleString()} of us` : '♥ coming soon'; }
  togetherLine(); setInterval(togetherLine, 60000);

  Scene.setWishes(store.get('wishes', []).map((x) => x.text));
  const savedMode = store.get('skyMode', 'auto');
  Scene.setMode(PHASE_LABEL[savedMode] ? savedMode : 'auto');
  updateNowPlaying(); timerEmit();

  // center the city on phones (scrollable stage)
  const centerStage = () => { const s = $('#stage'); s.scrollLeft = (s.scrollWidth - s.clientWidth) * 0.45; };
  window.addEventListener('resize', centerStage); centerStage();

  // welcome screen
  Scene.drawCouple($('#welcome-couple'), 7);
  $('#welcome-name').textContent = `welcome home, ${C.herName || 'love'} ♥`;
  $('#welcome-msg').textContent = C.welcome || '';
  $('#start-btn').addEventListener('click', () => {
    A.ensure();
    A.setAmbientVolume(store.get('avol', 0.55));
    $('#welcome').classList.add('gone');
    setTimeout(() => $('#welcome').remove(), 900);
    A.sfx.sparkle();
    if (C.autoplayMusic !== false) player.play();
    const amb = store.get('amb', { waves: true });
    Object.entries(amb).forEach(([k, on]) => on && A.setAmbient(k, true));
    const h = new Date().getHours();
    const G = C.greetings || {};
    const greet = h < 5 ? G.late || 'Up late? The stars kept you company ✦' : h < 12 ? G.morning || 'Good morning ☀' : h < 17 ? G.afternoon || 'Good afternoon ♥' : h < 21 ? G.evening || 'Good evening 🌅' : G.night || 'Goodnight soon 🌙';
    // anniversary & monthiversary surprises (on the same day-of-month as startDate)
    const now = new Date(), months = (now.getFullYear() - START.getFullYear()) * 12 + now.getMonth() - START.getMonth();
    if (now.getDate() === START.getDate() && months > 0) {
      const yearly = months % 12 === 0;
      setTimeout(() => {
        Scene.fireworks(yearly ? 12 : 5);
        toast(yearly ? `Happy ${months / 12}-year anniversary, ${C.herName || 'love'}! Joyeux anniversaire, mon amour ♥` : `Happy ${months}-month-iversary ♥ ${months} months of us!`, 9000);
        if (yearly) player.playById(C.anniversarySong || 'nov13');
      }, 1200);
    } else setTimeout(() => toast(greet), 900);
    setTimeout(centerStage, 50);
  });
})();

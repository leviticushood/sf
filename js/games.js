/* =====================================================================
   games.js: three cozy daily puzzles, generated from the date.
   Same puzzle for everyone on the same day; new ones every midnight.
   Archive: play any of the last 365 days.
     1) Fog Words        guess the 5-letter word (6 tries, any letters count)
     2) Cable Car Route  one path through every square, stops in order
     3) Paint the Ladies flood the grid to one color
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- helpers ---------------- */
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const dayIdx = (d) => Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2025, 0, 1)) / 86400000);
  const dateOf = (i) => new Date(2025, 0, 1 + i);
  const todayIdx = () => dayIdx(new Date());
  const $ = (s, r) => r.querySelector(s);
  const $$ = (s, r) => Array.from(r.querySelectorAll(s));
  function shuffle(arr, r) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

  /* ---------------- word list (~400 cozy words) ---------------- */
  const WORDS = shuffle([...new Set(`
    heart smile bloom beach ocean waves cloud foggy sunny light dream sweet honey peach berry lemon mango olive bread toast
    latte mocha cocoa candy sugar spice maple cedar grass field river shore coast coral pearl shell sandy tides tower cable
    hills ferry boats sails dunes cliff stone trail route flora fauna daisy tulip lilac poppy roses petal vines leafy sprig
    acorn birch aspen plums apple grape melon guava dates salad pasta pizza sushi ramen tacos bagel scone crepe gravy curry
    cream fudge jelly syrup juice water bliss peace happy merry jolly cheer laugh giddy charm grace glory quiet still relax
    unity truth faith trust adore crush flirt swoon blush angel cupid amour belle tryst music piano notes songs tunes chord
    vinyl radio drums flute dance waltz tango salsa disco party feast quest cards chess books novel poems verse story pages
    words paper quill diary study learn exams brain smart think focus write draft class chalk ruler desks lamps board bench
    chair couch quilt sheet storm rainy windy misty frost snowy sleet humid gleam shine stars comet orbit lunar solar earth
    venus pluto space skies birds robin finch crane heron eagle raven swans geese ducks otter seals whale shark squid trout
    koala panda tiger zebra horse sheep goats llama camel moose bunny puppy kitty mouse house homes cabin villa manor porch
    attic patio fence gates glass frame paint brush color craft photo album easel image train track wheel motor drive plane
    jetty kayak canoe yacht urban metro plaza mural cafes diner store shops stall block parks swing slide kites lawns trees
    woods grove ferns brook lakes ponds creek falls rapid shoal inlet delta marsh swamp amber ivory azure mauve khaki beige
    green white black brown proud brave loyal noble witty funny silly dorky nerdy goofy comfy fluff fuzzy plush downy silky
    satin linen woven denim dress skirt shirt jeans boots shoes socks scarf glove beret rings jewel tiara crown hoops beads
    chain clasp opals topaz today night early later hours weeks month years times clock march april nifty spark flame ember
    torch glows blaze smoky baker whisk spoon forks knife plate bowls flour yeast herbs basil thyme chive onion leeks beans
    wheat grain seeds nutty rhyme clues guess solve match score prize medal champ gamer cling share carry holds treat spoil
    honor value cared giver sleep dozes snore yawns rests tired awake lucid eased balmy buddy mates chums guest hosts visit
    greet hello howdy adieu`.trim().split(/\s+/).filter((w) => /^[a-z]{5}$/.test(w)))], rng(2025));
  const answerFor = (i) => WORDS[((i % WORDS.length) + WORDS.length) % WORDS.length].toUpperCase();

  /* ---------------- shared bits ---------------- */
  let api; // { store, toast, sfx, icon, burst }
  const doneKey = (i) => 'g_done_' + i;
  function markDone(i, game, summary) { const d = api.store.get(doneKey(i), {}); d[game] = summary || true; api.store.set(doneKey(i), d); }
  function share(text) {
    const ok = () => api.toast('Copied! Paste it to me so I can see ♥');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, () => window.prompt('Copy this:', text));
    else window.prompt('Copy this:', text);
  }
  const WIN_LINES = ['You did it! ♥', 'Brilliant, as always ✦', 'So smart. So cute. 🧠', 'Puzzle solved, heart stolen ♥', 'Easy breezy, like the bay ☁'];
  const winLine = (i) => WIN_LINES[((i % WIN_LINES.length) + WIN_LINES.length) % WIN_LINES.length];

  /* =================================================================
     1) FOG WORDS
     ================================================================= */
  function fogWords(el, idx) {
    const ans = answerFor(idx), key = 'g_words_' + idx;
    const st = api.store.get(key, { guesses: [], done: false, won: false });
    let cur = '';
    el.innerHTML = `
      <p class="muted">Guess today's cozy 5-letter word in 6 tries. <span class="fw-k hit">pink</span> = right spot, <span class="fw-k near">lavender</span> = somewhere else. Any 5 letters are allowed. No pressure ♥</p>
      <div class="fw-board"></div><div class="fw-msg"></div><div class="fw-keys"></div>`;
    function score(g) {
      const res = Array(5).fill('miss'), used = Array(5).fill(false);
      for (let i = 0; i < 5; i++) if (g[i] === ans[i]) { res[i] = 'hit'; used[i] = true; }
      for (let i = 0; i < 5; i++) if (res[i] !== 'hit') { for (let j = 0; j < 5; j++) if (!used[j] && ans[j] === g[i]) { res[i] = 'near'; used[j] = true; break; } }
      return res;
    }
    function render(reveal) {
      const rows = [];
      for (let r = 0; r < 6; r++) {
        const g = st.guesses[r], s = g ? score(g) : null, txt = g || (r === st.guesses.length ? cur : '');
        rows.push(`<div class="fw-row ${r === st.guesses.length && !st.done ? 'current' : ''}">${[0, 1, 2, 3, 4].map((c) =>
          `<div class="fw-tile ${s ? s[c] : ''} ${s && reveal && r === st.guesses.length - 1 ? 'flip' : ''}" style="animation-delay:${c * 0.12}s">${txt[c] || ''}</div>`).join('')}</div>`);
      }
      $('.fw-board', el).innerHTML = rows.join('');
      const best = {};
      st.guesses.forEach((g) => score(g).forEach((s, i) => { const L = g[i], rank = { hit: 3, near: 2, miss: 1 }; if (!best[L] || rank[s] > rank[best[L]]) best[L] = s; }));
      $('.fw-keys', el).innerHTML = ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'].map((row) => `<div class="fw-krow">${row.split('').map((k) =>
        `<button class="fw-key ${best[k] || ''} ${k === '⏎' || k === '⌫' ? 'wide' : ''}" data-k="${k}" aria-label="${k === '⏎' ? 'Enter' : k === '⌫' ? 'Delete' : k}">${k}</button>`).join('')}</div>`).join('');
      const msg = $('.fw-msg', el);
      if (st.done) {
        msg.innerHTML = st.won ? `<b>${winLine(idx)}</b> Got it in ${st.guesses.length}/6.` : `The word was <b>${ans}</b>. The fog won today, but you're still my favorite ♥`;
        msg.innerHTML += ` <button class="btn alt" data-share>Share</button>`;
      } else msg.textContent = '';
    }
    function input(k) {
      if (st.done) return;
      if (k === 'ENTER' || k === '⏎') {
        if (cur.length < 5) { const row = $('.fw-row.current', el); row && (row.classList.remove('shake'), void row.offsetWidth, row.classList.add('shake')); return; }
        st.guesses.push(cur); cur = '';
        if (st.guesses[st.guesses.length - 1] === ans) { st.done = st.won = true; }
        else if (st.guesses.length >= 6) st.done = true;
        api.store.set(key, st);
        if (st.done) { markDone(idx, 'words', st.won ? st.guesses.length + '/6' : 'X/6'); if (st.won) { api.sfx.chime(); api.burst(); } }
        else api.sfx.blip();
        render(true); return;
      }
      if (k === 'BACKSPACE' || k === '⌫') cur = cur.slice(0, -1);
      else if (/^[A-Z]$/.test(k) && cur.length < 5) cur += k;
      render(false);
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]'); if (b) return input(b.dataset.k);
      if (e.target.closest('[data-share]')) {
        const em = { hit: '🩷', near: '💜', miss: '🤍' };
        share(`Fog Words #${idx + 1} ${st.won ? st.guesses.length : 'X'}/6 🌁\n` + st.guesses.map((g) => score(g).map((s) => em[s]).join('')).join('\n'));
      }
    });
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      const k = e.key.toUpperCase();
      if (k === 'ENTER' || k === 'BACKSPACE' || /^[A-Z]$/.test(k)) { e.preventDefault(); input(k); }
    };
    document.addEventListener('keydown', onKey);
    render(false);
    return () => document.removeEventListener('keydown', onKey);
  }

  /* =================================================================
     2) CABLE CAR ROUTE: one path through every square, stops in order
     ================================================================= */
  function genRoute(idx) {
    const r = rng(idx * 7919 + 17), wd = dateOf(idx).getDay();
    const n = wd === 0 ? 7 : wd === 6 ? 6 : (idx % 2 ? 6 : 5); // weekends a bit bigger
    const N = n * n, nb = (c) => { const x = c % n, y = (c / n) | 0, o = []; if (x > 0) o.push(c - 1); if (x < n - 1) o.push(c + 1); if (y > 0) o.push(c - n); if (y < n - 1) o.push(c + n); return o; };
    let path = null;
    for (let attempt = 0; attempt < 40 && !path; attempt++) {
      const vis = new Uint8Array(N), p = []; let steps = 0;
      const deg = (c) => nb(c).filter((d) => !vis[d]).length;
      const dfs = (c) => {
        if (++steps > 30000) return false;
        vis[c] = 1; p.push(c);
        if (p.length === N) return true;
        const opts = shuffle(nb(c).filter((d) => !vis[d]), r).sort((a, b) => deg(a) - deg(b));
        for (const d of opts) if (dfs(d)) return true;
        vis[c] = 0; p.pop(); return false;
      };
      if (dfs((r() * N) | 0)) path = p;
    }
    if (!path) { path = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) path.push(y * n + (y % 2 ? n - 1 - x : x)); }
    const K = n <= 5 ? 6 : n === 6 ? 8 : 10, stops = {};
    for (let i = 0; i < K; i++) {
      let at = Math.round((i * (N - 1)) / (K - 1));
      if (i > 0 && i < K - 1) at += Math.round((r() - 0.5) * 2);
      stops[path[at]] = i + 1;
    }
    return { n, N, path, stops, K };
  }

  function cableRoute(el, idx) {
    const pz = genRoute(idx), { n, N, stops, K } = pz, key = 'g_route_' + idx;
    const st = api.store.get(key, { done: false, path: [] });
    let path = st.done ? pz.path.slice() : st.path.slice(), drawing = false, hintCell = -1;
    el.innerHTML = `
      <p class="muted">Drag from stop <b>1</b> to draw one cable car line that visits <b>every square</b> once and passes the stops in order. Drag back to undo. 🚋</p>
      <div class="route-wrap"><div class="route-grid" style="grid-template-columns:repeat(${n},1fr)">${Array.from({ length: N }, (_, c) =>
        `<div class="route-cell" data-c="${c}">${stops[c] ? `<span class="stop">${stops[c]}</span>` : ''}</div>`).join('')}</div>
        <svg class="route-svg" viewBox="0 0 ${n * 10} ${n * 10}" preserveAspectRatio="none"><polyline points="" /></svg></div>
      <div class="row center"><button class="btn ghost" data-a="undo">↶ Undo</button><button class="btn alt2" data-a="hint">💡 Hint</button><button class="btn ghost" data-a="clear">Clear</button></div>
      <div class="fw-msg route-msg"></div>`;
    const grid = $('.route-grid', el), cells = $$('.route-cell', el);
    const adj = (a, b) => (Math.abs(a - b) === 1 && ((a / n) | 0) === ((b / n) | 0)) || Math.abs(a - b) === n;
    const nextStop = () => 1 + path.filter((c) => stops[c]).length;
    function render() {
      const inP = new Set(path);
      cells.forEach((c, i) => { c.classList.toggle('on', inP.has(i)); c.classList.toggle('head', path[path.length - 1] === i); c.classList.toggle('hint', hintCell === i); });
      $('polyline', el).setAttribute('points', path.map((c) => `${(c % n) * 10 + 5},${((c / n) | 0) * 10 + 5}`).join(' '));
      const msg = $('.route-msg', el);
      if (st.done) msg.innerHTML = `<b>${winLine(idx + 1)}</b> All aboard! Route complete 🚋 <button class="btn alt" data-share>Share</button>`;
      else msg.textContent = `${path.length}/${N} squares · next stop: ${Math.min(nextStop(), K)}`;
    }
    function check() {
      if (path.length === N && stops[path[N - 1]] === K && !st.done) {
        st.done = true; markDone(idx, 'route', true); api.sfx.chime(); api.burst();
      }
      st.path = path; api.store.set(key, st);
    }
    function tryAdd(c) {
      if (st.done || c == null) return;
      const i = path.indexOf(c);
      if (path.length >= 2 && c === path[path.length - 2]) { path.pop(); render(); return; }
      if (i >= 0) return;
      if (!path.length) { if (stops[c] === 1) { path.push(c); api.sfx.blip(); render(); } return; }
      if (!adj(path[path.length - 1], c)) return;
      if (stops[c] && stops[c] !== nextStop()) return;
      path.push(c); hintCell = -1;
      if (stops[c]) api.sfx.pop();
      check(); render();
    }
    const cellAt = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); const d = t && t.closest('.route-cell'); return d ? +d.dataset.c : null; };
    grid.addEventListener('pointerdown', (e) => {
      if (st.done) return;
      const c = cellAt(e); if (c == null) return;
      e.preventDefault(); drawing = true;
      const i = path.indexOf(c);
      if (i >= 0) { path = path.slice(0, i + 1); render(); } else tryAdd(c);
    });
    const move = (e) => { if (drawing) tryAdd(cellAt(e)); };
    const up = () => { if (drawing) { drawing = false; check(); render(); } };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]');
      if (e.target.closest('[data-share]')) return share(`Cable Car Route #${idx + 1} 🚋 complete! ${'🟪'.repeat(Math.min(n, 7))}`);
      if (!a || st.done) return;
      if (a.dataset.a === 'undo') path.pop();
      if (a.dataset.a === 'clear') path = [];
      if (a.dataset.a === 'hint') {
        let k = 0; while (k < path.length && path[k] === pz.path[k]) k++;
        path = path.slice(0, Math.max(k, 1)); if (!path.length || path[0] !== pz.path[0]) path = [pz.path[0]];
        hintCell = pz.path[path.length]; api.sfx.sparkle();
      }
      st.path = path; api.store.set(key, st); render();
    });
    render();
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }

  /* =================================================================
     3) PAINT THE LADIES: flood the grid to one color
     ================================================================= */
  const PAINT = ['#f6a6c1', '#a8e0c8', '#c7b3ef', '#ffc9a0', '#9fd3f2'];
  const PAINT_EMOJI = ['🩷', '💚', '💜', '🧡', '🩵'];
  function flood(grid, n, color) {
    const from = grid[0]; if (from === color) return grid;
    const g = grid.slice(), stack = [0]; g[0] = color;
    while (stack.length) {
      const c = stack.pop(), x = c % n, y = (c / n) | 0;
      for (const d of [x > 0 && c - 1, x < n - 1 && c + 1, y > 0 && c - n, y < n - 1 && c + n]) if (d !== false && g[d] === from) { g[d] = color; stack.push(d); }
    }
    return g;
  }
  function regionSize(g, n) {
    const col = g[0], seen = new Uint8Array(g.length), st = [0]; seen[0] = 1; let k = 0;
    while (st.length) { const c = st.pop(); k++; const x = c % n, y = (c / n) | 0; for (const d of [x > 0 && c - 1, x < n - 1 && c + 1, y > 0 && c - n, y < n - 1 && c + n]) if (d !== false && !seen[d] && g[d] === col) { seen[d] = 1; st.push(d); } }
    return k;
  }
  function genPaint(idx) {
    const r = rng(idx * 104729 + 3), n = 10, grid = Array.from({ length: n * n }, () => (r() * PAINT.length) | 0);
    let g = grid.slice(), par = 0;
    while (regionSize(g, n) < n * n && par < 60) {
      let best = -1, bestSize = -1;
      for (let c = 0; c < PAINT.length; c++) { if (c === g[0]) continue; const s = regionSize(flood(g, n, c), n); if (s > bestSize) { bestSize = s; best = c; } }
      g = flood(g, n, best); par++;
    }
    return { n, grid, par };
  }
  function paintLadies(el, idx) {
    const pz = genPaint(idx), n = pz.n, key = 'g_paint_' + idx;
    const st = api.store.get(key, { moves: [], done: false });
    let grid = pz.grid.slice(); st.moves.forEach((m) => { grid = flood(grid, n, m); });
    el.innerHTML = `
      <p class="muted">Tap a color to repaint the top-left block and everything connected to it. Turn the whole hill one color. Par is <b>${pz.par}</b>, but there's no limit, so take your time ☕</p>
      <div class="paint-grid" style="grid-template-columns:repeat(${n},1fr)">${grid.map(() => '<i></i>').join('')}</div>
      <div class="row center paint-btns">${PAINT.map((c, i) => `<button class="paint-btn" data-p="${i}" style="background:${c}" aria-label="color ${i + 1}"></button>`).join('')}</div>
      <div class="row center"><button class="btn ghost" data-a="undo">↶ Undo</button><button class="btn ghost" data-a="restart">Restart</button></div>
      <div class="fw-msg paint-msg"></div>`;
    const tiles = $$('.paint-grid i', el);
    const starsFor = (m) => (m <= pz.par ? '⭐⭐⭐' : m <= pz.par + 3 ? '⭐⭐' : '⭐');
    function render() {
      const owned = new Set(); { const col = grid[0], seen = new Uint8Array(grid.length), s = [0]; seen[0] = 1; while (s.length) { const c = s.pop(); owned.add(c); const x = c % n, y = (c / n) | 0; for (const d of [x > 0 && c - 1, x < n - 1 && c + 1, y > 0 && c - n, y < n - 1 && c + n]) if (d !== false && !seen[d] && grid[d] === col) { seen[d] = 1; s.push(d); } } }
      tiles.forEach((t, i) => { t.style.background = PAINT[grid[i]]; t.classList.toggle('own', owned.has(i)); });
      const msg = $('.paint-msg', el);
      if (st.done) msg.innerHTML = `<b>${winLine(idx + 2)}</b> Painted in ${st.moves.length} moves ${starsFor(st.moves.length)} <button class="btn alt" data-share>Share</button>`;
      else msg.textContent = `moves: ${st.moves.length} · par ${pz.par} · ${Math.round((owned.size / (n * n)) * 100)}% painted`;
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-share]')) return share(`Paint the Ladies #${idx + 1} 🏠 ${st.moves.length} moves (par ${pz.par}) ${starsFor(st.moves.length)}\n${st.moves.slice(0, 30).map((m) => PAINT_EMOJI[m]).join('')}`);
      const a = e.target.closest('[data-a]');
      if (a && !st.done) {
        if (a.dataset.a === 'undo') st.moves.pop(); else st.moves = [];
        grid = pz.grid.slice(); st.moves.forEach((m) => { grid = flood(grid, n, m); });
        api.store.set(key, st); render(); return;
      }
      const p = e.target.closest('[data-p]'); if (!p || st.done) return;
      const c = +p.dataset.p; if (c === grid[0]) return;
      grid = flood(grid, n, c); st.moves.push(c); api.sfx.blip();
      if (grid.every((v) => v === grid[0])) { st.done = true; markDone(idx, 'paint', st.moves.length); api.sfx.chime(); api.burst(); }
      api.store.set(key, st); render();
    });
    render();
  }

  /* =================================================================
     HUB
     ================================================================= */
  const GAMES = [
    { id: 'words', name: 'Fog Words', icon: 'quotes', blurb: 'Guess the cozy 5-letter word', run: fogWords },
    { id: 'route', name: 'Cable Car Route', icon: 'study', blurb: 'One line through every square', run: cableRoute },
    { id: 'paint', name: 'Paint the Ladies', icon: 'memories', blurb: 'Flood the hill with one color', run: paintLadies },
  ];
  function streak() {
    let s = 0, i = todayIdx();
    if (!Object.keys(api.store.get(doneKey(i), {})).length) i--; // today not played yet doesn't break it
    while (Object.keys(api.store.get(doneKey(i), {})).length) { s++; i--; }
    return s;
  }

  window.SFGames = {
    mount(el, helpers) {
      api = helpers;
      let view = todayIdx(), cleanup = null;
      const min = todayIdx() - 364;
      function hub() {
        if (cleanup) { cleanup(); cleanup = null; }
        const done = api.store.get(doneKey(view), {}), t = todayIdx(), s = streak();
        const date = dateOf(view).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: view < t - 300 ? 'numeric' : undefined });
        el.innerHTML = `
          <div class="day-nav">
            <button class="btn ghost" data-nav="-1" ${view <= min ? 'disabled' : ''} aria-label="Previous day">◀</button>
            <div><b>Puzzle #${view + 1}</b><br><span class="muted">${view === t ? 'today · ' : ''}${date}</span></div>
            <button class="btn ghost" data-nav="1" ${view >= t ? 'disabled' : ''} aria-label="Next day">▶</button>
          </div>
          <div class="game-cards">${GAMES.map((g) => `
            <button class="game-card ${done[g.id] ? 'done' : ''}" data-g="${g.id}">
              <img class="pix" src="${api.icon(g.icon)}" alt="">
              <span class="gc-name">${g.name}</span><span class="gc-blurb">${g.blurb}</span>
              <span class="gc-status">${done[g.id] ? '✓ ' + (done[g.id] === true ? 'done' : g.id === 'paint' ? done[g.id] + ' moves' : done[g.id]) : 'play ▸'}</span>
            </button>`).join('')}</div>
          <p class="muted" style="text-align:center">🔥 ${s} day streak · ${Object.keys(done).length}/3 done ${view === t ? 'today' : 'this day'}</p>
          <p class="muted tiny" style="text-align:center">new puzzles every midnight · use ◀ to replay any of the last 365 days</p>`;
      }
      function open(id) {
        const g = GAMES.find((x) => x.id === id);
        el.innerHTML = `<div class="row" style="justify-content:space-between"><button class="btn ghost" data-back>◀ Games</button><span class="muted">${g.name} #${view + 1}</span></div><div class="game-body"></div>`;
        api.sfx.open();
        cleanup = g.run($('.game-body', el), view) || null;
      }
      el.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-nav]'); if (nav && !nav.disabled) { view = Math.max(min, Math.min(todayIdx(), view + +nav.dataset.nav)); api.sfx.blip(); return hub(); }
        const g = e.target.closest('[data-g]'); if (g) return open(g.dataset.g);
        if (e.target.closest('[data-back]')) { api.sfx.blip(); hub(); }
      });
      hub();
      return () => { if (cleanup) cleanup(); };
    },
    wordCount: WORDS.length,
    _genRoute: genRoute, _genPaint: genPaint, _answerFor: answerFor,
  };
})();

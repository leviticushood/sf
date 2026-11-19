# ♥ Isa & Levi's Little San Francisco

A cozy 8-bit San Francisco for relaxing, studying, and remembering us.
It's pure HTML/CSS/JS: no build step and no server, so it's free to host on GitHub Pages.

## What's inside

Click the sparkles in the city, or use the menu:

| Spot in the city | What it opens |
|---|---|
| ⛵ Sailboat | **Daily Bay Games**: Fog Words, Cable Car Route, Paint the Ladies (new puzzles daily, 365-day archive, streaks, share results) |
| 🌉 Golden Gate Bridge | Our quotes (save favorites ♥) |
| 🏠 Painted Ladies | Memories timeline (with photos) |
| 🚋 Cable car | Study timer (pomodoro, tomatoes, rain/waves/café sounds) |
| 📡 Sutro Tower | Music radio: 14 original 8-bit songs in Isa's favorite styles, plus your own mp3s |
| 🏙 Downtown | "Open when…" letters |
| ☁ Karl the Fog | Guided breathing (box, 4·7·8, easy) |
| 🗼 Coit Tower | Days-together counter & anniversary countdown |
| ☀/🌙 Sun / moon | Change the sky (dawn, day, sunset, night; auto follows her clock) |
| ✦ Stars (at night) | Make a wish. It becomes a pink star in the sky forever |
| 🍾 Bottle in the bay | A new love note every day |
| 👫 The two of you | A random "reason I love you" (click 7× fast for a secret 🎆) |

| 🎹 Piano (menu) | A playable 2-octave 8-bit piano with 5 sounds + **Follow the lights** to learn our songs |

On **Nov 13** there are fireworks and "November 13th" plays; on every 13th there's a monthiversary surprise.

Keyboard: `1`–`9` open menu items, `Esc` closes, `Space` starts/pauses the timer.

## Make it yours

Edit **`js/config.js`**: names, start date, quotes, reasons, memories, letters, daily notes and playlist.
Add songs to `music/` and photos to `photos/` (each folder has a README).

## Put it online (free) with GitHub Pages

1. Create a new repository on github.com (e.g. `our-sf`). Public is required for free Pages.
2. Upload everything in this folder (drag-and-drop on the repo page works), or:
   ```bash
   git init && git add . && git commit -m "our little SF" && git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/our-sf.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save**.
4. After about a minute it's live at `https://YOUR-USERNAME.github.io/our-sf/` 🎉

To preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

Saved stuff (wishes, game progress, favorites, timer settings) lives in her browser's local storage, so it stays on the device she uses.

## The 8-bit songbook (all original, generated live in the browser)

| Song | Style |
|---|---|
| November 13th | piano ballad, for the Elton John fan (our song) |
| Mon Cœur, Ma Chérie | swing ballad, Nat King Cole style |
| Velvet Objection | retro soul, Amy Winehouse vibes |
| Whistle Note for Isa | 90s R&B ballad, Mariah mode (with whistle-note runs) |
| Golden Hour, Tucson | afrobeats, Burna Boy feels |
| Sunny Riddim | dancehall, Popcaan & Kes energy |
| Late Night Library | late-night R&B with 808s, Brent & Summer moods |
| Saguaro Sunshine | sunny indie, Rex Orange County & Steve Lacy style |
| Bear Down Boogie | funk & disco, Bruno Mars & the Jacksons |
| Valse pour Isa | French musette waltz |
| Cumbia de Sacramento | cumbia, from Sacramento with love |
| Torts & Tea | lo-fi for case briefs |
| Fog City Study Beat | lo-fi study |
| Bay Lullaby | lullaby |

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
| 📡 Sutro Tower | Music radio (your mp3s + built-in chiptunes) |
| 🏙 Downtown | "Open when…" letters |
| ☁ Karl the Fog | Guided breathing (box, 4·7·8, easy) |
| 🗼 Coit Tower | Days-together counter & anniversary countdown |
| ☀/🌙 Sun / moon | Change the sky (dawn, day, sunset, night; auto follows her clock) |
| ✦ Stars (at night) | Make a wish. It becomes a pink star in the sky forever |
| 🍾 Bottle in the bay | A new love note every day |
| 👫 The two of you | A random "reason I love you" (click 7× fast for a secret 🎆) |

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

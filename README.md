# 🌁 Our SF

A cozy 8-bit San Francisco hideaway built for one special person. Soft sunset gradients, rolling fog, a pixel skyline, and two little characters on a bench at the vista point. It's a place to relax, study, play a few daily games, and look back on our story.

> Made with love. Best viewed on a phone, with headphones, on a slow evening.

---

## ✨ Features

### The Scene
- Hand-drawn pixel skyline: Golden Gate Bridge, Palace of Fine Arts, Coit Tower, Transamerica Pyramid, Salesforce Tower, Bay Bridge, Sutro Tower, and the Painted Ladies
- Sky that follows real San Francisco time: sunrise, golden hour, dusk, and starry nights
- Karl the Fog drifting through in parallax layers
- A cable car that rolls by, sea lions napping at Pier 39, sailboats on the bay
- Two chibi pixel characters (us!) who blink, bounce, and share hearts when tapped

### Clickable Landmarks
| Landmark | What it opens |
|---|---|
| Golden Gate Bridge | Our Story timeline |
| Painted Ladies | Memory Lane photo gallery |
| Coit Tower | Quote of the Day and all our quotes |
| Transamerica Pyramid | "Open When" letters |
| Salesforce Tower | Study Mode |
| Pier 39 | Daily Games |
| Bay Bridge | Guided breathing with pulsing bridge lights |
| Cable Car | Random "reasons I love you" |
| Sutro Tower | Settings |

### Study Mode
- Pomodoro timer with a pixel clock and gentle chime
- 8-bit lofi music player
- Ambient sound mixer: rain, waves, fog horn, cable car bell, cafe chatter
- Weekly focus minutes chart and encouraging messages after each session

### Daily Games
A new puzzle every day for at least 365 days, the same for everyone on a given day. Calm rules, soft animations, no stress.

- **Hoodle**: Guess today's mystery SF neighborhood or landmark. Each guess glows warmer as you get closer on the pixel map.
- **Fogword**: A cozy five-letter word game with unlimited guesses and a "lift the fog" hint.
- **Cable Car Chain**: Link the words from start to finish, one compound phrase at a time (SOUR → DOUGH → NUT → SHELL).

Every game has streaks, stats, an archive, and a share button that copies an emoji grid you can text.

### Little Extras
- Days-together counter with milestone confetti
- Countdown to our next visit
- Mood check-in with matching messages
- A memory jar that fills with a star each day you visit
- Seasonal scenes (New Year's fireworks, Valentine's hearts, Fleet Week, our anniversary)
- Hidden easter eggs 🥚
- Installable to your home screen and works offline

---

## 🛠 Tech Stack

- HTML, CSS, and vanilla JavaScript (ES modules)
- No build step, no backend, no frameworks
- Progress and settings saved locally in the browser (localStorage)
- Daily puzzles picked by a date-seeded random generator
- PWA manifest and service worker for offline use
- Hosted free on GitHub Pages

---

## 📁 Project Structure

```
/
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/            # styles for scene, modals, games
├── js/             # scene, characters, study mode, audio, storage, seed
│   └── games/      # hoodle.js, fogword.js, chain.js
├── data/           # all editable content (JSON)
└── assets/
    ├── sprites/    # pixel art
    ├── photos/     # memory lane photos
    ├── music/      # 8-bit lofi tracks
    └── sfx/        # ambient sounds and chimes
```

---

## 🚀 Run Locally

ES modules need a local server, so opening the file directly won't work. From the project folder:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open http://localhost:8000.

---

## 🌐 Deploy to GitHub Pages (free)

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch".
4. Pick the `main` branch and the `/ (root)` folder, then **Save**.
5. Wait a minute or two. Your site will be live at:
   `https://<your-username>.github.io/<repo-name>/`

Optional: add a custom domain under the same Pages settings.

---

## 💌 Personalizing

Everything personal lives in `/data` so you never have to touch the code.

| File | What to edit |
|---|---|
| `settings.json` | Names, the date you started dating, next visit date |
| `characters.json` | Hair, skin tone, outfits, accessories for both characters |
| `quotes.json` | Your inside jokes and favorite things you've said |
| `timeline.json` | Relationship milestones for the Our Story page |
| `open_when.json` | Letters for "open when you're stressed", "miss me", etc. |
| `reasons.json` | Reasons I love you |
| `playlist.json` | Track names and file paths for the music player |
| `neighborhoods.json` | Hoodle answers and map coordinates |
| `fogword_answers.json` | Daily Fogword answers (365+) |
| `chains.json` | Daily Cable Car Chain puzzles (365+) |

**Adding photos:** drop images into `/assets/photos/` and reference them in `timeline.json`.

**Adding music:** drop `.mp3` or `.ogg` files into `/assets/music/` and list them in `playlist.json`. Royalty-free 8-bit and chiptune lofi works great.

---

## 🗺 Roadmap

- [ ] Add 8-bit lofi soundtrack
- [ ] Add real photos and quotes
- [ ] Bonus logic puzzle (Zip / Queens style cable car route)
- [ ] More seasonal scenes
- [ ] Anniversary special scene

---

## 🙏 Credits

- Fonts: Press Start 2P and VT323 via Google Fonts
- Game inspiration: Wordle, Globle, Chainle, and the LinkedIn daily games
- Built with help from Claude
- Made for someone who loves San Francisco ❤️

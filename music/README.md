# 🎵 Put your music here

1. Drop `.mp3` (or `.ogg` / `.m4a`) files in this folder, e.g. `music/rainy-day-lofi.mp3`.
2. Open `js/config.js` and add each song to `playlist`:

```js
playlist: [
  { title: "Rainy Day Lofi", artist: "8-bit Artist", src: "music/rainy-day-lofi.mp3", study: true },
],
```

`study: true` marks the song as study music, so it plays when the focus timer starts.
Keep the file names lowercase with no spaces. GitHub Pages is case-sensitive.
Each file must be under 100 MB (GitHub's limit). Most songs are 3–8 MB.

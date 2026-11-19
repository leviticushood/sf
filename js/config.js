/* =====================================================================
   ♥  CONFIG — this is the only file you need to edit!  ♥
   Change names, dates, quotes, memories, letters and music here.
   Tip: keep the quotes "like this" and end each item with a comma.
   ===================================================================== */
window.SF_CONFIG = {
  herName: "Isa",          // shows on the welcome screen
  hisName: "Levi",
  siteTitle: "Isa & Levi's Little San Francisco",
  startDate: "2023-02-14",     // the day "us" started (YYYY-MM-DD)

  welcome: "Welcome home. Take a deep breath. The fog's rolling in, the bay is calm, and everything's going to be okay.",

  // Shown after she clicks the two of you 7 times quickly (fireworks!)
  secretMessage: "You found the secret! 🎆\nIsa, no matter how many fog days or how many exams, I'm always on your side. I love you more than sourdough loves San Francisco.",

  /* ---------- Golden Gate Bridge → our quotes ---------- */
  quotes: [
    { text: "Home isn't a place. It's the person standing next to me.", by: "Levi, about Isa" },
    { text: "Every version of tomorrow I picture has you in it.", by: "Levi" },
    { text: "I'd cross every bridge in this city just to sit next to you for five minutes.", by: "Levi" },
    { text: "You make ordinary days feel like a sunset at Ocean Beach.", by: "Levi" },
    { text: "Even Karl the Fog can't hide how bright you are.", by: "Levi" },
    { text: "REPLACE ME: something she said to you that you never want to forget.", by: "Isa" },
    { text: "REPLACE ME: an inside joke only the two of you get.", by: "Levi & Isa" },
  ],

  /* ---------- Clicking the two of you → reasons I love you ---------- */
  reasons: [
    "The way you laugh at your own jokes before you finish them.",
    "How hard you work, even when you're tired.",
    "Your hugs fix things I didn't know were broken.",
    "You make every place feel like home.",
    "You're kind to everyone, even when nobody's watching.",
    "Your smile in that yellow dress. Enough said.",
    "You believe in me more than I believe in myself.",
    "REPLACE ME: add as many reasons as you want!",
  ],

  /* ---------- Painted Ladies → our memories timeline ----------
     photo is optional: put images in the /photos folder, e.g. "photos/first-date.jpg" */
  memories: [
    { date: "2023-02-14", title: "The beginning", text: "The day everything changed. REPLACE ME with the real story.", photo: "" },
    { date: "2023-05-20", title: "First trip to the city", text: "Walking the Golden Gate in way too much wind and not caring at all.", photo: "" },
    { date: "2023-09-03", title: "Dolores Park picnic", text: "Sunshine, snacks, and the view of the skyline. REPLACE ME.", photo: "" },
    { date: "2024-02-14", title: "One year of us", text: "365 days and somehow I still get nervous when you text me.", photo: "" },
    { date: "2025-06-01", title: "That dinner (the photo!)", text: "Matching yellow, best night ever. REPLACE ME.", photo: "" },
  ],

  /* ---------- Downtown skyline → "open when..." letters ---------- */
  letters: [
    { title: "Open when you're stressed about school", body: "Hey you. Put the pen down for one minute.\n\nYou are SO much more capable than this one test, this one paper, this one week. I've watched you handle hard things over and over. Drink some water, start the study timer, and take it one little block at a time. I'm proud of you already.\n\nLove, Levi" },
    { title: "Open when you miss me", body: "I miss you too. Probably more.\n\nClose your eyes and imagine we're sitting on the hill at Alamo Square with the Painted Ladies behind us and the whole city in front of us. That's where I am in my head right now: next to you.\n\nCall me? ♥\n\nLevi" },
    { title: "Open when you can't sleep", body: "Turn on the Bay Lullaby, switch the sky to night, and count the stars. Each pink one is a wish you made.\n\nBreathe in for 4… hold… out for 8. You're safe, you're loved, and tomorrow is a new day." },
    { title: "Open when you need a laugh", body: "REPLACE ME with the funniest memory you two share." },
    { title: "Open when you've had a great day", body: "YESSS. Tell me everything. I want every detail. I'm so happy for you!" },
  ],

  /* ---------- Message in a bottle → one note per day (rotates daily) ---------- */
  dailyNotes: [
    "Good morning, beautiful. Today is lucky to have you.",
    "Reminder: you're doing better than you think.",
    "I hope today is as soft as the fog and as warm as a Mission burrito.",
    "Drink water. Stretch. Text me. In that order.",
    "Somewhere in this city, a cable car is ringing its bell just for you.",
    "You're my favorite notification.",
    "One step at a time. I'm right here.",
    "Today's forecast: 100% chance of me thinking about you.",
  ],

  /* ---------- Study timer pep talks ---------- */
  encouragements: [
    "Focus block done! I'm so proud of you 🍅",
    "Look at you go! Take a little break, you earned it.",
    "Another one down! Stretch, sip some water, smile.",
    "You're unstoppable. Like a cable car going downhill (but safe).",
    "Big brain energy detected. Break time ♥",
  ],

  /* ---------- Music ----------
     1) Drop .mp3 files into the /music folder
     2) List them here, like the example below (remove the // to enable it)          */
  playlist: [
    // { title: "Lofi Bay Breeze", artist: "8-bit Artist", src: "music/lofi-bay-breeze.mp3", study: true },
  ],
  includeBuiltInSongs: true,   // chiptune songs generated live in the browser (no files needed)
  autoplayMusic: true,         // start the first song when she presses Start
  defaultVolume: 0.45,

  /* ---------- Study timer defaults (minutes) ---------- */
  pomodoro: { focus: 25, short: 5, long: 15, longEvery: 4 },
};

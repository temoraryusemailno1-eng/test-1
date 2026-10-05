/* =====================================================================
   ✏️  EDIT THIS FILE TO PERSONALISE THE WEBSITE
   ---------------------------------------------------------------------
   • {name} anywhere in a text is replaced by `name` below.
   • Replace pictures by dropping new files into  assets/images/
     (keep the same file names, or change the paths here).
   • Replace the music by overwriting  audio/music.mp3
   ===================================================================== */
window.SITE_CONFIG = {
  name: "Cutie",

  /* Secret code on the first screen (digits only). 6 digits = 6 hearts. */
  passcode: "161003",

  music: {
    src: "audio/music.mp3",
    volume: 0.45            // 0 – 1
  },

  lock: {
    title: "Unlock Your Surprise",
    hint: "Enter the secret code to begin",
    wrong: "Oops, that's not it 💔  Try again"
  },

  gift: {
    title: "Something special is waiting...",
    hint: "Tap the button to open it ✨",
    button: "Open It!"
  },

  welcome: {
    line1: "Happy Birthday,",
    text: "You fill my life with pure happiness and sweetness everyday 🌸",
    button: "Let's explore"
  },

  memories: {
    title: "Sweet Memories",
    hint: "Swipe the photo to see next ✨",
    button: "Read My Letter",
    photos: [
      { src: "assets/images/memory-1.jpg", caption: "Just us" },
      { src: "assets/images/memory-2.jpg", caption: "Together" },
      { src: "assets/images/memory-3.jpg", caption: "Always close" }
    ]
  },

  mail: {
    title: "You've Got Mail! 🎀",
    hint: "Tap to open your special letter"
  },

  letter: {
    from: "For My Kuchu Puchu",
    pages: [
      {
        title: "Happy Birthday, Sukrita 🎂",
        paragraphs: [
          "Today is a beautiful reminder of how lucky I am to have someone as amazing as you in my life.",
          "You bring so much happiness, warmth, and positivity just by being yourself.",
          "Over time, so many wonderful memories and little moments have found a special place in my heart.",
          "No matter where life takes us, I will always cherish those moments and be grateful for having you in my life."
        ],
        button: "Read More"
      },
      {
        paragraphs: [
          "I hope your day is filled with love, laughter, happiness, and everything that makes you smile. Happy Birthday, Cutiepie. You are truly special to me. ❤️"
        ],
        signature: { big: "I love you, Sukrita.", small: "Always & forever" },
        back: "Back",
        button: "Continue"
      }
    ]
  },

  puzzle: {
    title: "Fix the Picture 🧩",
    image: "assets/images/puzzle-cake.jpg",
    grid: 3,                 // 3 x 3 pieces
    memorizeSeconds: 3,
    memorizeText: "Memorize the image! Shuffling in {s}s...",
    playText: "Tap two pieces to swap them!",
    swapsLabel: "Swaps",
    doneText: "Picture Fixed! 🎉",
    button: "Take the Quiz"
  },

  /* answer = index (starting at 0) of the correct option */
  quiz: [
    { q: "What comes after H?", options: ["K", "L", "I", "J"], answer: 2 },
    { q: "What comes after K?", options: ["M", "L", "N", "O"], answer: 1 },
    { q: "What comes after X?", options: ["W", "V", "Y", "Z"], answer: 2 },
    { q: "Put your last three answers together. What do they spell?", options: ["KMW", "ILY", "JOV", "LNZ"], answer: 1 },
    { q: "What does ILY mean?", options: ["I Love You", "I Like You", "I Lost You", "I Leave You"], answer: 0 }
  ],

  result: {
    title: "Quiz Complete :)",
    text: "You got {score} out of {total} right! 💕",
    button: "One Last Thing"
  },

  finale: {
    photo: "assets/images/cat.webp",        // animated picture (any jpg/png/webp/gif works)
    kicker: "Once again,",
    title: "Happy Birthday, {name}",
    text: "I hope this little surprise made you smile as much as you make me smile every single day. I love you endlessly! 💕",
    button: "Relive it"
  }
};

# 🎂 Birthday Surprise Website

A pink, glass-style birthday surprise: secret-code lock → gift → birthday card → swipeable photo memories → love letter → "Fix the Picture" puzzle → 5-question quiz → final message.
Pure **HTML + CSS + JavaScript** – no build step, no installs.

---

## 📁 Folder structure

```
birthday-surprise/
├─ index.html            ← the page (open this)
├─ css/
│  └─ style.css          ← all the styling (colours, glass effect, animations)
├─ js/
│  ├─ config.js          ← ✏️ EDIT THIS: name, passcode, texts, letter, quiz, photo paths
│  └─ app.js             ← the engine (screens, music, puzzle, quiz, confetti …)
├─ assets/
│  └─ images/            ← background, photos, puzzle picture, animated cat, icon
├─ audio/
│  └─ music.mp3          ← background music (loops forever)
└─ .vscode/
   ├─ launch.json        ← press F5 to run
   ├─ tasks.json         ← built-in local server task
   ├─ settings.json      ← Live Server settings
   └─ extensions.json    ← recommends the Live Server extension
```

## ▶️ How to run in VS Code

1. **File → Open Folder…** and choose the `birthday-surprise` folder.
2. Pick any one of these:
   - **Press `F5`** → choose *Chrome – open index.html (music autoplays)*.
     This opens Chrome with autoplay allowed, so the music starts **the moment the page opens**.
   - **Live Server**: install the *Live Server* extension (VS Code suggests it), then click **Go Live** at the bottom right.
   - **Just double-click `index.html`** – it also works straight from the file.

> **Secret code:** `123456`  (change it in `js/config.js`)

## 🎵 About the music

Browsers block sound until the visitor interacts with the page. The site handles this for you:

- It tries to start the music immediately on load.
- If the browser blocks it, a small hint appears at the top-right and the music starts on the **very first tap / click / key press** (for example the first number on the keypad).
- It fades in softly, loops forever, and the 🎚 button (top-right) turns it on/off.
- With the **F5 launch configurations** in `.vscode/launch.json`, Chrome/Edge are started with `--autoplay-policy=no-user-gesture-required`, so it plays instantly.

**Use your own song:** put your file in `audio/` and either name it `music.mp3` (replace the old one) or change `music.src` in `js/config.js`.

## ✏️ Make it yours (all in `js/config.js`)

| What | Where in `config.js` |
|------|----------------------|
| Name used everywhere (`Cutie`) | `name` |
| Secret code | `passcode` |
| Birthday card text | `welcome` |
| Photos + captions (any number) | `memories.photos` |
| Love letter (2 pages + signature) | `letter.pages` |
| Puzzle picture & number of pieces | `puzzle` |
| Quiz questions / answers | `quiz` (`answer` = number of the right option, starting at 0) |
| Final picture & message | `finale` |

Replace pictures by dropping new files into `assets/images/` (same file names, or update the paths).
Best photo size: about **800 × 900 px** for memories, **square 1000 × 1000 px** for the puzzle, **square 600 × 600 px** for the final picture (jpg, png, webp or gif).

> The photos that come with the project (couple silhouettes, birthday cake, cat) are **placeholders** taken from your reference video. Swap them for your own.

## 🔤 Fonts

The fonts (*Gaegu* and *Dancing Script*) load from Google Fonts, so the first visit needs internet. Offline, the site still works with similar fallback fonts.

## 🛠 Troubleshooting

- **No music?** Click/tap once anywhere. Check that `audio/music.mp3` exists and your volume is up.
- **Puzzle or photos don't show?** Keep the folder structure exactly as above (don't move `index.html` out of the main folder).
- **F5 does nothing?** Make sure Chrome or Edge is installed. For the "Python server" options you need Python installed.

Made with 💖

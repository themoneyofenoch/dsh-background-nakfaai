# dsh-background-nakfaai

A background skin for **DeepSeek Harness**. Set a different background image for the **left bar**, **main chat**, and **right workbench** — each with its own **strength** (darkness / readability) control.

![icon](https://img.shields.io/badge/DSH-0.1.x-4d6bfe) ![license](https://img.shields.io/badge/license-MIT-yellow)

## ✨ What it does

- **Per-zone backgrounds** — pick an image for the left sidebar, the main chat area, and the right workbench panel independently.
- **Strength slider** per zone — **Strong** = darker overlay (text very readable), **Weak** = brighter image.
- **Small picker button (🌌)** — sits just above the Open Sea skin control, anchored to the Settings trigger so it stays proportional.
- **Bundled default image** — works out of the box; add your own images in seconds.
- **Persists** your per-zone choices across refresh / restart.

## 🚀 Install

One line, from any DSH profile:

```sh
dsh plugin --profile web add github:themoneyofenoch/dsh-background-nakfaai
```

Then **hard-refresh the browser** (Cmd/Ctrl+Shift+R). Click the **🌌** button to open the picker and set each zone.

## 🖼️ Add your own images

Drop image files (`.png` / `.jpg` / `.webp` / `.avif`) into `~/.dsh/background` — the picker lists them automatically on the next restart, no configuration needed. To use a different folder instead, set `SIDEBAR_BG_DIR`:

```sh
SIDEBAR_BG_DIR=~/dsh-backgrounds dsh web
```

> If the picker shows **"Loading images…"** with an error, the host routes need the harness restarted — restart `dsh web`, then hard-refresh.

## 🧹 Remove

```sh
dsh plugin --profile web remove dsh-background-nakfaai
```

## 🛠️ How it works

- Host half registers routes on the harness web server to serve the bundled images and a JSON listing.
- Client half injects per-zone CSS and a small picker; choices persist in the browser (`localStorage`).
- Works for any DSH `0.1.x` release; no build step needed.

## 📄 License

MIT. See `LICENSE`.

## Author

[themoneyofenoch](https://github.com/themoneyofenoch)

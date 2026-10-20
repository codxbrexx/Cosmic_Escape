# Cosmic Escape 🚀

A high-octane retro-futuristic cosmic arcade game built with **Vanilla JavaScript (ES6+)**, **HTML5 Canvas**, **Tailwind CSS**, and **Vite**.

Survive the cosmic void, weave through asteroid fields, evade alien UFOs, and out-pilot the galactic mothership.

---

## 🎮 Game Modes

1. **CLASSIC ARCADE**
   * The original retro simulation.
   * Dodge asteroids and alien UFOs.
   * Dynamic speed acceleration as your score increases.
   * Collect cosmic gold coins for bonus points (+100 PTS).

2. **GALACTIC ODYSSEY (Story Mode)**
   * Deep-space expedition across dynamic cosmic sectors.
   * Collect coins to earn extra shields/lives (10 Coins = +1 Life).
   * Heart drops every 500 points to recover critical hull integrity.
   * Mothership Interception: evade sweeping orbital plasma beams and collect Overdrive EMP Cores to trigger Hyperdrive and escape!

3. **SURVIVAL PROTOCOL**
   * High-intensity agility trial.
   * Survive 30 seconds per wave against escalating cosmic hazards.
   * Clearing a wave grants +3000 PTS and shield recovery.

---

## 📱 Mobile & Desktop Controls

Fully optimized for **Desktop** (Keyboard) and **Mobile / Tablet** (Touch & Haptics):

| Action | Desktop (Keyboard) | Mobile / Tablet (Touch) |
| :--- | :--- | :--- |
| **Thrust / Ascend** | `Arrow Up` / `Space` / `W` | `▲ FLY` Virtual Button / Tap & Hold screen |
| **Steer Left / Right** | `Arrow Left` / `Arrow Right` / `A` / `D` | `◀` / `▶` Virtual Buttons / Horizontal Drag |
| **Pause / Resume** | `P` / `Esc` | `⏸️` On-screen Pause Button |
| **Fullscreen Mode** | Browser F11 | `⛶` Native Fullscreen Toggle Button |
| **Toggle Audio** | 🔊 / 🔇 Button in HUD & Menu | 🔊 / 🔇 Button |
| **Haptic Feedback** | N/A | Tactile vibration on thrust, coins, and impacts |

---

## 🛠️ Architecture & Tech Stack

* **Game Engine**: Custom object-oriented Canvas engine with unified `BaseMode` architecture.
* **Audio Synthesizer & Haptics**: Procedural Web Audio API sound generator + Navigator Vibrate API.
* **Score System**: Type-safe local storage score manager with real-time high score tracking per mode.
* **Responsive Styling**: Tailwind CSS, CSS dynamic viewport (`100dvh`), and Press Start 2P typography.
* **Build Tool**: Vite.

---

## 📦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## 👨‍💻 Creator

Built by **[CODXBREXX](https://github.com/codxbrexx)**.

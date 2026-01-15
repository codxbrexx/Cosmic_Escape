# Cosmic Escape

A modern, high-octane architectural arcade shooter built with **Vite**, **Tailwind CSS**, and **Canvas**.

![Game Preview](https://via.placeholder.com/800x400?text=Cosmic+Escape) 
*(Replace with actual screenshot)*

## 🚀 Mission Briefing

**Cosmic Escape** puts you in the cockpit of a lone starfighter. Your mission is simple: survive the infinite void. 

The game features two distinct modes:

*   **GALACTIC ODYSSEY (Story Mode)**: A tailored campaign across 500 sectors. Battle immense bosses every 10 levels, collect hearts to repair your hull, and upgrade your ship.
*   **CLASSIC ARCADE (Survival Mode)**: The original simulation. Scaling difficulty, one life, infinite danger. Compete for the ultimate High Score.

## 🎮 Controls

The game fully supports both **Keyboard** (Desktop) and **Touch** (Mobile/Tablet) controls.

| Action | Desktop (Keyboard) | Mobile (Touch) |
| :--- | :--- | :--- |
| **Thrust** | Arrow Up / Space | On-Screen Button (⬆️) |
| **Rotate** | Arrow Left / Right | On-Screen Buttons (⬅️ / ➡️) |
| **Fire** | F / Z / Ctrl | On-Screen Button (FIRE) |
| **Pause** | P / Esc | Top-Right Icon (⏸️) |

## 🛠️ Tech Stack

*   **Core**: Vanilla JavaScript (ES6+)
*   **Rendering**: HTML5 Canvas API
*   **Styling**: Tailwind CSS (Utility-first)
*   **Build Tool**: Vite
*   **Animations**: GSAP (GreenSock Animation Platform)

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/codxbrexx/Cosmic_Escape.git
    cd Cosmic_Escape
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` (or the port shown in terminal) to play.

4.  **Build for Production**:
    ```bash
    npm run build
    ```

## 🌌 Features

*   **Responsive Design**: Automatically scales from Mobile to Desktop (2:1 Aspect Ratio).
*   **Mobile Optimized**: `touch-none` handling, large hit zones, and dedicated mobile UI.
*   **Persistent Scores**: High scores are saved locally for both Story and Classic modes.
*   **Monochrome Aesthetic**: A sleek, high-contrast black and white theme inspired by retro terminals.

## 👨‍💻 Creator

Built by **[CODXBREXX](https://github.com/codxbrexx)**.

> "Building digital universes one line of code at a time."

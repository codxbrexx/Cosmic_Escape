# Cosmic Escape

A modern, high-octane architectural arcade shooter built with **Vite**, **Tailwind CSS**, and **Canvas**.

![Game Preview](https://via.placeholder.com/800x400?text=Cosmic+Escape) 
*(Replace with actual screenshot)*

## 🚀 Mission Briefing

**Cosmic Escape** puts you in the cockpit of a lone starfighter. Your mission is simple: survive the infinite void. 

The game features three distinct modes:

*   **GALACTIC ODYSSEY (Story Mode)**: A tailored campaign across 500 sectors.
    *   **Progression**: Level up to upgrade your ship (Faster Fire Rate).
    *   **Bosses**: Battle immense bosses every 10 levels.
    *   **Economy**: Collect Coins to gain Hearts (10 Coins = +1 Life).
*   **SURVIVAL PROTOCOL**: A high-intensity challenge.
    *   **Objective**: Survive for 30 Seconds per level.
    *   **Weapons Free**: Blast through dense asteroid fields and UFO swarms.
    *   **No Bosses**: Pure hazard avoidance and elimination.
*   **CLASSIC ARCADE**: The original simulation. Scaling difficulty, one life, infinite danger.

## 🎮 Controls

The game fully supports both **Keyboard** (Desktop) and **Touch** (Mobile/Tablet) controls.

| Action | Desktop (Keyboard) | Mobile (Touch) |
| :--- | :--- | :--- |
| **Move** | Arrow Keys | Touch & Drag (Anywhere) |
| **Fire** | F / Z / Ctrl | Auto / Tap (Mode Dependent) |
| **Pause** | P / Esc | Top-Left Icon (⏸️) |

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
*   **Mobile Optimized**: `touch-none` handling, dynamic joystick-like control.
*   **Visual Polish**: Dynamic borders, particle explosions, and sector announcements.
*   **Persistent Scores**: High scores are saved locally for all modes.
*   **Monochrome & Color**: A sleek aesthetic that evolves as you play.

## 👨‍💻 Creator

Built by **[CODXBREXX](https://github.com/codxbrexx)**.

> "Building digital universes one line of code at a time."

// --- CONSTANTS & CONFIG ---
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.25;
const THRUST_FORCE = -6;
const GAME_SPEED_START = 6;
const MAX_SPEED = 15;

// Colors
const COLOR_SHIP = '#00FFCC'; // Neon Cyan
const COLOR_ENGINE = '#FF00FF'; // Magenta
const COLOR_ASTEROID = '#888888';
const COLOR_UFO = '#00FF00'; // Neon Green
const COLOR_STAR = '#FFFFFF';
const COLOR_COIN = '#FFD700'; // Gold

// Level Themes (Background Gradients)
const LEVEL_THEMES = [
    "linear-gradient(to bottom, #000000 0%, #1a1a2e 100%)", // L1: Deep Blue (Default)
    "linear-gradient(to bottom, #1a0b2e 0%, #3a0e35 100%)", // L2: Nebula Purple
    "linear-gradient(to bottom, #2e0b0b 0%, #3a0e0e 100%)", // L3: Mars Red
    "linear-gradient(to bottom, #001a0a 0%, #003311 100%)", // L4: Alien Green
    "linear-gradient(to bottom, #2e1a0b 0%, #3a2e0e 100%)", // L5: Solar Orange
];

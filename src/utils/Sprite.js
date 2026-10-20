// --- PIXEL ART DEFINITONS & OPTIMIZED SPRITE ENGINE ---

// SPACESHIP SPRITE
const SPRITE_SHIP = [
    "00000010000",
    "00000111000",
    "00001111100",
    "00111111111",
    "011111011111", // Cockpit window
    "111111111111",
    "001100000110", // Engines
    "001100000110",
];

// ASTEROID SPRITE
const SPRITE_ASTEROID = [
    "000111100",
    "011111110",
    "111111111",
    "111101111", // Crater
    "111111111",
    "011111100",
];

// UFO SPRITE
const SPRITE_UFO = [
    "000011110000",
    "001111111100",
    "011101101110", // Lights
    "111111111111",
    "001100001100",
];

// COIN SPRITE
const SPRITE_COIN = [
    "0011100",
    "0111110",
    "1101111",
    "1111011",
    "0111110",
    "0011100",
];

// BOSS / MOTHERSHIP SPRITE
const SPRITE_BOSS = [
    "0011111111111100",
    "0111111111111110",
    "1110011111100111",
    "1110011111100111",
    "1111111111111111",
    "0111110000111110",
    "0011100110011100",
    "0001000110001000",
];

export class Sprite {
    constructor(bitmaps, scale = 4) {
        if (!Array.isArray(bitmaps[0])) {
            this.frames = [bitmaps];
        } else {
            this.frames = bitmaps;
        }

        this.scale = scale;
        this.height = this.frames[0].length * scale;
        this.width = this.frames[0][0].length * scale;
        // Offscreen hardware-accelerated canvas cache
        this.cache = new Map();
    }

    getRenderedCanvas(frameIndex, color) {
        const key = `${frameIndex}_${color}`;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const offscreen = document.createElement('canvas');
        offscreen.width = this.width;
        offscreen.height = this.height;
        const oCtx = offscreen.getContext('2d');

        const frame = this.frames[frameIndex % this.frames.length];
        oCtx.fillStyle = color;
        for (let r = 0; r < frame.length; r++) {
            for (let c = 0; c < frame[r].length; c++) {
                if (frame[r][c] === '1') {
                    oCtx.fillRect(c * this.scale, r * this.scale, this.scale, this.scale);
                }
            }
        }

        this.cache.set(key, offscreen);
        return offscreen;
    }

    draw(ctx, x, y, frameIndex = 0, color = '#FFF') {
        const cached = this.getRenderedCanvas(frameIndex, color);
        ctx.drawImage(cached, x, y);
    }
}

// Instantiate Sprites with cached offscreen rendering
export const shipSprite = new Sprite(SPRITE_SHIP, 4);
export const asteroidSprite = new Sprite(SPRITE_ASTEROID, 6);
export const ufoSprite = new Sprite(SPRITE_UFO, 4);
export const coinSprite = new Sprite(SPRITE_COIN, 4);
export const bossSprite = new Sprite(SPRITE_BOSS, 12);

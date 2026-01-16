// --- PIXEL ART DEFINITONS ---

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


class Sprite {
    constructor(bitmaps, scale = 4) { 
        if (!Array.isArray(bitmaps[0])) {
            this.frames = [bitmaps];
        } else {
            this.frames = bitmaps;
        }

        this.scale = scale;
        this.height = this.frames[0].length * scale;
        this.width = this.frames[0][0].length * scale;
    }

    draw(ctx, x, y, frameIndex = 0, color = '#FFF') {
        const frame = this.frames[frameIndex % this.frames.length];

        ctx.fillStyle = color;
        for (let r = 0; r < frame.length; r++) {
            for (let c = 0; c < frame[r].length; c++) {
                if (frame[r][c] === '1') {
                    ctx.fillRect(x + c * this.scale, y + r * this.scale, this.scale, this.scale);
                }
            }
        }
    }
}

// Instantiate Sprites (These will be used by classes)
const shipSprite = new Sprite(SPRITE_SHIP, 4);
const asteroidSprite = new Sprite(SPRITE_ASTEROID, 6); // Bigger asteroids
const ufoSprite = new Sprite(SPRITE_UFO, 4);
const coinSprite = new Sprite(SPRITE_COIN, 4);

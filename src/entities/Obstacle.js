import { asteroidSprite, ufoSprite } from '../utils/Sprite.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_ASTEROID, COLOR_UFO } from '../constants.js';

export class Obstacle {
    constructor(type) {
        this.type = type;
        this.markedForDeletion = false;
        this.x = CANVAS_WIDTH + Math.random() * 200;

        // Random Y position
        this.y = Math.random() * (CANVAS_HEIGHT - 50);

        if (type === 'asteroid') {
            this.sprite = asteroidSprite;
            this.color = COLOR_ASTEROID;
        } else {
            this.sprite = ufoSprite;
            this.color = COLOR_UFO;
        }

        this.width = this.sprite.width;
        this.height = this.sprite.height;
    }

    update(gameSpeed, frameCount, dt = 1) {
        this.x -= gameSpeed * dt;

        if (this.type === 'ufo') {
            this.x -= 2 * dt; // UFOs vary speed
            this.y += Math.sin(frameCount * 0.05) * 2 * dt; // Hover effect
        }

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        this.sprite.draw(ctx, this.x, this.y, 0, this.color);
    }
}

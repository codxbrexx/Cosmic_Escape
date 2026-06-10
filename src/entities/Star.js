import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class Star {
    constructor() {
        this.x = Math.random() * CANVAS_WIDTH;
        this.y = Math.random() * CANVAS_HEIGHT;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 3 + 0.5;
        this.brightness = Math.random();
    }

    update(gameSpeed, dt = 1) {
        this.x -= this.speed * (gameSpeed * 0.1) * dt;
        if (this.x < 0) {
            this.x = CANVAS_WIDTH;
            this.y = Math.random() * CANVAS_HEIGHT;
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

import { Sprite } from '../utils/Sprite.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_SPEED_START } from '../constants.js';

export class Heart {
    constructor() {
        this.x = CANVAS_WIDTH;
        this.y = Math.random() * (CANVAS_HEIGHT - 30);
        this.width = 20;
        this.height = 20;
        this.speedX = 3;
        this.markedForDeletion = false;

        // Pulse animation state
        this.scale = 1;
        this.growing = true;
    }

    update(gameSpeed) {
        this.x -= this.speedX + (gameSpeed - GAME_SPEED_START);

        if (this.x + this.width < 0) this.markedForDeletion = true;

        // Pulse
        if (this.growing) {
            this.scale += 0.02;
            if (this.scale > 1.3) this.growing = false;
        } else {
            this.scale -= 0.02;
            if (this.scale < 0.8) this.growing = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.scale, this.scale);

        // Draw Heart Shape
        ctx.fillStyle = '#FF0044';
        ctx.shadowColor = '#FF0044';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        let topCurveHeight = this.height * 0.3;
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(0, 0, -this.width / 2, 0, -this.width / 2, topCurveHeight);
        ctx.bezierCurveTo(-this.width / 2, (this.height + topCurveHeight) / 2, 0, this.height, 0, this.height);
        ctx.bezierCurveTo(0, this.height, this.width / 2, (this.height + topCurveHeight) / 2, this.width / 2, topCurveHeight);
        ctx.bezierCurveTo(this.width / 2, 0, 0, 0, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

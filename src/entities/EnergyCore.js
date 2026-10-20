import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class EnergyCore {
    constructor() {
        this.x = CANVAS_WIDTH;
        this.y = 80 + Math.random() * (CANVAS_HEIGHT - 160);
        this.width = 24;
        this.height = 24;
        this.speedX = 3.5;
        this.markedForDeletion = false;
        this.pulse = 0;
    }

    update(gameSpeed, dt = 1) {
        this.x -= (this.speedX + (gameSpeed * 0.2)) * dt;
        this.pulse += 0.08 * dt;

        if (this.x + this.width < -20) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        const scale = 1 + Math.sin(this.pulse) * 0.2;
        ctx.scale(scale, scale);

        // Glowing Diamond / EMP Orb
        ctx.fillStyle = '#00FFCC';
        ctx.shadowColor = '#00FFCC';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

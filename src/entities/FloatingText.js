export class FloatingText {
    constructor(x, y, text, color = '#FFFFFF', size = 12) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 1.0;
        this.vy = -1.2;
        this.markedForDeletion = false;
    }

    update(dt = 1) {
        this.y += this.vy * dt;
        this.life -= 0.02 * dt;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px "Press Start 2P", monospace`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

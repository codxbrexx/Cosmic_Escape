export class Particle {
    constructor(x = 0, y = 0, color = '#FFF', speed = 5, size = 3) {
        this.reset(x, y, color, speed, size);
    }

    reset(x, y, color, speed, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * size + 1;
        this.speedX = Math.random() * speed - speed / 2;
        this.speedY = Math.random() * speed - speed / 2;
        this.life = 1.0;
        this.active = true;
    }

    update(dt = 1) {
        if (!this.active) return;
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;
        this.life -= 0.05 * dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.life <= 0) return;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

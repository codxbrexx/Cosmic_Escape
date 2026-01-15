import { bossSprite } from '../utils/Sprite.js';
import { Projectile } from './Projectile.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class Boss {
    constructor(level) {
        this.sprite = bossSprite;
        this.x = CANVAS_WIDTH - 200;
        this.y = CANVAS_HEIGHT / 2;
        this.width = this.sprite.width;
        this.height = this.sprite.height;
        this.maxHp = 20 + (level * 2);
        this.hp = this.maxHp;
        this.markedForDeletion = false;

        // AI State
        this.moveTimer = 0;
        this.shootTimer = 0;
        this.direction = 1;
    }

    update(projectiles, ship) {
        // Entrance animation
        if (this.x > CANVAS_WIDTH - 300) {
            this.x -= 2;
        }

        // Bob Up/Down
        this.moveTimer += 0.05;
        this.y += Math.sin(this.moveTimer) * 2;

        // Clamp Y
        if (this.y < 0) this.y = 0;
        if (this.y > CANVAS_HEIGHT - this.height) this.y = CANVAS_HEIGHT - this.height;

        // Shoot at player
        this.shootTimer++;
        if (this.shootTimer > 60) { // Shoot every second (approx)
            this.shootTimer = 0;
            // Spawn bullet aimed roughly at ship y
            projectiles.push(new Projectile(this.x, this.y + this.height / 2, true));
        }
    }

    draw(ctx) {
        // Flash red if hit (handled by logic, but valid visual feedback could go here)
        this.sprite.draw(ctx, this.x, this.y, 0, '#FF0055');

        // Health Bar
        const barWidth = 100;
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#550000';
        ctx.fillRect(this.x + 10, this.y - 20, barWidth, 10);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 10, this.y - 20, barWidth * hpPercent, 10);
    }
}

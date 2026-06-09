import { bulletSprite } from '../utils/Sprite.js';
import { CANVAS_WIDTH } from '../constants.js';

export class Projectile {
    constructor(x, y, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.isEnemy = isEnemy;
        this.sprite = bulletSprite;
        this.width = this.sprite.width;
        this.height = this.sprite.height;
        this.markedForDeletion = false;
        this.speed = isEnemy ? -8 : 12; // Enemy shoots Left, Player shoots Right
        this.color = isEnemy ? '#FF0000' : '#00FFCC';
    }

    update(dt = 1) {
        this.x += this.speed * dt;

        // Despawn if off screen
        if (this.x > CANVAS_WIDTH + 50 || this.x < -50) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        this.sprite.draw(ctx, this.x, this.y, 0, this.color);
    }
}

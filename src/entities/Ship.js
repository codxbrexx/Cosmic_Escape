import { shipSprite } from '../utils/Sprite.js';
import { Particle } from './Particle.js';
import { Projectile } from './Projectile.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, THRUST_FORCE, COLOR_SHIP, COLOR_ENGINE } from '../constants.js';

export class Ship {
    constructor() {
        this.x = 100;
        this.y = CANVAS_HEIGHT / 2;
        this.vy = 0;
        this.width = shipSprite.width;
        this.height = shipSprite.height;
        this.thrusting = false;
    }

    // Pass an onCreateParticle callback or the particles array
    update(particles, frameCount, invulnerableTimer, loseLifeCallback, createExplosionCallback) {
        // Physics
        if (this.thrusting) {
            this.vy += THRUST_FORCE * 0.10; // sensitivity of thrust
            if (frameCount % 3 === 0) {
                particles.push(new Particle(this.x, this.y + this.height - 10, COLOR_ENGINE, 4, 3));
            }
            this.vy += GRAVITY;
        }

        // Apply Drag (Air Resistance) for smoothness
        this.vy *= 0.96;

        // Cap speed
        if (this.vy > 8) this.vy = 8;
        if (this.vy < -8) this.vy = -8;

        this.y += this.vy;

        // Bounds X (Safety Clamp)
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

        // Bounds
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }
        if (this.y + this.height > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.height;
            if (invulnerableTimer <= 0) {
                loseLifeCallback();
                createExplosionCallback(this.x + this.width / 2, this.y + this.height, '#FF4444');
                this.vy = -12; // Hard bounce
            }
        }
    }

    draw(ctx) {
        shipSprite.draw(ctx, this.x, this.y, 0, COLOR_SHIP);

        // Draw Engine flame if thrusting
        if (this.thrusting) {
            // Main engine glare
            ctx.fillStyle = COLOR_ENGINE;
            ctx.fillRect(this.x, this.y + this.height - 5, 8, 15 + Math.random() * 10);
        }
    }

    shoot(projectiles) {
        // Spawn bullet at the nose of the ship
        // Nose is roughly x + width, y + height/2
        projectiles.push(new Projectile(this.x + this.width, this.y + this.height / 2, false));
    }
}

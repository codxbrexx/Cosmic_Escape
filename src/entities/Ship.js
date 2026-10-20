import { shipSprite } from '../utils/Sprite.js';
import { Particle } from './Particle.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { sounds } from '../utils/SoundManager.js';
import { SkinManager } from '../utils/SkinManager.js';

export class Ship {
    constructor(config = {}) {
        this.x = 100;
        this.y = CANVAS_HEIGHT / 2;
        this.vy = 0;
        this.width = shipSprite.width;
        this.height = shipSprite.height;
        this.thrusting = false;

        // Physics Config
        this.gravity = config.gravity || 0.22;
        this.thrust = config.thrust || -5.5;
        this.drag = config.drag || 0.96;

        // Equipped Cosmetic Skin
        this.skin = SkinManager.getEquippedSkin();
    }

    update(particles, frameCount, invulnerableTimer, loseLifeCallback, createExplosionCallback, dt = 1) {
        // Physics — all forces scaled by dt for frame-rate independence
        if (this.thrusting) {
            this.vy += this.thrust * 0.10 * dt;
            sounds.playThrust();

            // Ion Thruster Particles matching equipped chassis colors
            if (frameCount % 2 === 0) {
                particles.push(new Particle(this.x - 4, this.y + this.height * 0.65, this.skin.exhaustPrimary, 4, 3));
                particles.push(new Particle(this.x - 2, this.y + this.height * 0.85, this.skin.exhaustSecondary, 3, 2.5));
            }
        }

        // Gravity always applies
        this.vy += this.gravity * dt;

        // Air Resistance / Inertial Drag
        this.vy *= Math.pow(this.drag, dt);

        // Cap vertical velocity for smooth maneuverability
        if (this.vy > 8.5) this.vy = 8.5;
        if (this.vy < -8.5) this.vy = -8.5;

        this.y += this.vy * dt;

        // Bounds X
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

        // Bounds Y (Floor & Ceiling)
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }
        if (this.y + this.height > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.height;
            if (invulnerableTimer <= 0) {
                loseLifeCallback('lower_barrier');
                createExplosionCallback(this.x + this.width / 2, this.y + this.height, '#FF4444');
                this.vy = -10; // Bounce off the lower barrier
            }
        }
    }

    draw(ctx) {
        // Thruster glow when thrusting
        if (this.thrusting) {
            ctx.save();
            ctx.shadowColor = this.skin.engineGlow;
            ctx.shadowBlur = 12;
            shipSprite.draw(ctx, this.x, this.y, 0, this.skin.shipColor);
            ctx.restore();
        } else {
            shipSprite.draw(ctx, this.x, this.y, 0, this.skin.shipColor);
        }
    }
}

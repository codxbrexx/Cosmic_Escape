import { bossSprite } from '../utils/Sprite.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

export class Boss {
    constructor(level = 1) {
        this.sprite = bossSprite;
        this.x = CANVAS_WIDTH;
        this.targetX = CANVAS_WIDTH - 240;
        this.y = CANVAS_HEIGHT / 2 - 40;
        this.width = this.sprite.width;
        this.height = this.sprite.height;

        // Boss Evasion State: collect energy cores to disable
        this.maxCores = 3;
        this.coresRemaining = this.maxCores;
        this.markedForDeletion = false;

        // AI & Laser Sweep
        this.moveTimer = 0;
        this.beamTimer = 0;
        this.beamCharging = false;
        this.beamActive = false;
        this.beamY = 0;
        this.beamHeight = 24;
    }

    update(dt = 1) {
        // Entrance animation
        if (this.x > this.targetX) {
            this.x -= 2.5 * dt;
            if (this.x < this.targetX) this.x = this.targetX;
        }

        // Bob up and down smoothly
        this.moveTimer += 0.03 * dt;
        this.y = (CANVAS_HEIGHT / 2 - this.height / 2) + Math.sin(this.moveTimer) * (CANVAS_HEIGHT * 0.3);

        // Clamp Y
        if (this.y < 30) this.y = 30;
        if (this.y > CANVAS_HEIGHT - this.height - 30) this.y = CANVAS_HEIGHT - this.height - 30;

        // Beam Attack Cycle
        this.beamTimer += dt;
        if (this.beamTimer > 180 && !this.beamCharging && !this.beamActive) {
            // Start telegraphing beam at current Y
            this.beamCharging = true;
            this.beamY = this.y + this.height / 2;
        } else if (this.beamCharging && this.beamTimer > 240) {
            // Activate beam for 40 frames
            this.beamCharging = false;
            this.beamActive = true;
        } else if (this.beamActive && this.beamTimer > 280) {
            // Turn off beam
            this.beamActive = false;
            this.beamTimer = 0;
        }
    }

    draw(ctx) {
        // Draw boss sprite with neon alien glow
        ctx.save();
        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 15;
        this.sprite.draw(ctx, this.x, this.y, 0, '#FF0055');
        ctx.restore();

        // Telegraph Beam (Warning line)
        if (this.beamCharging) {
            ctx.save();
            ctx.strokeStyle = (Math.floor(this.beamTimer / 4) % 2 === 0) ? 'rgba(255, 0, 85, 0.7)' : 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.moveTo(0, this.beamY);
            ctx.lineTo(this.x, this.beamY);
            ctx.stroke();
            ctx.restore();
        }

        // Active Plasma Beam Sweep
        if (this.beamActive) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 85, 0.85)';
            ctx.shadowColor = '#FF0055';
            ctx.shadowBlur = 20;
            ctx.fillRect(0, this.beamY - this.beamHeight / 2, this.x, this.beamHeight);

            // Core white beam
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, this.beamY - 4, this.x, 8);
            ctx.restore();
        }

        // Energy Shield Cores Remaining Indicator
        const barWidth = 140;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(this.x - 10, this.y - 25, barWidth, 12);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 10, this.y - 25, barWidth, 12);

        const coreRatio = this.coresRemaining / this.maxCores;
        ctx.fillStyle = '#00FFCC';
        ctx.fillRect(this.x - 8, this.y - 23, (barWidth - 4) * coreRatio, 8);

        ctx.fillStyle = '#FFF';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`EMP: ${this.maxCores - this.coresRemaining}/${this.maxCores}`, this.x - 8, this.y - 32);
    }
}

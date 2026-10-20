import { Ship } from '../entities/Ship.js';
import { Star } from '../entities/Star.js';
import { Particle } from '../entities/Particle.js';
import { FloatingText } from '../entities/FloatingText.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { LeaderboardManager } from '../utils/LeaderboardManager.js';
import { SkinManager } from '../utils/SkinManager.js';
import { sounds } from '../utils/SoundManager.js';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, GAME_SPEED_START, COLOR_ASTEROID, COLOR_COIN
} from '../constants.js';

export class BaseMode {
    constructor(ctx, onGameOver, modeKey = 'CLASSIC') {
        this.ctx = ctx;
        this.onGameOver = onGameOver;
        this.modeKey = modeKey;

        this.gameSpeed = GAME_SPEED_START;
        this.score = 0;
        this.highScore = ScoreManager.getHighScore(modeKey);
        this.isNewHighScore = false;
        this.lives = 3;
        this.frameCount = 0;
        this.coinsCollected = 0;
        this.invulnerableTimer = 0;
        this.screenShake = 0;
        this.startTime = Date.now();
        this.deathCause = 'hazard';

        this.ship = new Ship();
        this.obstacles = [];
        this.coins = [];
        this.particles = [];
        this.stars = [];
        this.floatingTexts = [];

        this.initStars(150);
    }

    initStars(count = 150) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push(new Star());
        }
    }

    handleInput(keys, dt = 1) {
        if (!this.ship) return;

        const speed = 8;
        if (keys['ArrowLeft'] || keys['KeyA']) this.ship.x -= speed * dt;
        if (keys['ArrowRight'] || keys['KeyD']) this.ship.x += speed * dt;

        // Thrust
        if (keys['ArrowUp'] || keys['KeyW'] || keys['Space']) {
            this.ship.thrusting = true;
        } else {
            this.ship.thrusting = false;
        }

        // Clamp inside canvas horizontal bounds
        if (this.ship.x < 0) this.ship.x = 0;
        if (this.ship.x + this.ship.width > CANVAS_WIDTH) {
            this.ship.x = CANVAS_WIDTH - this.ship.width;
        }
    }

    addScore(points) {
        this.score += points;
        this.checkHighScore();
    }

    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            this.isNewHighScore = true;
            ScoreManager.saveHighScore(this.modeKey, this.score);
        }
    }

    spawnParticle(x, y, color, speed = 8, size = 4) {
        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) {
                this.particles[i].reset(x, y, color, speed, size);
                return;
            }
        }
        if (this.particles.length < 300) {
            this.particles.push(new Particle(x, y, color, speed, size));
        }
    }

    createExplosion(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            this.spawnParticle(x, y, color, 8, 4);
        }
    }

    addFloatingText(x, y, text, color = '#FFFFFF', size = 12) {
        this.floatingTexts.push(new FloatingText(x, y, text, color, size));
    }

    collectCoin(c) {
        c.markedForDeletion = true;
        this.coinsCollected++;
        SkinManager.addCoins(1);
        const points = 100;
        this.addScore(points);
        sounds.playCoin();
        this.addFloatingText(c.x, c.y, `+${points}`, '#FFD700', 12);
        this.createExplosion(c.x + c.width / 2, c.y + c.height / 2, COLOR_COIN, 8);
    }

    loseLife(cause = 'hazard') {
        this.deathCause = cause;
        this.lives--;
        this.invulnerableTimer = 60;
        this.screenShake = 12;
        sounds.playHit();
        this.createExplosion(this.ship.x + this.ship.width / 2, this.ship.y + this.ship.height / 2, '#FF0044', 24);

        if (this.lives <= 0) {
            this.endGame();
        }
    }

    endGame() {
        sounds.playGameOver();
        ScoreManager.saveHighScore(this.modeKey, this.score);
        
        const flightDurationSec = Math.floor((Date.now() - (this.startTime || Date.now())) / 1000);
        const sectorOrWave = this.level || 1;

        LeaderboardManager.submitScore(this.modeKey, this.score, this.coinsCollected, {
            flightDurationSec,
            sectorOrWave,
            deathCause: this.deathCause || 'hazard'
        });

        this.onGameOver({
            score: Math.floor(this.score),
            highScore: this.highScore,
            isNewHigh: this.isNewHighScore,
            mode: this.modeKey,
            coins: this.coinsCollected
        });
    }

    checkCollision(rect1, rect2, padding = 5) {
        return (
            rect1.x < rect2.x + rect2.width - padding &&
            rect1.x + rect1.width - padding > rect2.x &&
            rect1.y < rect2.y + rect2.height - padding &&
            rect1.y + rect1.height - padding > rect2.y
        );
    }

    updateBase(dt = 1) {
        this.frameCount++;
        // Survival distance score
        this.score += 0.1 * dt;
        this.checkHighScore();

        if (this.screenShake > 0) {
            this.screenShake -= dt;
            if (this.screenShake < 0) this.screenShake = 0;
        }

        // Ship
        this.ship.update(
            this.particles,
            this.frameCount,
            this.invulnerableTimer,
            () => this.loseLife(),
            (x, y, c) => this.createExplosion(x, y, c),
            dt
        );

        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

        // Background & Particles
        this.stars.forEach(s => s.update(this.gameSpeed, dt));
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].update(dt);
            }
        }

        this.floatingTexts.forEach(ft => ft.update(dt));
        this.floatingTexts = this.floatingTexts.filter(ft => !ft.markedForDeletion);

        // Obstacles & Coins
        this.obstacles.forEach(obs => obs.update(this.gameSpeed, this.frameCount, dt));
        this.obstacles = this.obstacles.filter(obs => !obs.markedForDeletion);

        this.coins.forEach(c => c.update(this.gameSpeed, this.frameCount, dt));
        this.coins = this.coins.filter(c => !c.markedForDeletion);
    }

    drawBase() {
        this.ctx.save();

        // Screen Shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        this.stars.forEach(s => s.draw(this.ctx));
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].draw(this.ctx);
            }
        }
        this.coins.forEach(c => c.draw(this.ctx));
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        this.floatingTexts.forEach(ft => ft.draw(this.ctx));

        // Draw Ship with Blink during invulnerability
        if (this.ship) {
            if (this.invulnerableTimer > 0 && Math.floor(this.frameCount / 4) % 2 === 0) {
                // Invisible on blink frame
            } else {
                this.ship.draw(this.ctx);
            }
        }

        this.ctx.restore();
    }
}

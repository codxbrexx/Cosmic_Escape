import { BaseMode } from './BaseMode.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_ASTEROID } from '../constants.js';
import { sounds } from '../utils/SoundManager.js';

export class BossRushMode extends BaseMode {
    constructor(ctx, onGameOver) {
        super(ctx, onGameOver, 'BOSS_RUSH');

        this.level = 1;
        this.lives = 3;
        this.survivalTimeLeft = 30; // Seconds per stage
        this.startLevelAnnouncement();
    }

    startLevelAnnouncement() {
        const announcement = document.getElementById('level-announcement');
        const announcementText = document.getElementById('level-announcement-text');
        if (announcement && announcementText) {
            announcementText.innerText = `SURVIVE WAVE ${this.level}`;
            announcement.classList.remove('hidden');
            setTimeout(() => {
                announcement.classList.add('hidden');
            }, 2000);
        }
    }

    update(dt = 1) {
        this.updateBase(dt);

        // Survival Timer Logic
        if (this.frameCount % 60 === 0) {
            this.survivalTimeLeft--;
            if (this.survivalTimeLeft <= 0) {
                this.completeWave();
            }
        }

        this.spawnObstacle();
        this.spawnCoin();

        this.checkCollisions();
    }

    completeWave() {
        this.level++;
        this.addScore(3000);
        this.survivalTimeLeft = 30;

        // Recover 1 life on survival milestone (max 5)
        if (this.lives < 5) {
            this.lives++;
        }

        this.gameSpeed += 0.4;
        sounds.playSectorClear();
        this.createExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#00FF88', 60);
        this.addFloatingText(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2, `WAVE ${this.level - 1} CLEAR! +3000`, '#00FF88', 14);

        this.startLevelAnnouncement();
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Sleek Deep Void/Green gradient background for Survival
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGradient.addColorStop(0, '#000804');
        bgGradient.addColorStop(1, '#001a0e');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.drawBase();
    }

    spawnObstacle() {
        if (this.obstacles.length > 0) {
            const lastObs = this.obstacles[this.obstacles.length - 1];
            if (CANVAS_WIDTH - lastObs.x < 240) return;
        }

        const difficulty = Math.min(0.08, 0.025 + (this.level * 0.005));
        if (Math.random() < difficulty) {
            const type = Math.random() > 0.65 ? 'ufo' : 'asteroid';
            this.obstacles.push(new Obstacle(type));
        }
    }

    spawnCoin() {
        // High-risk bonus coins
        if (Math.random() < 0.008) {
            this.coins.push(new Coin());
        }
    }

    checkCollisions() {
        // Obstacles vs Ship
        this.obstacles.forEach(obs => {
            if (this.checkCollision(this.ship, obs)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife();
                    obs.markedForDeletion = true;
                    this.createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, COLOR_ASTEROID, 18);
                }
            }
        });

        // Coins vs Ship
        this.coins.forEach(c => {
            if (this.checkCollision(this.ship, c)) {
                this.collectCoin(c);
            }
        });
    }

    getHUDData() {
        return {
            lives: this.lives,
            score: Math.floor(this.score),
            highScore: `HI: ${this.highScore}`,
            label: `TIME: ${this.survivalTimeLeft}s`,
            labelColor: "#00FF88",
            coins: this.coinsCollected
        };
    }
}

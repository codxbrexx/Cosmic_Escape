import { BaseMode } from './BaseMode.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Boss } from '../entities/Boss.js';
import { EnergyCore } from '../entities/EnergyCore.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_ASTEROID } from '../constants.js';
import { sounds } from '../utils/SoundManager.js';

export class BossRushMode extends BaseMode {
    constructor(ctx, onGameOver) {
        super(ctx, onGameOver, 'BOSS_RUSH');

        this.level = 1;
        this.lives = 3;
        this.survivalTimeLeft = 30; // 30s countdown before boss
        this.boss = null;
        this.energyCores = [];
        this.phase = 'SURVIVAL'; // 'SURVIVAL' or 'BOSS'
        this.startLevelAnnouncement();
    }

    startLevelAnnouncement() {
        const announcement = document.getElementById('level-announcement');
        const announcementText = document.getElementById('level-announcement-text');
        if (announcement && announcementText) {
            announcementText.innerText = `WAVE ${this.level}: SURVIVE 30s`;
            announcement.classList.remove('hidden');
            setTimeout(() => {
                announcement.classList.add('hidden');
            }, 2000);
        }
    }

    update(dt = 1) {
        this.updateBase(dt);

        // Phase 1: 30-Second Survival Countdown
        if (this.phase === 'SURVIVAL') {
            if (this.frameCount % 60 === 0) {
                this.survivalTimeLeft--;
                if (this.survivalTimeLeft <= 0) {
                    this.spawnBossPhase();
                }
            }
            this.spawnObstacle();
            this.spawnCoin();
        } else if (this.phase === 'BOSS' && this.boss) {
            // Phase 2: Boss Battle Evasion
            this.boss.update(dt);

            // Spawn Energy Cores periodically for EMP charging
            if (this.frameCount % 200 === 0 && this.energyCores.length < 2) {
                this.energyCores.push(new EnergyCore());
            }

            this.energyCores.forEach(ec => ec.update(this.gameSpeed, dt));
            this.energyCores = this.energyCores.filter(ec => !ec.markedForDeletion);

            // Fewer obstacles during boss
            if (Math.random() < 0.015) {
                this.obstacles.push(new Obstacle('asteroid'));
            }
        }

        this.checkCollisions();
    }

    spawnBossPhase() {
        this.phase = 'BOSS';
        this.boss = new Boss(this.level);
        this.energyCores = [new EnergyCore()];
        this.screenShake = 20;
        sounds.playHit();
        this.createExplosion(CANVAS_WIDTH - 150, CANVAS_HEIGHT / 2, '#FF0055', 70);

        const announcement = document.getElementById('level-announcement');
        const announcementText = document.getElementById('level-announcement-text');
        if (announcement && announcementText) {
            announcementText.innerText = `⚠️ MOTHERSHIP DETECTED! ⚠️`;
            announcement.classList.remove('hidden');
            setTimeout(() => {
                announcement.classList.add('hidden');
            }, 2500);
        }
    }

    completeWave() {
        this.level++;
        this.addScore(5000);
        this.phase = 'SURVIVAL';
        this.survivalTimeLeft = 30;
        this.boss = null;
        this.energyCores = [];

        // Recover 1 life on completing a full wave (max 5)
        if (this.lives < 5) {
            this.lives++;
        }

        this.gameSpeed += 0.5; // Escalating speed
        sounds.playSectorClear();
        this.createExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#00FF88', 80);
        this.addFloatingText(CANVAS_WIDTH / 2 - 140, CANVAS_HEIGHT / 2, `WAVE ${this.level - 1} CLEARED! +5000`, '#00FF88', 16);

        this.startLevelAnnouncement();
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Deep Void / Cosmic Emerald gradient background
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGradient.addColorStop(0, '#000804');
        bgGradient.addColorStop(1, this.phase === 'BOSS' ? '#1a0008' : '#001a0e');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.drawBase();

        // Draw Energy Cores & Boss
        if (this.phase === 'BOSS') {
            this.energyCores.forEach(ec => ec.draw(this.ctx));
            if (this.boss) this.boss.draw(this.ctx);
        }
    }

    spawnObstacle() {
        if (this.obstacles.length > 0) {
            const lastObs = this.obstacles[this.obstacles.length - 1];
            // Tighter gap for higher difficulty in survival
            if (CANVAS_WIDTH - lastObs.x < Math.max(160, 240 - this.level * 10)) return;
        }

        // Higher difficulty: escalating density & UFO frequency
        const difficulty = Math.min(0.12, 0.035 + (this.level * 0.008));
        if (Math.random() < difficulty) {
            const type = Math.random() > 0.55 ? 'ufo' : 'asteroid';
            this.obstacles.push(new Obstacle(type));
        }
    }

    spawnCoin() {
        if (this.phase === 'SURVIVAL' && Math.random() < 0.01) {
            this.coins.push(new Coin());
        }
    }

    checkCollisions() {
        // Obstacles vs Ship
        this.obstacles.forEach(obs => {
            if (this.checkCollision(this.ship, obs)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife(obs.type || 'asteroid');
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

        // Boss Phase Collisions
        if (this.phase === 'BOSS' && this.boss) {
            // Boss Body vs Ship
            if (this.checkCollision(this.ship, this.boss, 15)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife('mothership_hull');
                }
            }

            // Boss Beam Hazard vs Ship
            if (this.boss.beamActive) {
                const beamTop = this.boss.beamY - this.boss.beamHeight / 2;
                const beamBottom = this.boss.beamY + this.boss.beamHeight / 2;
                if (
                    this.ship.x < this.boss.x &&
                    this.ship.y + this.ship.height > beamTop &&
                    this.ship.y < beamBottom
                ) {
                    if (this.invulnerableTimer <= 0) {
                        this.loseLife('plasma_beam');
                        this.addFloatingText(this.ship.x, this.ship.y, 'BEAM HIT!', '#FF0000', 12);
                    }
                }
            }

            // Energy Core Pickups (EMP Discharge on Boss)
            this.energyCores.forEach(ec => {
                if (this.checkCollision(this.ship, ec)) {
                    ec.markedForDeletion = true;
                    this.boss.coresRemaining--;
                    this.addScore(500);
                    sounds.playCoin();
                    this.screenShake = 12;
                    this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#00FFCC', 25);
                    this.addFloatingText(ec.x, ec.y, 'EMP CHARGE! +500', '#00FFCC', 12);

                    if (this.boss.coresRemaining <= 0) {
                        this.completeWave();
                    }
                }
            });
        }
    }

    getHUDData() {
        const label = this.phase === 'BOSS' ? '⚠️ MOTHERSHIP' : `TIME: ${this.survivalTimeLeft}s`;
        const labelColor = this.phase === 'BOSS' ? '#FF0055' : '#00FF88';
        return {
            lives: this.lives,
            score: Math.floor(this.score),
            highScore: `HI: ${this.highScore}`,
            label: label,
            labelColor: labelColor,
            coins: this.coinsCollected
        };
    }
}

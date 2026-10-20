import { BaseMode } from './BaseMode.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Heart } from '../entities/Heart.js';
import { Boss } from '../entities/Boss.js';
import { EnergyCore } from '../entities/EnergyCore.js';
import { getThemeForLevel } from '../utils/themes.js';
import { sounds } from '../utils/SoundManager.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_ASTEROID } from '../constants.js';

export class StoryMode extends BaseMode {
    constructor(ctx, onGameOver) {
        super(ctx, onGameOver, 'STORY');

        this.level = 1;
        this.lives = 3;
        this.hearts = [];
        this.energyCores = [];
        this.boss = null;
        this.lastHeartScore = 0;

        this.updateEnvironment();
    }

    updateEnvironment() {
        const theme = getThemeForLevel(this.level);
        const container = document.getElementById('game-container');
        if (container) {
            container.style.borderColor = theme.border;
        }
    }

    update(dt = 1) {
        // Base updates (frameCount, distance score, ship, particles, stars, obstacles, coins, floatingTexts)
        this.updateBase(dt);

        // Heart Spawning (Every 500 points)
        if (this.score - this.lastHeartScore >= 500) {
            this.hearts.push(new Heart());
            this.lastHeartScore = Math.floor(this.score);
        }

        // Sector / Level Progression (When no boss active)
        if (!this.boss && this.score >= this.level * 1000) {
            this.level++;
            this.gameSpeed += 0.15;
            this.updateEnvironment();
            sounds.playSectorClear();
            this.createExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#00FFFF', 40);
            this.addFloatingText(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2, `SECTOR ${this.level} REACHED!`, '#00FFCC', 14);

            // Announce Sector
            const announcement = document.getElementById('level-announcement');
            const announcementText = document.getElementById('level-announcement-text');
            if (announcement && announcementText) {
                announcementText.innerText = `SECTOR ${this.level}`;
                announcement.classList.remove('hidden');
                setTimeout(() => {
                    announcement.classList.add('hidden');
                }, 2500);
            }
        }

        // Boss Encounter Spawn Check (Every 5 sectors: 5, 10, 15...)
        if (!this.boss && this.level % 5 === 0 && this.score >= (this.level - 1) * 1000 + 100) {
            this.spawnBoss();
        }

        // Spawn obstacles and coins
        this.spawnObstacle();
        this.spawnCoin();

        // Hearts update
        this.hearts.forEach(h => h.update(this.gameSpeed, dt));
        this.hearts = this.hearts.filter(h => !h.markedForDeletion);

        // Boss & Energy Cores update
        if (this.boss) {
            this.boss.update(dt);

            // Periodically spawn energy core if boss active
            if (this.frameCount % 240 === 0 && this.energyCores.length < 2) {
                this.energyCores.push(new EnergyCore());
            }

            this.energyCores.forEach(ec => ec.update(this.gameSpeed, dt));
            this.energyCores = this.energyCores.filter(ec => !ec.markedForDeletion);
        }

        this.checkCollisions();
    }

    spawnBoss() {
        this.boss = new Boss(this.level);
        this.energyCores = [new EnergyCore()];
        this.screenShake = 15;
        sounds.playHit();
        this.createExplosion(CANVAS_WIDTH - 150, CANVAS_HEIGHT / 2, '#FF0055', 60);
        this.addFloatingText(CANVAS_WIDTH / 2 - 140, 100, '⚠️ MOTHERSHIP INTERCEPT ⚠️', '#FF0055', 14);
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        // Draw Base components (stars, particles, coins, obstacles, floating text, ship)
        this.stars.forEach(s => s.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.coins.forEach(c => c.draw(this.ctx));
        this.hearts.forEach(h => h.draw(this.ctx));
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        this.energyCores.forEach(ec => ec.draw(this.ctx));

        if (this.boss) this.boss.draw(this.ctx);

        this.floatingTexts.forEach(ft => ft.draw(this.ctx));

        if (this.ship) {
            if (this.invulnerableTimer > 0 && Math.floor(this.frameCount / 4) % 2 === 0) {
                // Blink
            } else {
                this.ship.draw(this.ctx);
            }
        }

        this.ctx.restore();
    }

    spawnObstacle() {
        if (this.obstacles.length > 0) {
            const lastObs = this.obstacles[this.obstacles.length - 1];
            if (CANVAS_WIDTH - lastObs.x < (this.boss ? 400 : 280)) return;
        }

        // Difficulty scaling by sector
        const spawnChance = 0.02 + Math.min(0.04, this.level * 0.003);
        if (Math.random() < spawnChance) {
            const type = Math.random() > 0.75 ? 'ufo' : 'asteroid';
            this.obstacles.push(new Obstacle(type));
        }
    }

    spawnCoin() {
        if (this.boss) return; // Focus on survival and cores during boss
        if (Math.random() < 0.012) {
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
                // 10 Coins = +1 Life bonus!
                if (this.coinsCollected % 10 === 0) {
                    this.lives++;
                    sounds.playHeart();
                    this.addFloatingText(this.ship.x, this.ship.y - 20, '+1 LIFE!', '#00FFCC', 14);
                }
            }
        });

        // Hearts vs Ship
        this.hearts.forEach(h => {
            if (this.checkCollision(this.ship, h)) {
                h.markedForDeletion = true;
                this.lives++;
                sounds.playHeart();
                this.addFloatingText(h.x, h.y, '+1 LIFE', '#FF0044', 12);
                this.createExplosion(h.x, h.y, '#FF0044', 20);
            }
        });

        // Boss Encounter Collisions
        if (this.boss) {
            // Boss Ship Body Collision
            if (this.checkCollision(this.ship, this.boss, 15)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife();
                }
            }

            // Boss Beam Collision
            if (this.boss.beamActive) {
                const beamTop = this.boss.beamY - this.boss.beamHeight / 2;
                const beamBottom = this.boss.beamY + this.boss.beamHeight / 2;
                if (
                    this.ship.x < this.boss.x &&
                    this.ship.y + this.ship.height > beamTop &&
                    this.ship.y < beamBottom
                ) {
                    if (this.invulnerableTimer <= 0) {
                        this.loseLife();
                        this.addFloatingText(this.ship.x, this.ship.y, 'BEAM HIT!', '#FF0000', 12);
                    }
                }
            }

            // Energy Core Pickups (EMP discharge on Boss)
            this.energyCores.forEach(ec => {
                if (this.checkCollision(this.ship, ec)) {
                    ec.markedForDeletion = true;
                    this.boss.coresRemaining--;
                    this.addScore(500);
                    sounds.playCoin();
                    this.screenShake = 10;
                    this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#00FFFF', 25);
                    this.addFloatingText(ec.x, ec.y, 'EMP CHARGED! +500', '#00FFFF', 12);

                    if (this.boss.coresRemaining <= 0) {
                        // Boss Defeated / Hyperdrive Escaped!
                        this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#FF0055', 80);
                        sounds.playSectorClear();
                        this.addScore(3000);
                        this.addFloatingText(CANVAS_WIDTH / 2 - 140, CANVAS_HEIGHT / 2, 'MOTHERSHIP EVADED! +3000', '#00FFCC', 16);
                        this.boss = null;
                        this.energyCores = [];
                        this.level++;
                        this.updateEnvironment();
                    }
                }
            });
        }
    }

    getHUDData() {
        const label = this.boss ? "⚠️ INTERCEPT" : `SECTOR ${this.level}`;
        const color = this.boss ? "#FF0055" : "#00FFCC";
        return {
            lives: this.lives,
            score: Math.floor(this.score),
            highScore: `HI: ${this.highScore}`,
            label: label,
            labelColor: color,
            coins: this.coinsCollected
        };
    }
}

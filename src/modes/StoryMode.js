import { Ship } from '../entities/Ship.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Star } from '../entities/Star.js';
import { Particle } from '../entities/Particle.js';
import { Boss } from '../entities/Boss.js';
import { Heart } from '../entities/Heart.js';
import { Projectile } from '../entities/Projectile.js';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, GAME_SPEED_START, COLOR_ASTEROID, COLOR_COIN
} from '../constants.js';
import { getThemeForLevel } from '../utils/themes.js';

export class StoryMode {
    constructor(ctx, onGameOver) {
        this.ctx = ctx;
        this.onGameOver = onGameOver;

        // Progress: No Checkpoints. Always start at Level 1.
        this.level = 1;
        this.xp = 0;

        // Game State
        this.gameSpeed = GAME_SPEED_START;
        this.score = 0;
        this.highScore = localStorage.getItem('storyHighScore') || 0;
        this.lives = 3;
        this.frameCount = 0;
        this.coinsCollected = 0;

        this.ship = new Ship();
        this.obstacles = [];
        this.coins = [];
        this.hearts = [];
        this.particles = [];
        this.stars = [];
        this.bullets = [];
        this.boss = null;

        this.invulnerableTimer = 0;
        this.lastHeartScore = 0;

        // upgrades
        this.fireRateCoodown = 15;
        this.lastShotTime = 0;

        // Init Stars
        for (let i = 0; i < 150; i++) this.stars.push(new Star());

        this.updateEnvironment();
    }

    handleInput(keys) {
        if (!this.ship) return;

        // Horizontal Movement
        const speed = 8;
        if (keys['ArrowLeft']) this.ship.x -= speed;
        if (keys['ArrowRight']) this.ship.x += speed;

        // Thrust
        if (keys['ArrowUp'] || keys['Space']) this.ship.thrusting = true;
        else this.ship.thrusting = false;

        // Keep ship in bounds
        if (this.ship.x < 0) this.ship.x = 0;
        if (this.ship.x + this.ship.width > CANVAS_WIDTH) this.ship.x = CANVAS_WIDTH - this.ship.width;

        // Shooting
        if (keys['KeyF'] || keys['ControlLeft'] || keys['KeyZ']) {
            if (this.frameCount - this.lastShotTime > this.fireRateCoodown) {
                this.ship.shoot(this.bullets);
                this.lastShotTime = this.frameCount;
            }
        }
    }

    updateEnvironment() {
        const theme = getThemeForLevel(this.level);
        const container = document.getElementById('game-container');
        if (container) {
            // container.style.background = theme.bg; // Keep background static
            container.style.borderColor = theme.border;
        }
    }

    update() {
        this.frameCount++;
        this.score += 0.1;

        // Heart Spawning (Every 500 score)
        if (this.score - this.lastHeartScore >= 500) {
            this.hearts.push(new Heart());
            this.lastHeartScore = Math.floor(this.score);
        }

        // Boss Spawn Check (Every 10 levels)
        if (!this.boss && this.level % 10 === 0) {
            this.boss = new Boss(this.level);
            this.createExplosion(CANVAS_WIDTH - 100, CANVAS_HEIGHT / 2, '#FF0000', 50);
        }

        // Level Up Logic (If no boss)
        if (!this.boss && this.score >= this.level * 1000) {
            this.level++;
            this.gameSpeed += 0.2;
            // Upgrade Fire Rate
            this.fireRateCoodown = Math.max(5, 15 - this.level);
            this.updateEnvironment();
            this.createExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#FFF', 50);

            // Show Sector Announcement
            const announcement = document.getElementById('level-announcement');
            const announcementText = document.getElementById('level-announcement-text');
            if (announcement && announcementText) {
                announcementText.innerText = "SECTOR " + this.level;
                announcement.classList.remove('hidden');
                setTimeout(() => {
                    announcement.classList.add('hidden');
                }, 3000);
            }
        }

        // Entities Update
        this.ship.update(this.particles, this.frameCount, this.invulnerableTimer, () => this.loseLife(), (x, y, c) => this.createExplosion(x, y, c));

        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        this.stars.forEach(s => s.update(this.gameSpeed));
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        this.spawnObstacle();
        this.spawnCoin();

        this.obstacles.forEach(obs => obs.update(this.gameSpeed, this.frameCount));
        this.obstacles = this.obstacles.filter(obs => !obs.markedForDeletion);

        this.coins.forEach(c => c.update(this.gameSpeed, this.frameCount));
        this.coins = this.coins.filter(c => !c.markedForDeletion);

        this.hearts.forEach(h => h.update(this.gameSpeed));
        this.hearts = this.hearts.filter(h => !h.markedForDeletion);

        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);

        if (this.boss) {
            this.boss.update(this.bullets, this.ship);
            this.checkBossCollisions();
        }

        this.checkCollisions();
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.stars.forEach(s => s.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.coins.forEach(c => c.draw(this.ctx));
        this.hearts.forEach(h => h.draw(this.ctx));
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));

        if (this.boss) this.boss.draw(this.ctx);

        if (this.ship) {
            if (this.invulnerableTimer > 0 && Math.floor(this.frameCount / 4) % 2 === 0) {
            } else {
                this.ship.draw(this.ctx);
            }
        }
    }

    spawnObstacle() {
        if (this.boss) return;
        if (this.obstacles.length > 0) {
            let lastObs = this.obstacles[this.obstacles.length - 1];
            if (CANVAS_WIDTH - lastObs.x < 300) return;
        }
        // Difficulty scaling
        if (Math.random() < 0.02 + (this.level * 0.002)) {
            const type = Math.random() > 0.8 ? 'ufo' : 'asteroid';
            this.obstacles.push(new Obstacle(type));
        }
    }

    spawnCoin() {
        if (this.boss) return;
        if (Math.random() < 0.01) this.coins.push(new Coin());
    }

    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, 10, 5));
        }
    }

    checkBossCollisions() {
        if (!this.boss) return;

        // Boss vs Bullets
        this.bullets.forEach(b => {
            if (!b.isEnemy && !b.markedForDeletion && this.checkCollision(b, this.boss)) {
                b.markedForDeletion = true;
                this.boss.hp -= 1;
                this.createExplosion(b.x, b.y, '#FFAA00', 3);

                if (this.boss.hp <= 0) {
                    this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, '#FF0000', 100);
                    this.score += 5000;
                    this.boss = null;
                }
            }
        });

        // Boss Body vs Ship
        if (this.checkCollision(this.ship, this.boss)) {
            if (this.invulnerableTimer <= 0) this.loseLife();
        }
    }

    checkCollisions() {
        this.obstacles.forEach(obs => {
            if (this.checkCollision(this.ship, obs)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife();
                    obs.markedForDeletion = true;
                    this.createExplosion(obs.x, obs.y, COLOR_ASTEROID, 15);
                }
            }
        });

        this.coins.forEach(c => {
            if (this.checkCollision(this.ship, c)) {
                c.markedForDeletion = true;
                this.coinsCollected++;
                if (this.coinsCollected % 10 === 0) this.lives++;
                this.createExplosion(c.x, c.y, COLOR_COIN, 5);
            }
        });

        this.hearts.forEach(h => {
            if (this.checkCollision(this.ship, h)) {
                h.markedForDeletion = true;
                this.lives++;
                this.createExplosion(h.x, h.y, '#FF0044', 20);
            }
        });

        this.bullets.forEach(b => {
            if (b.isEnemy && this.checkCollision(b, this.ship)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife();
                    b.markedForDeletion = true;
                }
            }
            if (!b.isEnemy) {
                this.obstacles.forEach(obs => {
                    if (this.checkCollision(b, obs)) {
                        obs.markedForDeletion = true;
                        b.markedForDeletion = true;
                        this.score += 50;
                        this.createExplosion(obs.x, obs.y, '#888', 10);
                    }
                });
            }
        });
    }

    checkCollision(rect1, rect2) {
        let padding = 5;
        return (
            rect1.x < rect2.x + rect2.width - padding &&
            rect1.x + rect1.width - padding > rect2.x &&
            rect1.y < rect2.y + rect2.height - padding &&
            rect1.y + rect1.height - padding > rect2.y
        );
    }

    loseLife() {
        this.lives--;
        this.invulnerableTimer = 60;
        this.createExplosion(this.ship.x + this.ship.width / 2, this.ship.y + this.ship.height / 2, '#FF0000', 20);

        if (this.lives <= 0) {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('storyHighScore', this.highScore);
            }
            this.onGameOver({ score: this.score, mode: 'STORY' });
        }
    }

    getHUDData() {
        const label = this.boss ? "BOSS DESTROYER" : "SECTOR " + this.level;
        const color = this.boss ? "#FF0000" : "#FFF";
        return {
            lives: this.lives,
            score: Math.floor(this.score),
            highScore: "HI: " + Math.floor(this.highScore),
            label: label,
            labelColor: color,
            coins: `${this.coinsCollected}`
        };
    }
}

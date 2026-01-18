import { Ship } from '../entities/Ship.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Star } from '../entities/Star.js';
import { Particle } from '../entities/Particle.js';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, GAME_SPEED_START, COLOR_ASTEROID
} from '../constants.js';

export class BossRushMode {
    constructor(ctx, onGameOver) {
        this.ctx = ctx;
        this.onGameOver = onGameOver;

        this.level = 1;
        this.gameSpeed = GAME_SPEED_START;
        this.score = 0;
        this.highScore = localStorage.getItem('survivalHighScore') || 0;
        this.lives = 4;
        this.frameCount = 0;

        this.ship = new Ship({
            gravity: 0.15, // Low gravity
            thrust: -5,    // Gentle thrust
            drag: 0.99     // High drift (low drag)
        });

        // Survival specific
        this.survivalTimeLeft = 30; // Seconds

        this.particles = [];
        this.stars = [];
        this.obstacles = [];
        this.bullets = []; // Ship bullets

        this.invulnerableTimer = 0;
        this.lastShotTime = 0;
        this.fireRateCoodown = 15; // Moderate fire rate

        // Init Stars
        for (let i = 0; i < 150; i++) this.stars.push(new Star());

        this.startLevel();
    }

    startLevel() {
        // Show Announcement (Small)
        const announcement = document.getElementById('level-announcement');
        const announcementText = document.getElementById('level-announcement-text');
        if (announcement && announcementText) {
            announcementText.innerText = "SURVIVE LVL " + this.level;
            announcement.classList.remove('hidden');
            setTimeout(() => {
                announcement.classList.add('hidden');
            }, 2000);
        }
    }

    handleInput(keys) {
        if (!this.ship) return;

        const speed = 8;
        if (keys['ArrowLeft']) this.ship.x -= speed;
        if (keys['ArrowRight']) this.ship.x += speed;

        if (keys['ArrowUp'] || keys['Space']) this.ship.thrusting = true;
        else this.ship.thrusting = false;

        if (this.ship.x < 0) this.ship.x = 0;
        if (this.ship.x + this.ship.width > CANVAS_WIDTH) this.ship.x = CANVAS_WIDTH - this.ship.width;

        // SHOOTING ENABLED
        if (keys['KeyF'] || keys['ControlLeft'] || keys['KeyZ']) {
            if (this.frameCount - this.lastShotTime > this.fireRateCoodown) {
                this.ship.shoot(this.bullets);
                this.lastShotTime = this.frameCount;
            }
        }
    }

    update() {
        this.frameCount++;

        // Score based on survival time (fast drip)
        this.score += 0.1; // score speed

        // Timer Logic
        if (this.frameCount % 60 === 0) {
            this.survivalTimeLeft--;
            if (this.survivalTimeLeft <= 0) {
                this.completeLevel();
            }
        }

        this.spawnObstacle();

        // Entities Update
        this.ship.update(this.particles, this.frameCount, this.invulnerableTimer, () => this.loseLife(), (x, y, c) => this.createExplosion(x, y, c));

        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        this.stars.forEach(s => s.update(this.gameSpeed));
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        this.obstacles.forEach(obs => obs.update(this.gameSpeed, this.frameCount));
        this.obstacles = this.obstacles.filter(obs => !obs.markedForDeletion);

        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);

        this.checkCollisions();
    }

    completeLevel() {
        this.level++;
        this.score += 3000;
        this.survivalTimeLeft = 30;

        if (this.lives < 6) this.lives++;

        this.gameSpeed += 0.5;

        this.createExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#128b67ff', 100);
        this.startLevel();
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Simple Deep Green Background
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGradient.addColorStop(0, '#001100');
        bgGradient.addColorStop(1, '#002200');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.stars.forEach(s => s.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.obstacles.forEach(obs => obs.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));

        if (this.ship) {
            if (this.invulnerableTimer > 0 && Math.floor(this.frameCount / 4) % 2 === 0) {
            } else {
                this.ship.draw(this.ctx);
            }
        }
    }

    spawnObstacle() {
        // REDUCED Difficulty: Lower base chance
        const difficulty = Math.min(0.12, 0.02 + (this.level * 0.003));

        if (Math.random() < difficulty) {
            const type = Math.random() > 0.7 ? 'ufo' : 'asteroid';
            this.obstacles.push(new Obstacle(type));
        }
    }

    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, 10, 5));
        }
    }

    checkCollisions() {
        // Obstacles vs Ship
        this.obstacles.forEach(obs => {
            if (this.checkCollision(this.ship, obs)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife();
                    obs.markedForDeletion = true;
                    this.createExplosion(obs.x, obs.y, COLOR_ASTEROID, 15);
                }
            }
        });

        // Bullets vs Obstacles
        this.bullets.forEach(b => {
            this.obstacles.forEach(obs => {
                if (!obs.markedForDeletion && !b.markedForDeletion && this.checkCollision(b, obs)) {
                    obs.markedForDeletion = true;
                    b.markedForDeletion = true;
                    this.score += 50;
                    this.createExplosion(obs.x, obs.y, '#FFAA00', 8);
                }
            });
        });
    }

    checkCollision(rect1, rect2) {
        let padding = 10;
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
                localStorage.setItem('survivalHighScore', this.highScore);
            }
            this.onGameOver({ score: this.score, mode: 'SURVIVAL' });
        }
    }

    getHUDData() {
        return {
            lives: this.lives,
            score: Math.floor(this.score),
            highScore: "HI: " + Math.floor(this.highScore),
            label: "TIME: " + this.survivalTimeLeft + "s",
            labelColor: "#00ff00ff",
            coins: null
        };
    }
}

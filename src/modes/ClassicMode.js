import { Ship } from '../entities/Ship.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { Star } from '../entities/Star.js';
import { Particle } from '../entities/Particle.js';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, GAME_SPEED_START, COLOR_ASTEROID, COLOR_COIN
} from '../constants.js';
import gsap from 'gsap';

export class ClassicMode {
    constructor(ctx, onGameOver) {
        this.ctx = ctx;
        this.onGameOver = onGameOver;

        this.gameSpeed = GAME_SPEED_START;
        this.score = 0;
        this.scores = 0;
        this.highScore = localStorage.getItem('classicHighScore') || 0;
        this.lives = 3; // Optional: Classic usually 1 life, but 3 is fairer
        this.frameCount = 0;

        this.ship = new Ship({
            gravity: 0.22, // Unified gravity across all modes
            thrust: -5.5,  // Unified thrust
            drag: 0.96     // Unified drag
        });
        this.obstacles = [];
        this.coins = []; // Points only
        this.coinsCollected = 0; // Fix: Track coins
        this.particles = [];
        this.stars = [];

        this.invulnerableTimer = 0;

        // Init Stars
        for (let i = 0; i < 150; i++) this.stars.push(new Star());
    }


    handleInput(keys, dt = 1) {
        if (!this.ship) return;

        // Horizontal Movement — scaled by dt for frame-rate independence
        const speed = 8;
        if (keys['ArrowLeft']) this.ship.x -= speed * dt;
        if (keys['ArrowRight']) this.ship.x += speed * dt;

        // Thrust
        if (keys['ArrowUp'] || keys['Space']) this.ship.thrusting = true;
        else this.ship.thrusting = false;

        // Keep ship in bounds
        if (this.ship.x < 0) this.ship.x = 0;
        if (this.ship.x + this.ship.width > CANVAS_WIDTH) this.ship.x = CANVAS_WIDTH - this.ship.width;
    }

    update(dt = 1) {
        this.frameCount++;
        this.score += 0.1 * dt;

        // Accelerate faster in Classic
        if (this.frameCount % 600 === 0) this.gameSpeed += 0.2;

        // Entities
        this.ship.update(this.particles, this.frameCount, this.invulnerableTimer, () => this.loseLife(), (x, y, c) => this.createExplosion(x, y, c), dt);

        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        this.stars.forEach(s => s.update(this.gameSpeed, dt));
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);

        this.spawnObstacle();
        this.spawnCoin();

        this.obstacles.forEach(obs => obs.update(this.gameSpeed, this.frameCount, dt));
        this.obstacles = this.obstacles.filter(obs => !obs.markedForDeletion);

        this.coins.forEach(c => c.update(this.gameSpeed, this.frameCount, dt));
        this.coins = this.coins.filter(c => !c.markedForDeletion);

        this.checkCollisions();
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.stars.forEach(s => s.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.coins.forEach(c => c.draw(this.ctx));
        this.obstacles.forEach(obs => obs.draw(this.ctx));

        if (this.ship) {
            if (this.invulnerableTimer > 0 && Math.floor(this.frameCount / 4) % 2 === 0) {
                // Blink
            } else {
                this.ship.draw(this.ctx);
            }
        }
    }

    spawnObstacle() {
        if (this.obstacles.length > 0) {
            let lastObs = this.obstacles[this.obstacles.length - 1];
            if (CANVAS_WIDTH - lastObs.x < 300) return;
        }
        if (Math.random() < 0.02 + (this.score * 0.00001)) { // Scaling density
            const type = Math.random() > 0.8 ? 'ufo' : 'asteroid';
            this.obstacles.push(new Obstacle(type));
        }
    }

    spawnCoin() {
        if (Math.random() < 0.01) this.coins.push(new Coin());
    }

    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, 10, 5));
        }
    }

    checkCollisions() {
        // Obstacles
        this.obstacles.forEach(obs => {
            if (this.checkCollision(this.ship, obs)) {
                if (this.invulnerableTimer <= 0) {
                    this.loseLife();
                    obs.markedForDeletion = true;
                    this.createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, COLOR_ASTEROID, 15);
                }
            }
        });

        // Coins
        this.coins.forEach(c => {
            if (this.checkCollision(this.ship, c)) {
                c.markedForDeletion = true;
                this.coinsCollected++;
                this.createExplosion(c.x + c.width / 2, c.y + c.height / 2, COLOR_COIN, 5);
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
                localStorage.setItem('classicHighScore', this.highScore);
            }
            this.onGameOver({ score: this.score, mode: 'CLASSIC' });
        }
    }

    getHUDData() {
        return {
            lives: this.lives,
            score: Math.floor(this.score),
            highScore: "HI: " + Math.floor(this.highScore), // Fix: Format string
            label: "CLASSIC",
            labelColor: "#00FFCC",
            coins: this.coinsCollected // Fix: Return count
        };
    }
}

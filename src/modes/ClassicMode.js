import { BaseMode } from './BaseMode.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_ASTEROID } from '../constants.js';

export class ClassicMode extends BaseMode {
    constructor(ctx, onGameOver) {
        super(ctx, onGameOver, 'CLASSIC');
        this.lives = 3;
    }

    update(dt = 1) {
        // Accelerate gradually in Classic
        if (this.frameCount % 600 === 0) {
            this.gameSpeed += 0.2;
        }

        this.spawnObstacle();
        this.spawnCoin();

        this.updateBase(dt);
        this.checkCollisions();
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.drawBase();
    }

    spawnObstacle() {
        if (this.obstacles.length > 0) {
            const lastObs = this.obstacles[this.obstacles.length - 1];
            if (CANVAS_WIDTH - lastObs.x < 280) return;
        }

        const spawnChance = 0.02 + Math.min(0.04, this.score * 0.00002);
        if (Math.random() < spawnChance) {
            const type = Math.random() > 0.75 ? 'ufo' : 'asteroid';
            this.obstacles.push(new Obstacle(type));
        }
    }

    spawnCoin() {
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
            }
        });
    }

    getHUDData() {
        return {
            lives: this.lives,
            score: Math.floor(this.score),
            highScore: `HI: ${this.highScore}`,
            label: "CLASSIC ARCADE",
            labelColor: "#00FFCC",
            coins: this.coinsCollected
        };
    }
}

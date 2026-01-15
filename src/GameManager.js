import { StoryMode } from './modes/StoryMode.js';
import { ClassicMode } from './modes/ClassicMode.js';
import gsap from 'gsap';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class GameManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.activeMode = null;
        this.isRunning = false;

        // Global Input
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    startMode(modeType) {
        if (modeType === 'STORY') {
            this.activeMode = new StoryMode(this.ctx, (results) => this.endGame(results));
        } else {
            this.activeMode = new ClassicMode(this.ctx, (results) => this.endGame(results));
        }

        this.isRunning = true;

        // Hide Menus
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('instructions').classList.remove('hidden');

        // Show correct instructions based on mode
        const instr = document.getElementById('instructions');
        if (modeType === 'STORY') {
            instr.innerHTML = `<p><strong>STORY CAMPAIGN</strong></p>Arrows/Space to Fly<br>F/Z to Shoot<br>10 Coins = +1 ❤️`;
        } else {
            instr.innerHTML = `<p><strong>CLASSIC ARCADE</strong></p>Arrows/Space to Fly<br>Dodge Everything!<br>No Shooting. No Mercy.`;
        }

        this.loop();
    }

    loop() {
        if (!this.isRunning) return;

        if (this.activeMode) {
            this.activeMode.handleInput(this.keys);
            this.activeMode.update();
            this.activeMode.draw();
            this.updateHUD(this.activeMode.getHUDData());
        }

        requestAnimationFrame(() => this.loop());
    }

    updateHUD(data) {
        let heartString = '';
        for (let i = 0; i < data.lives; i++) heartString += '❤️';
        document.getElementById('hearts').innerText = heartString;

        document.getElementById('score').innerText = data.score.toString().padStart(5, '0');
        document.getElementById('high-score').innerText = data.highScore;

        const lvlDisplay = document.getElementById('level-display');
        lvlDisplay.innerText = data.label;
        lvlDisplay.style.color = data.labelColor;

        if (data.coins) {
            document.getElementById('coin-display').style.display = 'block';
            document.getElementById('coin-count').innerText = data.coins;
        } else {
            document.getElementById('coin-display').style.display = 'none';
        }
    }

    endGame(results) {
        this.isRunning = false;
        const gameOverEl = document.getElementById('game-over');
        gameOverEl.classList.remove('hidden');

        document.getElementById('final-score').innerText = Math.floor(results.score);

        gsap.fromTo(gameOverEl, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1 });
    }
}

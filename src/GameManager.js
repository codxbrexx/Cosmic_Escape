import { StoryMode } from './modes/StoryMode.js';
import { ClassicMode } from './modes/ClassicMode.js';
import gsap from 'gsap';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export class GameManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.activeMode = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isCountingDown = false;

        // Global Input
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                this.togglePause();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.setupUI();
    }

    setupUI() {
        // Resume
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        // Quit
        document.getElementById('btn-quit').addEventListener('click', () => this.resetToMenu());

        // Game Over Buttons
        document.getElementById('btn-relaunch').addEventListener('click', () => {
            // Restart current mode
            const currentModeType = this.activeMode instanceof StoryMode ? 'STORY' : 'CLASSIC';
            this.startMode(currentModeType);
        });

        document.getElementById('btn-return-menu').addEventListener('click', () => this.resetToMenu());

        // Mobile Controls
        this.setupMobileControls();
    }

    setupMobileControls() {
        const gameContainer = document.getElementById('game-container');

        // Touch Handlers for the entire game area
        const handleTouch = (e) => {
            // Only handle game inputs if the game is actually running
            if (!this.isRunning) return;

            e.preventDefault(); // Prevent scrolling only during gameplay

            // Reset keys handled by touch
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
            this.keys['KeyF'] = false;
            this.keys['ArrowUp'] = false;

            // Analyze all active touches
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const rect = gameContainer.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const width = rect.width;

                // FULL SCREEN TOUCH = UP (THRUST) + FIRE
                this.keys['KeyF'] = true;
                this.keys['ArrowUp'] = true;

            }
        };

        gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
        gameContainer.addEventListener('touchmove', handleTouch, { passive: false });

        const handleTouchEnd = (e) => {
            if (!this.isRunning) return;

            e.preventDefault();
            // If no touches remain, reset all mobile keys
            if (e.touches.length === 0) {
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowRight'] = false;
                this.keys['ArrowUp'] = false;
                this.keys['KeyF'] = false;
            } else {
                // Re-evaluate remaining touches
                handleTouch(e);
            }
        };
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        gameContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });


        // Keep specific listeners for the remaining UI buttons (Thrust/Pause)
        // Pause Button
        const pauseBtn = document.getElementById('mobile-pause-btn');
        if (pauseBtn) {
            const stopProp = (e) => { e.stopPropagation(); };
            pauseBtn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.togglePause();
            });
            pauseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.togglePause();
            });
            pauseBtn.addEventListener('touchmove', stopProp, { passive: false });
            pauseBtn.addEventListener('touchend', stopProp, { passive: false });
        }

        // Thrust Button (Optional override / visual feedback)
        const btnThrust = document.getElementById('btn-thrust');
        if (btnThrust) {
            const stopProp = (e) => { e.preventDefault(); e.stopPropagation(); };

            btnThrust.addEventListener('touchstart', (e) => {
                e.preventDefault(); e.stopPropagation();
                this.keys['ArrowUp'] = true;
                btnThrust.classList.add('bg-white/30');
            });

            // Isolate from global handler
            btnThrust.addEventListener('touchmove', stopProp, { passive: false });

            const endThrust = (e) => {
                e.preventDefault(); e.stopPropagation();
                this.keys['ArrowUp'] = false;
                btnThrust.classList.remove('bg-white/30');
            };
            btnThrust.addEventListener('touchend', endThrust, { passive: false });
            btnThrust.addEventListener('touchcancel', endThrust, { passive: false });
        }
    }

    togglePause() {
        if (!this.isRunning || !this.activeMode) return;

        // If currently doing countdown, ignore inputs
        if (this.isCountingDown) return;

        if (this.isPaused) {
            // UNPAUSE -> START COUNTDOWN
            this.startResumeCountdown();
        } else {
            // PAUSE
            this.isPaused = true;
            const pauseMenu = document.getElementById('pause-menu');
            pauseMenu.classList.remove('hidden');
            pauseMenu.style.display = 'flex';
        }
    }

    startResumeCountdown() {
        const pauseMenu = document.getElementById('pause-menu');
        pauseMenu.classList.add('hidden');
        pauseMenu.style.display = 'none';

        const countdownOverlay = document.getElementById('countdown-overlay');
        const countdownText = document.getElementById('countdown-text');

        this.isCountingDown = true;
        countdownOverlay.classList.remove('hidden');

        let count = 3;
        countdownText.innerText = count;

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.innerText = count;
            } else {
                clearInterval(timer);
                countdownOverlay.classList.add('hidden');
                this.isPaused = false;
                this.isCountingDown = false;
            }
        }, 1000);
    }

    startMode(modeType) {
        if (modeType === 'STORY') {
            this.activeMode = new StoryMode(this.ctx, (results) => this.endGame(results));
        } else {
            this.activeMode = new ClassicMode(this.ctx, (results) => this.endGame(results));
        }

        this.isRunning = true;
        this.isPaused = false;
        this.isCountingDown = false;

        // Hide Menus
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('about-modal').classList.add('hidden');
        document.getElementById('instructions').classList.remove('hidden');

        const instr = document.getElementById('instructions');
        if (modeType === 'STORY') {
            instr.innerHTML = `<p class="text-cosmic-accent-strong mb-1"><strong>GALACTIC ODYSSEY</strong></p>Arrows/Space to Fly<br>F/Z to Shoot<br>Use Checkpoints. Collect Hearts.`;
        } else {
            instr.innerHTML = `<p class="text-cosmic-accent-strong mb-1"><strong>CLASSIC ARCADE</strong></p>Arrows/Space to Fly<br>Dodge Everything!<br>No Shooting. No Mercy.`;
        }

        this.loop();
    }

    loop() {
        if (!this.isRunning) return;

        if (!this.isPaused && !this.isCountingDown && this.activeMode) {
            this.activeMode.handleInput(this.keys);
            this.activeMode.update();
            this.activeMode.draw();
            this.updateHUD(this.activeMode.getHUDData());
        } else if (this.isPaused || this.isCountingDown) {
            // Keep drawing so it doesn't vanish
            if (this.activeMode) this.activeMode.draw();
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

        if (data.coins !== null && data.coins !== undefined) {
            document.getElementById('coin-display').style.display = 'block';
            document.getElementById('coin-count').innerText = data.coins;
        } else {
            // keep hidden if classic mode doesn't return coins
        }
    }

    endGame(results) {
        this.isRunning = false;
        const gameOverEl = document.getElementById('game-over');
        gameOverEl.classList.remove('hidden');

        document.getElementById('final-score').innerText = Math.floor(results.score);

        gsap.fromTo(gameOverEl, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1 });

        // No auto reboot. Waiting for user input.
    }

    resetToMenu() {
        this.activeMode = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isCountingDown = false;

        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('countdown-overlay').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        document.getElementById('instructions').classList.add('hidden');

        // Clear canvas
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

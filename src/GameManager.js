import { StoryMode } from './modes/StoryMode.js';
import { ClassicMode } from './modes/ClassicMode.js';
import { BossRushMode } from './modes/BossRushMode.js';
import { Star } from './entities/Star.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { sounds } from './utils/SoundManager.js';
import gsap from 'gsap';

export class GameManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.activeMode = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isCountingDown = false;
        this._lastTimestamp = 0;

        // Background menu stars
        this.menuStars = [];
        for (let i = 0; i < 150; i++) {
            this.menuStars.push(new Star());
        }

        // Global Keyboard Input
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            sounds.ensureContext();
            this.keys[e.code] = true;
            if (e.code === 'Escape' || e.code === 'KeyP') {
                this.togglePause();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        this.setupUI();
        this.setupAudioToggle();
        this.startMenuLoop();
    }

    setupAudioToggle() {
        const updateAudioIcons = () => {
            const isMuted = sounds.isMuted();
            const icon = isMuted ? '🔇' : '🔊';
            const audioBtns = document.querySelectorAll('.btn-audio-toggle');
            audioBtns.forEach(btn => {
                btn.innerText = icon;
                btn.title = isMuted ? 'Unmute Audio' : 'Mute Audio';
            });
        };

        const toggleSound = (e) => {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            sounds.ensureContext();
            sounds.toggleMute();
            updateAudioIcons();
            if (!sounds.isMuted()) {
                sounds.playClick();
            }
        };

        document.querySelectorAll('.btn-audio-toggle').forEach(btn => {
            btn.addEventListener('click', toggleSound);
        });

        updateAudioIcons();
    }

    setupUI() {
        // Pause Menu Handlers
        document.getElementById('btn-resume').addEventListener('click', () => {
            sounds.playClick();
            this.togglePause();
        });
        document.getElementById('btn-quit').addEventListener('click', () => {
            sounds.playClick();
            this.resetToMenu();
        });

        // Mode Selection Handlers
        document.getElementById('btn-classic').addEventListener('click', () => {
            sounds.playClick();
            this.startMode('CLASSIC');
        });
        document.getElementById('btn-story').addEventListener('click', () => {
            sounds.playClick();
            this.startMode('STORY');
        });
        document.getElementById('btn-bossrush').addEventListener('click', () => {
            sounds.playClick();
            this.startMode('BOSS_RUSH');
        });

        // About Modal Handlers
        document.getElementById('btn-about').addEventListener('click', () => {
            sounds.playClick();
            document.getElementById('about-modal').classList.remove('hidden');
        });
        document.getElementById('btn-close-about').addEventListener('click', () => {
            sounds.playClick();
            document.getElementById('about-modal').classList.add('hidden');
        });

        // Game Over Handlers
        document.getElementById('btn-relaunch').addEventListener('click', () => {
            sounds.playClick();
            let currentModeType = 'CLASSIC';
            if (this.activeMode instanceof StoryMode) currentModeType = 'STORY';
            if (this.activeMode instanceof BossRushMode) currentModeType = 'BOSS_RUSH';
            this.startMode(currentModeType);
        });

        document.getElementById('btn-return-menu').addEventListener('click', () => {
            sounds.playClick();
            this.resetToMenu();
        });

        // Mobile Controls
        this.setupMobileControls();
    }

    setupMobileControls() {
        const gameContainer = document.getElementById('game-container');
        let touchStartX = 0;

        const handleTouchStart = (e) => {
            if (!this.isRunning || this.isPaused || this.isCountingDown) return;
            sounds.ensureContext();

            // Ignore touches on UI buttons
            if (e.target.closest('button')) return;

            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;

            // Touch anywhere triggers thrust
            this.keys['ArrowUp'] = true;
        };

        const handleTouchMove = (e) => {
            if (!this.isRunning || this.isPaused || this.isCountingDown) return;
            e.preventDefault();

            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - touchStartX;

                // Subtle horizontal drag steering
                if (deltaX > 25) {
                    this.keys['ArrowRight'] = true;
                    this.keys['ArrowLeft'] = false;
                } else if (deltaX < -25) {
                    this.keys['ArrowLeft'] = true;
                    this.keys['ArrowRight'] = false;
                } else {
                    this.keys['ArrowLeft'] = false;
                    this.keys['ArrowRight'] = false;
                }
            }
        };

        const handleTouchEnd = (e) => {
            if (!this.isRunning) return;
            if (e.touches.length === 0) {
                this.keys['ArrowUp'] = false;
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowRight'] = false;
            }
        };

        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        gameContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        // Mobile Pause Button
        const mobilePauseBtn = document.getElementById('mobile-pause-btn');
        if (mobilePauseBtn) {
            mobilePauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                sounds.playClick();
                this.togglePause();
            });
        }
    }

    startMenuLoop() {
        const loop = () => {
            if (!this.isRunning) {
                this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                this.menuStars.forEach(s => {
                    s.update(1.2, 1);
                    s.draw(this.ctx);
                });
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    togglePause() {
        if (!this.isRunning || !this.activeMode || this.isCountingDown) return;

        if (this.isPaused) {
            this.startResumeCountdown();
        } else {
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
                sounds.playClick();
            } else {
                clearInterval(timer);
                countdownOverlay.classList.add('hidden');
                this.isPaused = false;
                this.isCountingDown = false;
            }
        }, 800);
    }

    startMode(modeType) {
        sounds.ensureContext();
        if (modeType === 'STORY') {
            this.activeMode = new StoryMode(this.ctx, (results) => this.endGame(results));
        } else if (modeType === 'BOSS_RUSH') {
            this.activeMode = new BossRushMode(this.ctx, (results) => this.endGame(results));
        } else {
            this.activeMode = new ClassicMode(this.ctx, (results) => this.endGame(results));
        }

        this.isRunning = true;
        this.isPaused = false;
        this.isCountingDown = false;
        this._lastTimestamp = performance.now();

        // Hide Menus
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('about-modal').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('instructions').classList.remove('hidden');

        const instr = document.getElementById('instructions');
        if (modeType === 'STORY') {
            instr.innerHTML = `<p class="text-cosmic-accent-strong mb-1"><strong>GALACTIC ODYSSEY</strong></p>Arrows / Space to Fly<br>Dodge Hazards & Collect Hearts<br>Charge EMP to Evade Mothership!`;
        } else if (modeType === 'BOSS_RUSH') {
            instr.innerHTML = `<p class="text-green-400 mb-1"><strong>SURVIVAL PROTOCOL</strong></p>Survive 30s per Wave<br>Pure Piloting Skill Required<br>Dodge Everything!`;
        } else {
            instr.innerHTML = `<p class="text-cosmic-accent-strong mb-1"><strong>CLASSIC ARCADE</strong></p>Arrows / Space to Fly<br>Dodge Asteroids & UFOs<br>Collect Coins for +100 PTS!`;
        }

        this.loop(performance.now());
    }

    loop(timestamp = 0) {
        if (!this.isRunning) return;

        const rawDt = timestamp - (this._lastTimestamp || timestamp);
        this._lastTimestamp = timestamp;
        // Normalize to 60fps baseline
        const dt = Math.min(rawDt, 50) / 16.667;

        if (!this.isPaused && !this.isCountingDown && this.activeMode) {
            this.activeMode.handleInput(this.keys, dt);
            this.activeMode.update(dt);
            this.activeMode.draw();
            this.updateHUD(this.activeMode.getHUDData());
        } else if (this.isPaused || this.isCountingDown) {
            if (this.activeMode) this.activeMode.draw();
        }

        requestAnimationFrame((ts) => this.loop(ts));
    }

    updateHUD(data) {
        let heartString = '';
        for (let i = 0; i < Math.max(0, data.lives); i++) heartString += '❤️';
        document.getElementById('hearts').innerText = heartString || '💀';

        document.getElementById('score').innerText = data.score.toString().padStart(5, '0');
        document.getElementById('high-score').innerText = data.highScore;

        const lvlDisplay = document.getElementById('level-display');
        lvlDisplay.innerText = data.label;
        lvlDisplay.style.color = data.labelColor;

        const coinDisplay = document.getElementById('coin-display');
        if (data.coins !== null && data.coins !== undefined) {
            coinDisplay.style.display = 'block';
            document.getElementById('coin-count').innerText = data.coins;
        } else {
            coinDisplay.style.display = 'none';
        }
    }

    endGame(results) {
        this.isRunning = false;
        const gameOverEl = document.getElementById('game-over');
        gameOverEl.classList.remove('hidden');

        document.getElementById('final-score').innerText = results.score;
        document.getElementById('game-over-high').innerText = `BEST: ${results.highScore}`;
        document.getElementById('game-over-coins').innerText = `COINS: ${results.coins || 0}`;

        const newHighBadge = document.getElementById('new-high-badge');
        if (newHighBadge) {
            if (results.isNewHigh) {
                newHighBadge.classList.remove('hidden');
            } else {
                newHighBadge.classList.add('hidden');
            }
        }

        gsap.fromTo(gameOverEl, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4 });
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

        // Reset borders
        const container = document.getElementById('game-container');
        if (container) {
            container.style.borderColor = '#FFFFFF';
        }
    }
}

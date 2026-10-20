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
        this.setupFullscreenToggle();
        this.setupOrientationHandler();
        this.startMenuLoop();
    }

    setupFullscreenToggle() {
        const toggleFullscreen = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            sounds.playClick();

            if (!document.fullscreenElement) {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(() => {});
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen().catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen().catch(() => {});
                }
            }
        };

        const updateFullscreenIcons = () => {
            const isFull = !!document.fullscreenElement;
            document.querySelectorAll('.btn-fullscreen').forEach(btn => {
                btn.innerText = isFull ? '✖' : '⛶';
                btn.title = isFull ? 'Exit Fullscreen' : 'Enter Fullscreen';
            });
        };

        document.querySelectorAll('.btn-fullscreen').forEach(btn => {
            btn.addEventListener('click', toggleFullscreen);
        });

        document.addEventListener('fullscreenchange', updateFullscreenIcons);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcons);
    }

    setupOrientationHandler() {
        const checkOrientation = () => {
            const hint = document.getElementById('portrait-hint');
            if (!hint) return;
            const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
            if (isPortrait) {
                hint.classList.remove('hidden');
                hint.classList.add('flex');
            } else {
                hint.classList.add('hidden');
                hint.classList.remove('flex');
            }
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        checkOrientation();
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
        const touchLeft = document.getElementById('touch-left');
        const touchRight = document.getElementById('touch-right');
        const touchThrust = document.getElementById('touch-thrust');

        // Helper to bind tactile button touch events
        const bindButton = (btn, key) => {
            if (!btn) return;

            const onStart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                sounds.ensureContext();
                this.keys[key] = true;
                btn.classList.add('active');
                sounds.vibrate(12);
            };

            const onEnd = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.keys[key] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', onStart, { passive: false });
            btn.addEventListener('touchend', onEnd, { passive: false });
            btn.addEventListener('touchcancel', onEnd, { passive: false });

            // Desktop click/mouse support for on-screen buttons
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                sounds.ensureContext();
                this.keys[key] = true;
                btn.classList.add('active');
            });
            window.addEventListener('mouseup', () => {
                this.keys[key] = false;
                btn.classList.remove('active');
            });
        };

        bindButton(touchLeft, 'ArrowLeft');
        bindButton(touchRight, 'ArrowRight');
        bindButton(touchThrust, 'ArrowUp');

        // Global Canvas Gestures (Tap & Drag anywhere as an alternative control)
        let touchStartX = 0;

        const handleCanvasTouchStart = (e) => {
            if (!this.isRunning || this.isPaused || this.isCountingDown) return;
            sounds.ensureContext();

            // Ignore if tapped on a button
            if (e.target.closest('button')) return;

            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;

            // Tap & hold anywhere thrusts
            this.keys['ArrowUp'] = true;
            sounds.vibrate(10);
        };

        const handleCanvasTouchMove = (e) => {
            if (!this.isRunning || this.isPaused || this.isCountingDown) return;
            if (e.target.closest('button')) return;

            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - touchStartX;

                if (deltaX > 20) {
                    this.keys['ArrowRight'] = true;
                    this.keys['ArrowLeft'] = false;
                } else if (deltaX < -20) {
                    this.keys['ArrowLeft'] = true;
                    this.keys['ArrowRight'] = false;
                } else {
                    this.keys['ArrowLeft'] = false;
                    this.keys['ArrowRight'] = false;
                }
            }
        };

        const handleCanvasTouchEnd = (e) => {
            if (!this.isRunning) return;
            if (e.target.closest('button')) return;

            if (e.touches.length === 0) {
                this.keys['ArrowUp'] = false;
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowRight'] = false;
            }
        };

        gameContainer.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
        gameContainer.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
        gameContainer.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });
        gameContainer.addEventListener('touchcancel', handleCanvasTouchEnd, { passive: false });

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

            const touchControls = document.getElementById('touch-controls');
            if (touchControls) touchControls.classList.add('hidden');
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

                // Restore touch controls if mobile
                this.updateTouchControlsVisibility();
            }
        }, 800);
    }

    updateTouchControlsVisibility() {
        const touchControls = document.getElementById('touch-controls');
        if (!touchControls) return;

        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 1024;
        if (this.isRunning && !this.isPaused && !this.isCountingDown && isTouchDevice) {
            touchControls.classList.remove('hidden');
        } else {
            touchControls.classList.add('hidden');
        }
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

        // Hide Menus & Show In-Game HUD
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('about-modal').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('instructions').classList.remove('hidden');

        this.updateTouchControlsVisibility();

        const instr = document.getElementById('instructions');
        if (modeType === 'STORY') {
            instr.innerHTML = `<p class="text-cosmic-accent-strong mb-0.5"><strong>GALACTIC ODYSSEY</strong></p>Fly with Arrows / Touch<br>Collect Hearts & EMP Cores to Evade Mothership!`;
        } else if (modeType === 'BOSS_RUSH') {
            instr.innerHTML = `<p class="text-green-400 mb-0.5"><strong>SURVIVAL PROTOCOL</strong></p>Survive 30s per Wave<br>Pure Piloting Skill Required!`;
        } else {
            instr.innerHTML = `<p class="text-cosmic-accent-strong mb-0.5"><strong>CLASSIC ARCADE</strong></p>Fly with Arrows / Touch<br>Dodge Hazards & Collect Coins for +100 PTS!`;
        }

        this.loop(performance.now());
    }

    loop(timestamp = 0) {
        if (!this.isRunning) return;

        const rawDt = timestamp - (this._lastTimestamp || timestamp);
        this._lastTimestamp = timestamp;
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

        const touchControls = document.getElementById('touch-controls');
        if (touchControls) touchControls.classList.add('hidden');

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

        const touchControls = document.getElementById('touch-controls');
        if (touchControls) touchControls.classList.add('hidden');

        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('countdown-overlay').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        document.getElementById('instructions').classList.add('hidden');

        const container = document.getElementById('game-container');
        if (container) {
            container.style.borderColor = '#FFFFFF';
        }
    }
}

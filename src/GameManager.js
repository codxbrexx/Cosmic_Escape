import { StoryMode } from './modes/StoryMode.js';
import { ClassicMode } from './modes/ClassicMode.js';
import { BossRushMode } from './modes/BossRushMode.js';
import { Star } from './entities/Star.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { sounds } from './utils/SoundManager.js';
import { authManager } from './utils/AuthManager.js';
import { LeaderboardManager } from './utils/LeaderboardManager.js';
import { SkinManager, SHIP_SKINS } from './utils/SkinManager.js';
import { shipSprite } from './utils/Sprite.js';
import { detectUserRegion } from './utils/firebaseConfig.js';
import gsap from 'gsap';

export class GameManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.activeMode = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isCountingDown = false;
        this._lastTimestamp = 0;

        // Leaderboard state
        this.lbCurrentMode = 'CLASSIC';
        this.lbCurrentScope = 'GLOBAL';

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
        this.setupAuth();
        this.setupLeaderboard();
        this.setupHangar();
        this.updateMenuCoinDisplay();
        this.startMenuLoop();
        this.updateGalaxyChampionTicker();
    }

    setupAuth() {
        const pilotNameEl = document.getElementById('pilot-name');
        const pilotAvatarEl = document.getElementById('pilot-avatar');
        const pilotIconEl = document.getElementById('pilot-icon');
        const authBtn = document.getElementById('btn-auth-action');
        const lbUserName = document.getElementById('lb-user-name');
        const lbUserStatus = document.getElementById('lb-user-status');
        const lbGoogleBtn = document.getElementById('lb-btn-google-login');

        authManager.onAuthChange((profile) => {
            if (profile.isAuthenticated) {
                if (pilotNameEl) pilotNameEl.innerText = profile.displayName.slice(0, 14);
                if (lbUserName) lbUserName.innerText = profile.displayName.slice(0, 14);
                if (lbUserStatus) lbUserStatus.innerText = '(VERIFIED)';

                if (profile.photoURL && pilotAvatarEl) {
                    pilotAvatarEl.src = profile.photoURL;
                    pilotAvatarEl.classList.remove('hidden');
                    if (pilotIconEl) pilotIconEl.classList.add('hidden');
                }
                if (authBtn) authBtn.innerText = 'LOGOUT';
                if (lbGoogleBtn) lbGoogleBtn.innerText = 'LOGOUT';
            } else {
                if (pilotNameEl) pilotNameEl.innerText = profile.displayName;
                if (lbUserName) lbUserName.innerText = profile.displayName;
                if (lbUserStatus) lbUserStatus.innerText = '(GUEST)';
                if (pilotAvatarEl) pilotAvatarEl.classList.add('hidden');
                if (pilotIconEl) pilotIconEl.classList.remove('hidden');
                if (authBtn) authBtn.innerText = 'LOGIN';
                if (lbGoogleBtn) lbGoogleBtn.innerText = 'G SIGN IN';
            }
        });

        const handleAuthAction = async () => {
            sounds.playClick();
            const profile = authManager.getProfile();
            if (profile.isAuthenticated) {
                await authManager.logout();
            } else {
                await authManager.signInWithGoogle();
            }
            this.refreshLeaderboardView();
        };

        if (authBtn) authBtn.addEventListener('click', handleAuthAction);
        if (lbGoogleBtn) lbGoogleBtn.addEventListener('click', handleAuthAction);

        if (pilotNameEl) {
            pilotNameEl.addEventListener('click', () => {
                const profile = authManager.getProfile();
                if (profile.isGuest) {
                    const newName = prompt('Enter Pilot Callsign (max 10 letters):', profile.displayName);
                    if (newName) {
                        authManager.setGuestCallsign(newName);
                    }
                }
            });
        }
    }

    setupLeaderboard() {
        const lbModal = document.getElementById('leaderboard-modal');
        const openBtn = document.getElementById('btn-open-leaderboard');
        const closeBtn = document.getElementById('btn-close-leaderboard');
        const gameOverLbBtn = document.getElementById('btn-game-over-leaderboard');
        const championTicker = document.getElementById('galaxy-champion-ticker');

        const tabGlobal = document.getElementById('lb-tab-global');
        const tabRegional = document.getElementById('lb-tab-regional');
        const regionLabel = document.getElementById('lb-detected-region');

        if (regionLabel) {
            regionLabel.innerText = detectUserRegion();
        }

        const openLeaderboard = (mode = 'CLASSIC') => {
            sounds.playClick();
            this.lbCurrentMode = mode;
            if (lbModal) lbModal.classList.remove('hidden');
            this.refreshLeaderboardView();
        };

        if (openBtn) openBtn.addEventListener('click', () => openLeaderboard(this.lbCurrentMode));
        if (gameOverLbBtn) gameOverLbBtn.addEventListener('click', () => openLeaderboard(this.lbCurrentMode));
        if (championTicker) championTicker.addEventListener('click', () => openLeaderboard('CLASSIC'));

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sounds.playClick();
                if (lbModal) lbModal.classList.add('hidden');
            });
        }

        if (tabGlobal && tabRegional) {
            tabGlobal.addEventListener('click', () => {
                sounds.playClick();
                this.lbCurrentScope = 'GLOBAL';
                tabGlobal.classList.add('border-white', 'bg-white', 'text-black');
                tabGlobal.classList.remove('border-white/40', 'bg-black', 'text-white');
                tabRegional.classList.add('border-white/40', 'bg-black', 'text-white');
                tabRegional.classList.remove('border-white', 'bg-white', 'text-black');
                this.refreshLeaderboardView();
            });

            tabRegional.addEventListener('click', () => {
                sounds.playClick();
                this.lbCurrentScope = 'REGIONAL';
                tabRegional.classList.add('border-white', 'bg-white', 'text-black');
                tabRegional.classList.remove('border-white/40', 'bg-black', 'text-white');
                tabGlobal.classList.add('border-white/40', 'bg-black', 'text-white');
                tabGlobal.classList.remove('border-white', 'bg-white', 'text-black');
                this.refreshLeaderboardView();
            });
        }

        const modeButtons = document.querySelectorAll('.lb-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sounds.playClick();
                modeButtons.forEach(b => {
                    b.classList.remove('active', 'border-cyan-400', 'bg-cyan-400', 'text-black');
                    b.classList.add('border-white/40', 'bg-black', 'text-white');
                });
                btn.classList.add('active', 'border-cyan-400', 'bg-cyan-400', 'text-black');
                btn.classList.remove('border-white/40', 'bg-black', 'text-white');
                this.lbCurrentMode = btn.dataset.mode;
                this.refreshLeaderboardView();
            });
        });
    }

    async refreshLeaderboardView() {
        const listEl = document.getElementById('leaderboard-list');
        if (!listEl) return;

        listEl.innerHTML = `<div class="py-4 text-center text-gray-400 animate-pulse text-[8px]">SCANNING HYPERSPACE RECORDS...</div>`;

        try {
            const scores = await LeaderboardManager.getLeaderboard(this.lbCurrentMode, this.lbCurrentScope);
            if (!scores || scores.length === 0) {
                listEl.innerHTML = `<div class="py-4 text-center text-gray-400 text-[8px]">NO HYPERSPACE RECORDS FOUND YET</div>`;
                return;
            }

            let html = '';
            scores.forEach((entry, idx) => {
                const rank = idx + 1;
                let rankBadge = `#${rank}`;
                let rankColor = 'text-gray-300';
                let rowBg = entry.isUser ? 'bg-cyan-950/40 border border-cyan-400/60' : 'bg-white/5 border border-transparent';

                if (rank === 1) {
                    rankBadge = `🥇 #1`;
                    rankColor = 'text-yellow-400 font-bold';
                } else if (rank === 2) {
                    rankBadge = `🥈 #2`;
                    rankColor = 'text-gray-200 font-bold';
                } else if (rank === 3) {
                    rankBadge = `🥉 #3`;
                    rankColor = 'text-amber-600 font-bold';
                }

                const userTag = entry.isUser ? `<span class="ml-1 text-[7px] text-cyan-300 font-bold">[YOU]</span>` : '';

                html += `
                    <div class="grid grid-cols-12 items-center p-1.5 rounded ${rowBg} transition-all hover:bg-white/10">
                        <div class="col-span-2 text-center text-[7px] sm:text-[9px] ${rankColor}">${rankBadge}</div>
                        <div class="col-span-5 truncate text-white font-bold flex items-center">
                            <span>${entry.pilotName}</span>
                            ${userTag}
                        </div>
                        <div class="col-span-2 text-center text-[7px] sm:text-[8px] text-cyan-400/80">${entry.region || 'GLOBAL'}</div>
                        <div class="col-span-3 text-right text-yellow-400 font-bold tracking-wider">${entry.score}</div>
                    </div>
                `;
            });

            listEl.innerHTML = html;
        } catch (e) {
            console.error('Error rendering leaderboard:', e);
            listEl.innerHTML = `<div class="py-4 text-center text-red-400 text-[8px]">COMMUNICATION FAILURE</div>`;
        }
    }

    updateMenuCoinDisplay() {
        const el = document.getElementById('menu-coin-count');
        if (el) el.innerText = SkinManager.getLifetimeCoins();
    }

    setupHangar() {
        const hangarModal = document.getElementById('hangar-modal');
        const openHangarBtn = document.getElementById('btn-open-hangar');
        const closeHangarBtn = document.getElementById('btn-close-hangar');

        if (openHangarBtn) {
            openHangarBtn.addEventListener('click', () => {
                sounds.playClick();
                if (hangarModal) hangarModal.classList.remove('hidden');
                this.renderHangarSkins();
            });
        }

        if (closeHangarBtn) {
            closeHangarBtn.addEventListener('click', () => {
                sounds.playClick();
                if (hangarModal) hangarModal.classList.add('hidden');
                this.updateMenuCoinDisplay();
            });
        }
    }

    renderHangarSkins() {
        const coinsEl = document.getElementById('hangar-coins');
        const gridEl = document.getElementById('hangar-skins-grid');
        if (!gridEl) return;

        const lifetimeCoins = SkinManager.getLifetimeCoins();
        if (coinsEl) coinsEl.innerText = lifetimeCoins;
        this.updateMenuCoinDisplay();

        const equippedId = SkinManager.getEquippedSkinId();
        gridEl.innerHTML = '';

        SHIP_SKINS.forEach(skin => {
            const isUnlocked = SkinManager.isUnlocked(skin.id);
            const isEquipped = skin.id === equippedId;

            const card = document.createElement('div');
            card.className = `p-2.5 sm:p-3 rounded border ${isEquipped ? 'border-cyan-400 bg-cyan-950/30' : 'border-white/20 bg-white/5'} flex flex-col justify-between`;

            // Preview Canvas
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'w-full h-16 sm:h-20 flex items-center justify-center bg-black/60 rounded border border-white/10 mb-2 relative overflow-hidden';
            
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 80;
            previewCanvas.height = 50;
            previewCanvas.className = 'w-20 h-12 image-pixelated';
            const pCtx = previewCanvas.getContext('2d');
            
            // Draw preview star & ship
            pCtx.fillStyle = '#111';
            pCtx.fillRect(0, 0, 80, 50);
            pCtx.save();
            pCtx.shadowColor = skin.engineGlow;
            pCtx.shadowBlur = 8;
            shipSprite.draw(pCtx, 16, 12, 0, skin.shipColor);
            pCtx.restore();

            canvasContainer.appendChild(previewCanvas);
            card.appendChild(canvasContainer);

            // Details
            const titleEl = document.createElement('div');
            titleEl.className = 'text-[9px] sm:text-[10px] font-bold text-white mb-1';
            titleEl.style.color = skin.shipColor;
            titleEl.innerText = skin.name;
            card.appendChild(titleEl);

            const descEl = document.createElement('div');
            descEl.className = 'text-[7px] sm:text-[8px] text-gray-400 mb-2 leading-tight';
            descEl.innerText = skin.description;
            card.appendChild(descEl);

            // Action Button
            const actionContainer = document.createElement('div');
            actionContainer.className = 'mt-auto pt-1';

            if (isEquipped) {
                actionContainer.innerHTML = `<span class="block text-center text-[7px] sm:text-[8px] px-2 py-1 bg-cyan-500/30 text-cyan-300 border border-cyan-400 rounded font-bold">EQUIPPED</span>`;
            } else if (isUnlocked) {
                const equipBtn = document.createElement('button');
                equipBtn.className = 'w-full text-[7px] sm:text-[8px] px-2 py-1 bg-black text-white border border-white hover:bg-white hover:text-black font-press-start rounded transition-all cursor-pointer';
                equipBtn.innerText = 'EQUIP';
                equipBtn.addEventListener('click', () => {
                    SkinManager.equipSkin(skin.id);
                    sounds.playClick();
                    this.renderHangarSkins();
                });
                actionContainer.appendChild(equipBtn);
            } else {
                const unlockBtn = document.createElement('button');
                const canAfford = lifetimeCoins >= skin.cost;
                unlockBtn.className = `w-full text-[7px] sm:text-[8px] px-2 py-1 ${canAfford ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-gray-800 text-gray-500 cursor-not-allowed'} font-press-start rounded transition-all cursor-pointer`;
                unlockBtn.innerText = `🪙 ${skin.cost} UNLOCK`;
                unlockBtn.addEventListener('click', () => {
                    if (!canAfford) {
                        sounds.playHit();
                        alert(`Need ${skin.cost - lifetimeCoins} more credits! Collect coins during flights.`);
                        return;
                    }
                    const res = SkinManager.unlockSkin(skin.id);
                    if (res.success) {
                        sounds.playCoin();
                        this.renderHangarSkins();
                    }
                });
                actionContainer.appendChild(unlockBtn);
            }

            card.appendChild(actionContainer);
            gridEl.appendChild(card);
        });
    }

    async updateGalaxyChampionTicker() {
        const tickerText = document.getElementById('ticker-text');
        if (!tickerText) return;

        try {
            const champion = await LeaderboardManager.getTopChampion('CLASSIC');
            if (champion) {
                tickerText.innerText = `GALAXY CHAMPION: ${champion.pilotName} - ${champion.score} PTS (${champion.region})`;
            }
        } catch (_) {}
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

        let touchStartX = 0;

        const handleCanvasTouchStart = (e) => {
            if (!this.isRunning || this.isPaused || this.isCountingDown) return;
            sounds.ensureContext();

            if (e.target.closest('button')) return;

            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;

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
        const menuTopBar = document.getElementById('menu-top-bar');
        if (menuTopBar) menuTopBar.classList.add('hidden');
        const hudTop = document.getElementById('hud-top');
        if (hudTop) hudTop.classList.remove('hidden');

        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('about-modal').classList.add('hidden');
        document.getElementById('leaderboard-modal').classList.add('hidden');
        const hangar = document.getElementById('hangar-modal');
        if (hangar) hangar.classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('instructions').classList.remove('hidden');

        this.updateTouchControlsVisibility();

        const instr = document.getElementById('instructions');
        if (modeType === 'STORY') {
            instr.innerHTML = `<p class="text-cosmic-accent-strong mb-0.5"><strong>GALACTIC ODYSSEY</strong></p>Fly with Arrows / Touch<br>Collect Hearts & EMP Cores to Evade Mothership!`;
        } else if (modeType === 'BOSS_RUSH') {
            instr.innerHTML = `<p class="text-green-400 mb-0.5"><strong>SURVIVAL PROTOCOL</strong></p>Survive 30s Countdown -> Mothership Intercept!`;
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
        this.updateGalaxyChampionTicker();
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
        const menuTopBar = document.getElementById('menu-top-bar');
        if (menuTopBar) menuTopBar.classList.remove('hidden');
        const hudTop = document.getElementById('hud-top');
        if (hudTop) hudTop.classList.add('hidden');

        document.getElementById('instructions').classList.add('hidden');

        const container = document.getElementById('game-container');
        if (container) {
            container.style.borderColor = '#FFFFFF';
        }

        this.updateGalaxyChampionTicker();
        this.updateMenuCoinDisplay();
    }
}

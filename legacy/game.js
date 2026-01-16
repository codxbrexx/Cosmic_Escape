const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas resolution
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game State
let gameSpeed = GAME_SPEED_START;
let score = 0;
let highScore = localStorage.getItem('cosmicFlightHighScore') || 0;
let lives = 3;
let coinsCollected = 0;
let level = 1;
let frameCount = 0;
let gameOver = false;
let gameStarted = false;
let obstacles = [];
let coins = [];
let particles = [];
let stars = [];
let ship;
let invulnerableTimer = 0; // Frames

// Input
let keys = {};

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'Space'].includes(e.code)) {
        e.preventDefault();
        if (ship && !gameOver) ship.thrusting = true;
    }

    if (!gameStarted && (e.code === 'Space' || e.code === 'Enter')) {
        startGame();
    }

    if (gameOver && (e.code === 'Space' || e.code === 'Enter')) {
        resetGame();
        animate();
    }
});

window.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'Space'].includes(e.code)) {
        if (ship) ship.thrusting = false;
    }
});

function spawnObstacle() {
    if (obstacles.length > 0) {
        let lastObs = obstacles[obstacles.length - 1];
        if (CANVAS_WIDTH - lastObs.x < 300) { // Density check
            return;
        }
    }

    if (Math.random() < 0.02) {
        const type = Math.random() > 0.8 ? 'ufo' : 'asteroid';
        obstacles.push(new Obstacle(type));
    }
}

function spawnCoin() {
    if (coins.length > 0) {
        let lastCoin = coins[coins.length - 1];
        if (CANVAS_WIDTH - lastCoin.x < 150) return;
    }
    if (Math.random() < 0.01) { // 1% chance
        coins.push(new Coin());
    }
}

function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, 10, 5));
    }
}

function checkCollision(rect1, rect2) {
    let padding = 5;
    return (
        rect1.x < rect2.x + rect2.width - padding &&
        rect1.x + rect1.width - padding > rect2.x &&
        rect1.y < rect2.y + rect2.height - padding &&
        rect1.y + rect1.height - padding > rect2.y
    );
}

function updateHUD() {
    // Icons
    let heartString = '';
    for (let i = 0; i < lives; i++) heartString += '❤️';
    document.getElementById('hearts').innerText = heartString;

    document.getElementById('coin-count').innerText = coinsCollected;
    document.getElementById('score').innerText = Math.floor(score).toString().padStart(5, '0');
    document.getElementById('high-score').innerText = "HI: " + Math.floor(highScore).toString().padStart(5, '0');
    document.getElementById('level-display').innerText = "LEVEL " + level;
}

function updateEnvironment() {
    // Background change disabled by user request
    // let themeIndex = (level - 1) % LEVEL_THEMES.length;
    // document.getElementById('game-container').style.background = LEVEL_THEMES[themeIndex];
}

function update() {
    if (gameOver) return;

    if (frameCount % 600 === 0 && gameSpeed < MAX_SPEED) {
        gameSpeed += 0.5;
    }

    // Level Up Logic
    // If score crosses a multiple of 1000 threshold for the next level
    if (score >= level * 1000) {
        level++;
        updateEnvironment();
        // Difficulty bump?
        gameSpeed += 1;
        createExplosion(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#FFFFFF', 50); // Celebrate
    }

    // Stars
    stars.forEach(star => star.update());

    // Ship Logic
    if (ship) ship.update();

    if (invulnerableTimer > 0) invulnerableTimer--;

    spawnObstacle();
    spawnCoin();

    obstacles.forEach(obs => obs.update());
    obstacles = obstacles.filter(obs => !obs.markedForDeletion);

    coins.forEach(c => c.update());
    coins = coins.filter(c => !c.markedForDeletion);

    // Particles
    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);

    // Collision: Obstacles
    for (let obs of obstacles) {
        if (checkCollision(ship, obs)) {
            if (invulnerableTimer <= 0) {
                loseLife();
                createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, COLOR_ASTEROID, 15);
                obs.markedForDeletion = true;
            }
        }
    }

    // Collision: Coins
    for (let c of coins) {
        if (checkCollision(ship, c)) {
            c.markedForDeletion = true;
            score += 100;
            coinsCollected++;
            createExplosion(c.x + c.width / 2, c.y + c.height / 2, COLOR_COIN, 5); // Sparkle
        }
    }

    score += 0.1; 
    updateHUD();
    frameCount++;
}

function loseLife() {
    lives--;
    invulnerableTimer = 60; // 1 second invulnerability (assuming 60fps)

    createExplosion(ship.x + ship.width / 2, ship.y + ship.height / 2, '#FF0000', 20);

    if (lives <= 0) {
        endGame();
    }
}

function endGame() {
    gameOver = true;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cosmicFlightHighScore', highScore);
    }

    // Update Game Over Modal
    document.getElementById('final-score').innerText = Math.floor(score);
    document.getElementById('final-coins').innerText = coinsCollected;

    document.getElementById('game-over').classList.remove('hidden');
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Clear

    // Draw Stars
    stars.forEach(star => star.draw(ctx));

    // Draw Particles
    particles.forEach(p => p.draw(ctx));

    // Draw Entities
    coins.forEach(c => c.draw());
    obstacles.forEach(obs => obs.draw());

    if (ship) {
        // Flash if invulnerable
        if (invulnerableTimer > 0 && Math.floor(frameCount / 4) % 2 === 0) {
            // Blink -> don't draw
        } else {
            ship.draw();
        }
    }
}

function resetGame() {
    gameOver = false;
    obstacles = [];
    coins = [];
    particles = [];
    score = 0;
    coinsCollected = 0;
    lives = 3;
    level = 1;
    updateEnvironment(); // Reset to level 1 color
    gameSpeed = GAME_SPEED_START;
    ship = new Ship();
    invulnerableTimer = 0;

    // Init stars
    stars = [];
    for (let i = 0; i < 150; i++) { // More stars for big screen
        stars.push(new Star());
    }

    document.getElementById('game-over').classList.add('hidden');
    updateHUD();
}

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('instructions').classList.remove('hidden');
    // document.getElementById('score').classList.remove('hidden'); // HUD is visible
    resetGame();
    animate();
}

function animate() {
    if (!gameStarted) return;
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(animate);
    }
}

document.getElementById('start-btn').addEventListener('click', startGame);

function init() {
    // Draw initial stars
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push(new Star());
    }
    draw();
    updateHUD();
}

init();

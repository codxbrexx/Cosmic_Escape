import './style.css';
import { GameManager } from './GameManager.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const gameManager = new GameManager(ctx);

// Hook up UI buttons
document.getElementById('btn-classic').addEventListener('click', () => {
    gameManager.startMode('CLASSIC');
});

document.getElementById('btn-story').addEventListener('click', () => {
    gameManager.startMode('STORY');
});

// Restart Button
document.getElementById('restart-btn').addEventListener('click', () => {
    // Restart the LAST active mode
    if (gameManager.activeMode instanceof Object) {
        window.location.reload();
    }
});

// Stars Background Loop (Menu)
import { Star } from './entities/Star.js';
let stars = [];
for (let i = 0; i < 150; i++) stars.push(new Star());

function menuLoop() {
    if (gameManager.isRunning) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    stars.forEach(s => {
        s.update(1);
        s.draw(ctx);
    });
    requestAnimationFrame(menuLoop);
}
menuLoop();

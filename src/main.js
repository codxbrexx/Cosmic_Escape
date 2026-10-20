import './style.css';
import { GameManager } from './GameManager.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Initialize GameManager
const gameManager = new GameManager(ctx);

// Register PWA Service Worker for offline play
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
            console.debug('ServiceWorker registration skipped:', err);
        });
    });
}

export { gameManager };

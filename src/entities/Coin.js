import { coinSprite } from '../utils/Sprite.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_COIN } from '../constants.js';

export class Coin {
    constructor() {
        this.sprite = coinSprite;
        this.x = CANVAS_WIDTH + Math.random() * 200;
        this.y = Math.random() * (CANVAS_HEIGHT - 100);
        this.width = this.sprite.width;
        this.height = this.sprite.height;
        this.markedForDeletion = false;
        this.bobOffset = Math.random() * 100;
    }

    update(gameSpeed, frameCount) {
        this.x -= gameSpeed;
        this.y += Math.sin((frameCount + this.bobOffset) * 0.1) * 0.5; // Bob logic

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        this.sprite.draw(ctx, this.x, this.y, 0, COLOR_COIN);
    }
}

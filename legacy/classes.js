class Particle {
    constructor(x, y, color, speed, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * size + 1;
        this.speedX = Math.random() * speed - speed / 2;
        this.speedY = Math.random() * speed - speed / 2;
        this.life = 1.0; // Opacity
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.05;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

class Coin {
    constructor() {
        this.sprite = coinSprite;
        this.x = CANVAS_WIDTH + Math.random() * 200;
        this.y = Math.random() * (CANVAS_HEIGHT - 100);
        this.width = this.sprite.width;
        this.height = this.sprite.height;
        this.markedForDeletion = false;
        this.bobOffset = Math.random() * 100;
    }

    update() {
        this.x -= gameSpeed;
        this.y += Math.sin((frameCount + this.bobOffset) * 0.1) * 0.5; // Bob logic

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        this.sprite.draw(ctx, this.x, this.y, 0, COLOR_COIN);
    }
}

class Star {
    constructor() {
        this.x = Math.random() * CANVAS_WIDTH;
        this.y = Math.random() * CANVAS_HEIGHT;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 3 + 0.5;
        this.brightness = Math.random();
    }

    update() {
        this.x -= this.speed * (gameSpeed * 0.1);
        if (this.x < 0) {
            this.x = CANVAS_WIDTH;
            this.y = Math.random() * CANVAS_HEIGHT;
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Ship {
    constructor() {
        this.x = 100;
        this.y = CANVAS_HEIGHT / 2;
        this.vy = 0;
        this.width = shipSprite.width;
        this.height = shipSprite.height;
        this.thrusting = false;
    }

    update() {
        // Physics
        if (this.thrusting) {
            this.vy += THRUST_FORCE * 0.1; 
            if (frameCount % 3 === 0) {
                particles.push(new Particle(this.x, this.y + this.height - 10, COLOR_ENGINE, 4, 3));
            }
        } else {
            this.vy += GRAVITY;
        }

        // Cap speed
        if (this.vy > 8) this.vy = 8;
        if (this.vy < -6) this.vy = -6;

        this.y += this.vy;

        // Bounds
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }
        if (this.y + this.height > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.height;
            if (invulnerableTimer <= 0) {
                loseLife();
                createExplosion(this.x + this.width / 2, this.y + this.height, '#FF4444');
                ship.vy = -12; 
            }
        }
    }

    draw() {
        shipSprite.draw(ctx, this.x, this.y, 0, COLOR_SHIP);

        // Draw Engine flame if thrusting
        if (this.thrusting) {
            // Main engine glare
            ctx.fillStyle = COLOR_ENGINE;
            ctx.fillRect(this.x, this.y + this.height - 5, 8, 15 + Math.random() * 10);
        }
    }
}

class Obstacle {
    constructor(type) {
        this.type = type;
        this.markedForDeletion = false;
        this.x = CANVAS_WIDTH + Math.random() * 200;

        // Random Y position
        this.y = Math.random() * (CANVAS_HEIGHT - 50);

        if (type === 'asteroid') {
            this.sprite = asteroidSprite;
            this.color = COLOR_ASTEROID;
        } else {
            this.sprite = ufoSprite;
            this.color = COLOR_UFO;
        }

        this.width = this.sprite.width;
        this.height = this.sprite.height;
    }

    update() {
        this.x -= gameSpeed;

        if (this.type === 'ufo') {
            this.x -= 2; // UFOs vary speed
            this.y += Math.sin(frameCount * 0.05) * 2; // Hover effect
        }

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        this.sprite.draw(ctx, this.x, this.y, 0, this.color);
    }
}

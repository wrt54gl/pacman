const CONFIG = require('./config');

class Player {
    constructor(id, name, spawnIndex) {
        this.id = id;
        this.name = name;
        this.spawnIndex = spawnIndex;

        // Visual
        this.color = CONFIG.PLAYER_COLORS[spawnIndex];

        // Position and movement
        const spawn = CONFIG.PLAYER_SPAWN_POINTS[spawnIndex];
        this.x = spawn.x * CONFIG.TILE_SIZE;
        this.y = spawn.y * CONFIG.TILE_SIZE;
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.direction = spawn.direction;
        this.nextDirection = spawn.direction;
        this.speed = CONFIG.PLAYER_SPEED;
        this.radius = CONFIG.PLAYER_RADIUS;
        this.hasReceivedInput = false; // Don't move until first input

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // Game state
        this.lives = CONFIG.STARTING_LIVES;
        this.score = 0;
        this.state = 'ALIVE'; // ALIVE, DEAD, SPAWNING, POWERED
        this.ghostCombo = 0;
        this.powerModeEndTime = 0;
        this.invulnerableUntil = 0;
        this.respawnTime = 0;

        // Network
        this.lastProcessedInput = 0;

        // Stats
        this.dotsCollected = 0;
        this.ghostsEaten = 0;
        this.gotExtraLife = false;
    }

    // Apply input (change direction)
    applyInput(input) {
        this.lastProcessedInput = input.sequence;
        this.nextDirection = input.direction;
        this.hasReceivedInput = true; // Player has made first input
    }

    // Update player position
    update(deltaTime, maze) {
        if (this.state === 'DEAD' || this.state === 'SPAWNING') {
            return;
        }

        // Don't move until player has made first input
        if (!this.hasReceivedInput) {
            return;
        }

        // Check if invulnerability expired
        if (this.invulnerableUntil > 0 && Date.now() > this.invulnerableUntil) {
            this.invulnerableUntil = 0;
        }

        // Check if power mode expired
        if (this.state === 'POWERED' && Date.now() > this.powerModeEndTime) {
            this.endPowerMode();
        }

        // Try to change to next direction if possible
        if (this.nextDirection !== this.direction && this.nextDirection !== 'NONE') {
            // Check if we can turn based on current direction and position
            if (this.canTurn(this.nextDirection, maze)) {
                this.direction = this.nextDirection;
                // Snap to exact tile center when changing direction
                this.snapToTileCenter();
            }
        }

        // Move in current direction
        if (this.direction !== 'NONE') {
            // Check if we can continue moving in current direction
            const canMoveForward = this.canMove(this.direction, maze);

            // If we can't move forward but have a pending turn, try turning again
            if (!canMoveForward && this.nextDirection !== this.direction && this.nextDirection !== 'NONE') {
                if (this.canTurn(this.nextDirection, maze)) {
                    this.direction = this.nextDirection;
                    this.snapToTileCenter();
                }
            }

            // Now check again if we can move
            if (this.canMove(this.direction, maze)) {
                const distance = this.speed * deltaTime;

                switch (this.direction) {
                    case 'UP':
                        this.vy = -this.speed;
                        this.vx = 0;
                        this.y -= distance;
                        // Keep centered horizontally
                        this.x = (Math.floor(this.x / CONFIG.TILE_SIZE) + 0.5) * CONFIG.TILE_SIZE;
                        break;
                    case 'DOWN':
                        this.vy = this.speed;
                        this.vx = 0;
                        this.y += distance;
                        // Keep centered horizontally
                        this.x = (Math.floor(this.x / CONFIG.TILE_SIZE) + 0.5) * CONFIG.TILE_SIZE;
                        break;
                    case 'LEFT':
                        this.vx = -this.speed;
                        this.vy = 0;
                        this.x -= distance;
                        // Keep centered vertically
                        this.y = (Math.floor(this.y / CONFIG.TILE_SIZE) + 0.5) * CONFIG.TILE_SIZE;
                        break;
                    case 'RIGHT':
                        this.vx = this.speed;
                        this.vy = 0;
                        this.x += distance;
                        // Keep centered vertically
                        this.y = (Math.floor(this.y / CONFIG.TILE_SIZE) + 0.5) * CONFIG.TILE_SIZE;
                        break;
                }
            } else {
                // Can't move, stop at tile center
                this.snapToTileCenter();
                this.vx = 0;
                this.vy = 0;
            }
        }

        // Handle tunnel wrap-around
        const tileX = this.x / CONFIG.TILE_SIZE;
        const tileY = this.y / CONFIG.TILE_SIZE;
        const tunnelExit = maze.getTunnelExit(tileX, tileY);
        if (tunnelExit) {
            this.x = tunnelExit.x * CONFIG.TILE_SIZE;
            this.y = tunnelExit.y * CONFIG.TILE_SIZE;
        }
    }

    // Check if player can turn to a new direction
    canTurn(newDirection, maze) {
        if (newDirection === 'NONE' || newDirection === this.direction) {
            return false;
        }

        const tileX = this.x / CONFIG.TILE_SIZE;
        const tileY = this.y / CONFIG.TILE_SIZE;
        const threshold = 0.35; // Increased tolerance for smoother turning

        // Check if we're at the right position to turn
        const isHorizontalMove = this.direction === 'LEFT' || this.direction === 'RIGHT';
        const isVerticalMove = this.direction === 'UP' || this.direction === 'DOWN';
        const isStartingMove = this.direction === 'NONE';

        // Calculate distance from tile center
        const centerX = Math.floor(tileX) + 0.5;
        const centerY = Math.floor(tileY) + 0.5;
        const dx = Math.abs(tileX - centerX);
        const dy = Math.abs(tileY - centerY);

        // Allow turn if:
        // - Starting from NONE (first move)
        // - Moving horizontally and near horizontal center (can turn vertically)
        // - Moving vertically and near vertical center (can turn horizontally)
        let canTurnNow = false;

        if (isStartingMove) {
            // First move - always allow
            canTurnNow = true;
        } else if (isHorizontalMove && (newDirection === 'UP' || newDirection === 'DOWN')) {
            // Turning from horizontal to vertical - need to be near X center
            canTurnNow = dx < threshold;
        } else if (isVerticalMove && (newDirection === 'LEFT' || newDirection === 'RIGHT')) {
            // Turning from vertical to horizontal - need to be near Y center
            canTurnNow = dy < threshold;
        } else if (isHorizontalMove && (newDirection === 'LEFT' || newDirection === 'RIGHT')) {
            // Reversing or continuing horizontal - always allow
            canTurnNow = true;
        } else if (isVerticalMove && (newDirection === 'UP' || newDirection === 'DOWN')) {
            // Reversing or continuing vertical - always allow
            canTurnNow = true;
        }

        if (!canTurnNow) {
            return false;
        }

        // Check if the new direction has a valid path
        return this.canMove(newDirection, maze);
    }

    // Snap player to exact tile center
    snapToTileCenter() {
        const tileX = Math.floor(this.x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(this.y / CONFIG.TILE_SIZE);
        this.x = (tileX + 0.5) * CONFIG.TILE_SIZE;
        this.y = (tileY + 0.5) * CONFIG.TILE_SIZE;
    }

    // Check if player can move in a direction
    canMove(direction, maze) {
        if (direction === 'NONE') {
            return false;
        }

        const tileX = Math.floor(this.x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(this.y / CONFIG.TILE_SIZE);

        let checkX = tileX;
        let checkY = tileY;

        switch (direction) {
            case 'UP':
                checkY = tileY - 1;
                break;
            case 'DOWN':
                checkY = tileY + 1;
                break;
            case 'LEFT':
                checkX = tileX - 1;
                break;
            case 'RIGHT':
                checkX = tileX + 1;
                break;
        }

        return !maze.isWall(checkX, checkY);
    }

    // Collect a dot
    collectDot() {
        this.score += CONFIG.DOT_SCORE;
        this.dotsCollected++;
        this.checkExtraLife();
    }

    // Collect a power pellet
    collectPowerPellet() {
        this.score += CONFIG.POWER_PELLET_SCORE;
        this.dotsCollected++;
        this.enterPowerMode();
        this.checkExtraLife();
    }

    // Enter power mode
    enterPowerMode() {
        this.state = 'POWERED';
        this.powerModeEndTime = Date.now() + CONFIG.POWER_MODE_DURATION;
        this.ghostCombo = 0;
    }

    // End power mode
    endPowerMode() {
        if (this.state === 'POWERED') {
            this.state = 'ALIVE';
        }
        this.ghostCombo = 0;
    }

    // Eat a ghost
    eatGhost() {
        if (this.ghostCombo < CONFIG.GHOST_SCORES.length) {
            const points = CONFIG.GHOST_SCORES[this.ghostCombo];
            this.score += points;
            this.ghostCombo++;
            this.ghostsEaten++;
            this.checkExtraLife();
            return points;
        }
        return 0;
    }

    // Check for extra life
    checkExtraLife() {
        if (!this.gotExtraLife && this.score >= CONFIG.EXTRA_LIFE_SCORE) {
            this.lives++;
            this.gotExtraLife = true;
        }
    }

    // Player dies
    die() {
        this.lives--;
        this.state = 'DEAD';
        this.endPowerMode();
        this.vx = 0;
        this.vy = 0;

        if (this.lives > 0) {
            this.respawnTime = Date.now() + CONFIG.PLAYER_RESPAWN_DELAY;
        }

        return this.lives > 0;
    }

    // Respawn player
    respawn() {
        if (this.lives <= 0) {
            return false;
        }

        this.x = this.spawnX;
        this.y = this.spawnY;
        this.direction = 'NONE';
        this.nextDirection = 'NONE';
        this.vx = 0;
        this.vy = 0;
        this.state = 'ALIVE';
        this.invulnerableUntil = Date.now() + CONFIG.PLAYER_SPAWN_INVULNERABILITY;
        this.respawnTime = 0;
        this.hasReceivedInput = false; // Wait for input after respawn

        return true;
    }

    // Check if player is invulnerable
    isInvulnerable() {
        return this.invulnerableUntil > Date.now();
    }

    // Check if player is powered
    isPowered() {
        return this.state === 'POWERED';
    }

    // Check if player is alive
    isAlive() {
        return this.state === 'ALIVE' || this.state === 'POWERED';
    }

    // Get tile position
    getTilePosition() {
        return {
            x: Math.floor(this.x / CONFIG.TILE_SIZE),
            y: Math.floor(this.y / CONFIG.TILE_SIZE)
        };
    }

    // Serialize player state for network
    serialize() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            direction: this.direction,
            color: this.color,
            lives: this.lives,
            score: this.score,
            state: this.state,
            invulnerable: this.isInvulnerable(),
            lastProcessedInput: this.lastProcessedInput
        };
    }
}

module.exports = Player;

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
    }

    // Update player position
    update(deltaTime, maze) {
        if (this.state === 'DEAD' || this.state === 'SPAWNING') {
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
        if (this.nextDirection !== this.direction) {
            if (this.canMove(this.nextDirection, maze)) {
                this.direction = this.nextDirection;
            }
        }

        // Move in current direction
        if (this.canMove(this.direction, maze)) {
            const distance = this.speed * deltaTime;

            switch (this.direction) {
                case 'UP':
                    this.vy = -this.speed;
                    this.vx = 0;
                    this.y -= distance;
                    break;
                case 'DOWN':
                    this.vy = this.speed;
                    this.vx = 0;
                    this.y += distance;
                    break;
                case 'LEFT':
                    this.vx = -this.speed;
                    this.vy = 0;
                    this.x -= distance;
                    break;
                case 'RIGHT':
                    this.vx = this.speed;
                    this.vy = 0;
                    this.x += distance;
                    break;
            }
        } else {
            // Can't move, stop
            this.vx = 0;
            this.vy = 0;
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

    // Check if player can move in a direction
    canMove(direction, maze) {
        const nextX = this.x / CONFIG.TILE_SIZE;
        const nextY = this.y / CONFIG.TILE_SIZE;
        const margin = 0.4; // Allows turning slightly before center of tile

        let checkX = nextX;
        let checkY = nextY;

        switch (direction) {
            case 'UP':
                checkY = nextY - margin;
                break;
            case 'DOWN':
                checkY = nextY + margin;
                break;
            case 'LEFT':
                checkX = nextX - margin;
                break;
            case 'RIGHT':
                checkX = nextX + margin;
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
        const spawn = CONFIG.PLAYER_SPAWN_POINTS[this.spawnIndex];
        this.direction = spawn.direction;
        this.nextDirection = spawn.direction;
        this.vx = 0;
        this.vy = 0;
        this.state = 'ALIVE';
        this.invulnerableUntil = Date.now() + CONFIG.PLAYER_SPAWN_INVULNERABILITY;
        this.respawnTime = 0;

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

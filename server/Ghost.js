const CONFIG = require('./config');
const Pathfinding = require('./ai/Pathfinding');

class Ghost {
    constructor(type, maze) {
        this.type = type; // 'blinky', 'pinky', 'inky', 'clyde'
        this.id = type;
        this.maze = maze;
        this.pathfinding = new Pathfinding(maze);

        // Position
        const spawn = CONFIG.GHOST_SPAWN_POSITIONS[type];
        this.x = spawn.x * CONFIG.TILE_SIZE;
        this.y = spawn.y * CONFIG.TILE_SIZE;
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.direction = spawn.direction;

        // Properties
        this.radius = CONFIG.GHOST_RADIUS;
        this.baseSpeed = CONFIG.GHOST_SPEED;
        this.speed = this.baseSpeed;

        // State
        this.state = 'IN_HOUSE'; // IN_HOUSE, CHASE, SCATTER, FRIGHTENED, EATEN
        this.releaseTime = CONFIG.GHOST_RELEASE_DELAYS[type];
        this.released = false;

        // Frightened mode
        this.frightenedEndTime = 0;

        // Scatter corner
        this.scatterCorner = CONFIG.GHOST_SCATTER_CORNERS[type];

        // Animation
        this.animationFrame = 0;
    }

    // Update ghost
    update(deltaTime, game) {
        // Check if should be released from house
        if (!this.released && game.gameTime * 1000 >= this.releaseTime) {
            this.release();
        }

        // Check if frightened mode expired
        if (this.state === 'FRIGHTENED' && Date.now() > this.frightenedEndTime) {
            this.state = game.modePatternIndex < CONFIG.SCATTER_CHASE_PATTERN.length
                ? CONFIG.SCATTER_CHASE_PATTERN[game.modePatternIndex].mode
                : 'CHASE';
            this.speed = this.baseSpeed;
        }

        // Move based on state
        if (this.state === 'IN_HOUSE') {
            // Stay in house
            return;
        }

        // Get target based on state and type
        const target = this.getTarget(game);

        // Update direction at tile centers (intersections)
        if (this.isAtTileCenter()) {
            this.updateDirection(target);
        }

        // Move
        this.move(deltaTime);

        // Update animation
        this.animationFrame += deltaTime * 10;
    }

    // Check if ghost is at center of a tile
    isAtTileCenter() {
        const tileX = this.x / CONFIG.TILE_SIZE;
        const tileY = this.y / CONFIG.TILE_SIZE;
        const centerX = Math.floor(tileX) + 0.5;
        const centerY = Math.floor(tileY) + 0.5;
        const dx = Math.abs(tileX - centerX);
        const dy = Math.abs(tileY - centerY);
        return dx < 0.1 && dy < 0.1;
    }

    // Get target position based on state
    getTarget(game) {
        if (this.state === 'EATEN') {
            // Return to spawn
            return {
                x: this.spawnX / CONFIG.TILE_SIZE,
                y: this.spawnY / CONFIG.TILE_SIZE
            };
        }

        if (this.state === 'FRIGHTENED') {
            // Random movement (handled in updateDirection)
            return null;
        }

        if (this.state === 'SCATTER') {
            return this.scatterCorner;
        }

        // CHASE mode - get target based on ghost type
        return this.getChaseTarget(game);
    }

    // Get chase target (override in subclasses or use simple logic)
    getChaseTarget(game) {
        // Find nearest player
        let nearest = null;
        let minDist = Infinity;

        for (const player of game.players.values()) {
            if (!player.isAlive()) continue;

            const px = player.x / CONFIG.TILE_SIZE;
            const py = player.y / CONFIG.TILE_SIZE;
            const gx = this.x / CONFIG.TILE_SIZE;
            const gy = this.y / CONFIG.TILE_SIZE;
            const dist = this.pathfinding.getDistance(gx, gy, px, py);

            if (dist < minDist) {
                minDist = dist;
                nearest = player;
            }
        }

        if (nearest) {
            const target = {
                x: nearest.x / CONFIG.TILE_SIZE,
                y: nearest.y / CONFIG.TILE_SIZE
            };

            // Adjust target based on ghost type
            switch (this.type) {
                case 'blinky':
                    // Target player directly
                    break;
                case 'pinky':
                    // Target 4 tiles ahead
                    target.x = this.getAheadPosition(nearest, 4).x;
                    target.y = this.getAheadPosition(nearest, 4).y;
                    break;
                case 'inky':
                    // Target 2 tiles ahead (simplified)
                    target.x = this.getAheadPosition(nearest, 2).x;
                    target.y = this.getAheadPosition(nearest, 2).y;
                    break;
                case 'clyde':
                    // If far away, chase; if close, scatter
                    const dist = this.pathfinding.getDistance(
                        this.x / CONFIG.TILE_SIZE,
                        this.y / CONFIG.TILE_SIZE,
                        target.x,
                        target.y
                    );
                    if (dist < 8) {
                        return this.scatterCorner;
                    }
                    break;
            }

            return target;
        }

        return this.scatterCorner;
    }

    // Get position ahead of player
    getAheadPosition(player, tiles) {
        const px = player.x / CONFIG.TILE_SIZE;
        const py = player.y / CONFIG.TILE_SIZE;
        const target = { x: px, y: py };

        switch (player.direction) {
            case 'UP':
                target.y -= tiles;
                break;
            case 'DOWN':
                target.y += tiles;
                break;
            case 'LEFT':
                target.x -= tiles;
                break;
            case 'RIGHT':
                target.x += tiles;
                break;
        }

        return target;
    }

    // Update direction towards target
    updateDirection(target) {
        const gx = this.x / CONFIG.TILE_SIZE;
        const gy = this.y / CONFIG.TILE_SIZE;

        if (this.state === 'FRIGHTENED') {
            // Random direction
            this.direction = this.pathfinding.getRandomDirection(
                Math.floor(gx),
                Math.floor(gy),
                this.direction
            );
        } else if (target) {
            // Use pathfinding to get next direction
            this.direction = this.pathfinding.getNextDirection(
                gx,
                gy,
                target.x,
                target.y,
                this.direction
            );
        }
    }

    // Move in current direction
    move(deltaTime) {
        // Adjust speed based on state
        let currentSpeed = this.speed;
        const tileY = Math.floor(this.y / CONFIG.TILE_SIZE);

        // Slow down in tunnel
        if (tileY === 14 && this.state !== 'EATEN') {
            currentSpeed = CONFIG.GHOST_TUNNEL_SPEED;
        }

        const distance = currentSpeed * deltaTime;

        switch (this.direction) {
            case 'UP':
                this.y -= distance;
                break;
            case 'DOWN':
                this.y += distance;
                break;
            case 'LEFT':
                this.x -= distance;
                break;
            case 'RIGHT':
                this.x += distance;
                break;
        }

        // Handle tunnel wrap-around
        const tileX = this.x / CONFIG.TILE_SIZE;
        const tunnelExit = this.maze.getTunnelExit(tileX, tileY);
        if (tunnelExit) {
            this.x = tunnelExit.x * CONFIG.TILE_SIZE;
            this.y = tunnelExit.y * CONFIG.TILE_SIZE;
        }
    }

    // Release ghost from house
    release() {
        this.released = true;
        this.state = 'SCATTER';
    }

    // Set ghost mode
    setMode(mode) {
        if (this.state !== 'FRIGHTENED' && this.state !== 'EATEN') {
            this.state = mode;
            this.speed = this.baseSpeed;
        }
    }

    // Set frightened mode
    setFrightened() {
        if (this.state !== 'EATEN' && this.state !== 'IN_HOUSE') {
            this.state = 'FRIGHTENED';
            this.speed = CONFIG.GHOST_FRIGHTENED_SPEED;
            this.frightenedEndTime = Date.now() + CONFIG.POWER_MODE_DURATION;

            // Reverse direction
            this.direction = this.reverseDirection(this.direction);
        }
    }

    // Reverse direction
    reverseDirection(direction) {
        switch (direction) {
            case 'UP': return 'DOWN';
            case 'DOWN': return 'UP';
            case 'LEFT': return 'RIGHT';
            case 'RIGHT': return 'LEFT';
            default: return direction;
        }
    }

    // Ghost dies (eaten by player)
    die() {
        this.state = 'EATEN';
        this.speed = CONFIG.GHOST_EATEN_SPEED;
        this.respawnTimer = setTimeout(() => this.respawn(), CONFIG.GHOST_RESPAWN_TIME);
    }

    // Respawn ghost
    respawn() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.state = 'CHASE';
        this.speed = this.baseSpeed;
        this.released = true;
    }

    // Serialize ghost state
    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            direction: this.direction,
            state: this.state
        };
    }
}

module.exports = Ghost;

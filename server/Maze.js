const CONFIG = require('./config');

// Tile types
const TILE = {
    EMPTY: 0,
    WALL: 1,
    DOT: 2,
    POWER_PELLET: 3,
    GHOST_HOUSE: 4,
    TUNNEL: 5
};

class Maze {
    constructor() {
        this.width = CONFIG.GRID_WIDTH;
        this.height = CONFIG.GRID_HEIGHT;
        this.tileSize = CONFIG.TILE_SIZE;
        this.layout = this.generateClassicMaze();
        this.dots = new Set();
        this.powerPellets = new Set();
        this.initializeCollectibles();
    }

    // Generate classic Pac-Man maze layout
    generateClassicMaze() {
        // Classic Pac-Man 28x31 maze (1 = wall, 0 = path)
        // This is a simplified representation - can be enhanced with actual maze data
        const maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
            [5,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,5],
            [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];

        return maze;
    }

    // Initialize dots and power pellets
    initializeCollectibles() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.layout[y][x];
                if (tile === TILE.DOT) {
                    this.dots.add(`${x},${y}`);
                } else if (tile === TILE.POWER_PELLET) {
                    this.powerPellets.add(`${x},${y}`);
                }
            }
        }
    }

    // Check if a tile is a wall
    isWall(x, y) {
        // Round to tile coordinates
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        // Out of bounds is a wall
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return true;
        }

        const tile = this.layout[tileY][tileX];
        // Only WALL tiles are impassable (EMPTY tiles are valid paths)
        return tile === TILE.WALL;
    }

    // Check if position is in a tunnel
    isTunnel(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileY < 0 || tileY >= this.height) return false;
        if (tileX < 0 || tileX >= this.width) return false;

        return this.layout[tileY][tileX] === TILE.TUNNEL;
    }

    // Get tunnel exit position (wrap-around)
    getTunnelExit(x, y) {
        const tileY = Math.floor(y);

        // Tunnel is on row 14
        if (tileY === 14) {
            if (x < 0) {
                return { x: this.width - 0.5, y };
            } else if (x >= this.width) {
                return { x: 0.5, y };
            }
        }

        return null;
    }

    // Get tile type at position
    getTileType(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return TILE.WALL;
        }

        return this.layout[tileY][tileX];
    }

    // Check for dot at position
    hasDot(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        return this.dots.has(`${tileX},${tileY}`);
    }

    // Remove dot at position
    collectDot(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        const key = `${tileX},${tileY}`;
        if (this.dots.has(key)) {
            this.dots.delete(key);
            return true;
        }
        return false;
    }

    // Check for power pellet at position
    hasPowerPellet(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        return this.powerPellets.has(`${tileX},${tileY}`);
    }

    // Remove power pellet at position
    collectPowerPellet(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        const key = `${tileX},${tileY}`;
        if (this.powerPellets.has(key)) {
            this.powerPellets.delete(key);
            return true;
        }
        return false;
    }

    // Get remaining collectibles count
    getRemainingCollectibles() {
        return this.dots.size + this.powerPellets.size;
    }

    // Convert tile coordinates to pixel coordinates
    tileToPixel(tileX, tileY) {
        return {
            x: tileX * this.tileSize + this.tileSize / 2,
            y: tileY * this.tileSize + this.tileSize / 2
        };
    }

    // Convert pixel coordinates to tile coordinates
    pixelToTile(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / this.tileSize),
            y: Math.floor(pixelY / this.tileSize)
        };
    }

    // Serialize maze state for clients
    serialize() {
        return {
            width: this.width,
            height: this.height,
            layout: this.layout,
            dots: Array.from(this.dots).map(key => {
                const [x, y] = key.split(',').map(Number);
                return { x, y };
            }),
            powerPellets: Array.from(this.powerPellets).map(key => {
                const [x, y] = key.split(',').map(Number);
                return { x, y };
            })
        };
    }
}

module.exports = Maze;
module.exports.TILE = TILE;

// A* Pathfinding for ghost navigation

class Pathfinding {
    constructor(maze) {
        this.maze = maze;
    }

    // Get next direction for ghost to move towards target
    getNextDirection(currentX, currentY, targetX, targetY, currentDirection) {
        const currTileX = Math.floor(currentX);
        const currTileY = Math.floor(currentY);
        const targetTileX = Math.floor(targetX);
        const targetTileY = Math.floor(targetY);

        // Get possible directions (can't reverse)
        const possibleDirections = this.getPossibleDirections(
            currTileX,
            currTileY,
            currentDirection
        );

        if (possibleDirections.length === 0) {
            return currentDirection; // Keep current direction if no options
        }

        if (possibleDirections.length === 1) {
            return possibleDirections[0]; // Only one option
        }

        // At an intersection, choose direction that minimizes distance to target
        let bestDirection = possibleDirections[0];
        let minDistance = Infinity;

        for (const direction of possibleDirections) {
            const nextTile = this.getNextTile(currTileX, currTileY, direction);
            const distance = this.getDistance(
                nextTile.x,
                nextTile.y,
                targetTileX,
                targetTileY
            );

            if (distance < minDistance) {
                minDistance = distance;
                bestDirection = direction;
            }
        }

        return bestDirection;
    }

    // Get possible directions from current tile (excluding reverse)
    getPossibleDirections(tileX, tileY, currentDirection) {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const possible = [];

        for (const direction of directions) {
            // Can't reverse direction
            if (this.isReverse(direction, currentDirection)) {
                continue;
            }

            // Check if can move in this direction
            const nextTile = this.getNextTile(tileX, tileY, direction);
            if (!this.maze.isWall(nextTile.x, nextTile.y)) {
                possible.push(direction);
            }
        }

        return possible;
    }

    // Check if direction is reverse of current
    isReverse(direction, currentDirection) {
        if (direction === 'UP' && currentDirection === 'DOWN') return true;
        if (direction === 'DOWN' && currentDirection === 'UP') return true;
        if (direction === 'LEFT' && currentDirection === 'RIGHT') return true;
        if (direction === 'RIGHT' && currentDirection === 'LEFT') return true;
        return false;
    }

    // Get next tile in a direction
    getNextTile(tileX, tileY, direction) {
        switch (direction) {
            case 'UP':
                return { x: tileX, y: tileY - 1 };
            case 'DOWN':
                return { x: tileX, y: tileY + 1 };
            case 'LEFT':
                return { x: tileX - 1, y: tileY };
            case 'RIGHT':
                return { x: tileX + 1, y: tileY };
            default:
                return { x: tileX, y: tileY };
        }
    }

    // Euclidean distance between two points
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Get random direction from possible directions
    getRandomDirection(tileX, tileY, currentDirection) {
        const possible = this.getPossibleDirections(tileX, tileY, currentDirection);

        if (possible.length === 0) {
            return currentDirection;
        }

        return possible[Math.floor(Math.random() * possible.length)];
    }
}

module.exports = Pathfinding;

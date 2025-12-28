const CONFIG = require('./config');

class CollisionManager {
    constructor(maze) {
        this.maze = maze;
    }

    // Check entity-entity collision (circle-based)
    checkEntityCollision(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = entity1.radius + entity2.radius;
        return distance < minDistance;
    }

    // Resolve player-player bounce
    resolvePlayerBounce(player1, player2) {
        const dx = player2.x - player1.x;
        const dy = player2.y - player1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // Same position, skip

        // Normalize direction
        const nx = dx / distance;
        const ny = dy / distance;

        // Calculate overlap
        const minDistance = player1.radius + player2.radius;
        const overlap = minDistance - distance;

        // Push players apart equally
        const pushDistance = overlap / 2;
        const newP1X = player1.x - nx * pushDistance;
        const newP1Y = player1.y - ny * pushDistance;
        const newP2X = player2.x + nx * pushDistance;
        const newP2Y = player2.y + ny * pushDistance;

        // Only apply push if it doesn't move players into walls
        if (!this.maze.isWall(newP1X / CONFIG.TILE_SIZE, newP1Y / CONFIG.TILE_SIZE)) {
            player1.x = newP1X;
            player1.y = newP1Y;
        }
        if (!this.maze.isWall(newP2X / CONFIG.TILE_SIZE, newP2Y / CONFIG.TILE_SIZE)) {
            player2.x = newP2X;
            player2.y = newP2Y;
        }

        // Calculate relative velocity along collision normal
        const relVelX = player1.vx - player2.vx;
        const relVelY = player1.vy - player2.vy;
        const relVelNormal = relVelX * nx + relVelY * ny;

        // Only resolve if entities are moving towards each other
        if (relVelNormal < 0) {
            return;
        }

        // Apply bounce (elastic collision with restitution)
        const restitution = 0.8; // Bounciness factor
        const impulse = relVelNormal * restitution;

        player1.vx -= impulse * nx;
        player1.vy -= impulse * ny;
        player2.vx += impulse * nx;
        player2.vy += impulse * ny;
    }

    // Check player collision with all other players
    checkPlayerCollisions(players) {
        const playerArray = Array.from(players.values());

        for (let i = 0; i < playerArray.length; i++) {
            for (let j = i + 1; j < playerArray.length; j++) {
                const p1 = playerArray[i];
                const p2 = playerArray[j];

                // Only check alive players
                if (!p1.isAlive() || !p2.isAlive()) {
                    continue;
                }

                if (this.checkEntityCollision(p1, p2)) {
                    this.resolvePlayerBounce(p1, p2);
                }
            }
        }
    }

    // Check player-ghost collisions
    checkPlayerGhostCollisions(players, ghosts) {
        const events = [];

        for (const player of players.values()) {
            if (!player.isAlive() || player.isInvulnerable()) {
                continue;
            }

            for (const ghost of ghosts) {
                if (ghost.state === 'EATEN' || ghost.state === 'IN_HOUSE') {
                    continue;
                }

                if (this.checkEntityCollision(player, ghost)) {
                    if (ghost.state === 'FRIGHTENED' && player.isPowered()) {
                        // Player eats ghost
                        const points = player.eatGhost();
                        ghost.die();
                        events.push({
                            type: 'ghost_eaten',
                            playerId: player.id,
                            ghostId: ghost.id,
                            points: points
                        });
                    } else if (ghost.state === 'CHASE' || ghost.state === 'SCATTER') {
                        // Ghost kills player
                        const hasLives = player.die();
                        events.push({
                            type: 'player_died',
                            playerId: player.id,
                            ghostId: ghost.id,
                            livesRemaining: player.lives,
                            hasLives: hasLives
                        });
                    }
                }
            }
        }

        return events;
    }

    // Check dot collection for a player
    checkDotCollection(player, maze) {
        const tileX = player.x / CONFIG.TILE_SIZE;
        const tileY = player.y / CONFIG.TILE_SIZE;

        // Check if player is close enough to center of tile
        const centerX = Math.floor(tileX) + 0.5;
        const centerY = Math.floor(tileY) + 0.5;
        const dx = tileX - centerX;
        const dy = tileY - centerY;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

        // Collect if within threshold (0.45 = ~3.6 pixels at tile size 8)
        if (distanceToCenter < 0.45) {
            if (maze.hasDot(tileX, tileY)) {
                maze.collectDot(tileX, tileY);
                player.collectDot();
                return {
                    type: 'dot',
                    x: Math.floor(tileX),
                    y: Math.floor(tileY),
                    playerId: player.id
                };
            }

            if (maze.hasPowerPellet(tileX, tileY)) {
                maze.collectPowerPellet(tileX, tileY);
                player.collectPowerPellet();
                return {
                    type: 'power_pellet',
                    x: Math.floor(tileX),
                    y: Math.floor(tileY),
                    playerId: player.id
                };
            }
        }

        return null;
    }

    // Check all dot collections
    checkAllDotCollections(players, maze) {
        const events = [];

        for (const player of players.values()) {
            if (!player.isAlive()) {
                continue;
            }

            const event = this.checkDotCollection(player, maze);
            if (event) {
                events.push(event);
            }
        }

        return events;
    }
}

module.exports = CollisionManager;

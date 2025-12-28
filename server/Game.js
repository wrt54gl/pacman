const CONFIG = require('./config');
const Maze = require('./Maze');
const Player = require('./Player');
const Ghost = require('./Ghost');
const CollisionManager = require('./CollisionManager');

class Game {
    constructor(room) {
        this.room = room;
        this.maze = new Maze();
        this.players = new Map();
        this.ghosts = [];
        this.collisionManager = new CollisionManager(this.maze);

        // Input queue
        this.inputQueue = [];

        // Timing
        this.tickRate = CONFIG.SERVER_TICK_RATE;
        this.tickInterval = CONFIG.TICK_INTERVAL;
        this.networkSendRate = CONFIG.NETWORK_SEND_RATE;
        this.networkSendInterval = Math.floor(this.tickRate / this.networkSendRate);
        this.lastTick = 0;
        this.gameTime = 0;
        this.tick = 0;

        // State
        this.running = false;
        this.gameLoop = null;

        // Ghost mode cycling
        this.modePatternIndex = 0;
        this.modeChangeTime = 0;
    }

    // Add player to game
    addPlayer(player) {
        this.players.set(player.id, player);
    }

    // Remove player from game
    removePlayer(playerId) {
        this.players.delete(playerId);
    }

    // Queue player input
    queueInput(playerId, input) {
        this.inputQueue.push({
            playerId: playerId,
            input: input
        });
    }

    // Start the game
    start() {
        console.log('Game starting with', this.players.size, 'players');

        this.spawnGhosts();
        this.lastTick = Date.now();
        this.running = true;

        // Start game loop
        this.gameLoop = setInterval(() => this.update(), this.tickInterval);
    }

    // Spawn ghosts
    spawnGhosts() {
        this.ghosts = [
            new Ghost('blinky', this.maze),
            new Ghost('pinky', this.maze),
            new Ghost('inky', this.maze),
            new Ghost('clyde', this.maze)
        ];
    }

    // Main game update loop
    update() {
        if (!this.running) return;

        const now = Date.now();
        const deltaTime = (now - this.lastTick) / 1000; // Convert to seconds
        this.lastTick = now;
        this.gameTime += deltaTime;
        this.tick++;

        // Process queued inputs
        this.processInputs();

        // Update players
        this.updatePlayers(deltaTime);

        // Update ghosts
        this.updateGhosts(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Check for player respawns
        this.checkPlayerRespawns();

        // Check win/lose conditions
        this.checkGameState();

        // Broadcast state to clients (every Nth tick)
        if (this.tick % this.networkSendInterval === 0) {
            this.broadcastState();
        }
    }

    // Process queued player inputs
    processInputs() {
        while (this.inputQueue.length > 0) {
            const { playerId, input } = this.inputQueue.shift();
            const player = this.players.get(playerId);

            if (player && player.isAlive()) {
                player.applyInput(input);
            }
        }
    }

    // Update all players
    updatePlayers(deltaTime) {
        for (const player of this.players.values()) {
            player.update(deltaTime, this.maze);
        }
    }

    // Update all ghosts
    updateGhosts(deltaTime) {
        // Check if we need to change ghost mode
        this.updateGhostMode();

        for (const ghost of this.ghosts) {
            ghost.update(deltaTime, this);
        }
    }

    // Update ghost AI mode (scatter/chase pattern)
    updateGhostMode() {
        if (this.modePatternIndex >= CONFIG.SCATTER_CHASE_PATTERN.length) {
            return; // Infinite chase mode
        }

        const pattern = CONFIG.SCATTER_CHASE_PATTERN[this.modePatternIndex];

        if (this.gameTime * 1000 >= this.modeChangeTime + pattern.duration) {
            this.modeChangeTime = this.gameTime * 1000;
            this.modePatternIndex++;

            // Set new mode for all non-frightened ghosts
            if (this.modePatternIndex < CONFIG.SCATTER_CHASE_PATTERN.length) {
                const nextPattern = CONFIG.SCATTER_CHASE_PATTERN[this.modePatternIndex];
                for (const ghost of this.ghosts) {
                    if (ghost.state !== 'FRIGHTENED' && ghost.state !== 'EATEN') {
                        ghost.setMode(nextPattern.mode);
                    }
                }
            }
        }
    }

    // Check all collisions
    checkCollisions() {
        // Player-player collisions (bounce)
        this.collisionManager.checkPlayerCollisions(this.players);

        // Player-ghost collisions
        const ghostEvents = this.collisionManager.checkPlayerGhostCollisions(
            this.players,
            this.ghosts
        );

        // Broadcast ghost collision events
        for (const event of ghostEvents) {
            this.room.broadcast(event.type, event);
        }

        // Dot collection
        const dotEvents = this.collisionManager.checkAllDotCollections(
            this.players,
            this.maze
        );

        // Handle power pellet collection
        for (const event of dotEvents) {
            if (event.type === 'power_pellet') {
                // Make all ghosts frightened
                for (const ghost of this.ghosts) {
                    if (ghost.state !== 'EATEN') {
                        ghost.setFrightened();
                    }
                }
                this.room.broadcast('power_pellet_collected', event);
            } else if (event.type === 'dot') {
                this.room.broadcast('dot_collected', event);
            }
        }
    }

    // Check for player respawns
    checkPlayerRespawns() {
        const now = Date.now();

        for (const player of this.players.values()) {
            if (player.state === 'DEAD' && player.respawnTime > 0 && now >= player.respawnTime) {
                player.respawn();
                this.room.broadcast('player_respawned', {
                    playerId: player.id,
                    x: player.x,
                    y: player.y
                });
            }
        }
    }

    // Check win/lose conditions
    checkGameState() {
        // Win: All dots and power pellets collected
        if (this.maze.getRemainingCollectibles() === 0) {
            this.endGame('WIN');
            return;
        }

        // Lose: All players out of lives
        const alivePlayers = Array.from(this.players.values()).filter(p => p.lives > 0);
        if (alivePlayers.length === 0) {
            this.endGame('LOSE');
            return;
        }
    }

    // End the game
    endGame(result) {
        console.log('Game ended:', result);
        this.running = false;

        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        // Find winner
        let winner = null;
        let maxScore = -1;
        for (const player of this.players.values()) {
            if (player.score > maxScore) {
                maxScore = player.score;
                winner = player;
            }
        }

        this.room.broadcast('game_end', {
            result: result,
            winner: winner ? winner.serialize() : null,
            scores: this.getScores(),
            finalStats: this.getFinalStats()
        });

        this.room.handleGameEnd();
    }

    // Get current scores
    getScores() {
        const scores = {};
        for (const player of this.players.values()) {
            scores[player.id] = player.score;
        }
        return scores;
    }

    // Get final stats
    getFinalStats() {
        const stats = [];
        for (const player of this.players.values()) {
            stats.push({
                id: player.id,
                name: player.name,
                score: player.score,
                dotsCollected: player.dotsCollected,
                ghostsEaten: player.ghostsEaten,
                lives: player.lives
            });
        }
        return stats.sort((a, b) => b.score - a.score);
    }

    // Broadcast game state to all clients
    broadcastState() {
        const state = {
            timestamp: Date.now(),
            tick: this.tick,
            players: Array.from(this.players.values()).map(p => p.serialize()),
            ghosts: this.ghosts.map(g => g.serialize()),
            scores: this.getScores()
        };

        this.room.broadcast('game_update', state);
    }

    // Get full game state (for newly joining players)
    getFullState() {
        return {
            timestamp: Date.now(),
            tick: this.tick,
            maze: this.maze.serialize(),
            players: Array.from(this.players.values()).map(p => p.serialize()),
            ghosts: this.ghosts.map(g => g.serialize()),
            scores: this.getScores()
        };
    }

    // Destroy the game
    destroy() {
        this.running = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
}

module.exports = Game;

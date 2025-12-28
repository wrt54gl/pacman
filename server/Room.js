const CONFIG = require('./config');
const Game = require('./Game');
const Player = require('./Player');

class Room {
    constructor(roomId, io) {
        this.id = roomId;
        this.io = io;
        this.players = new Map(); // socketId -> Player
        this.game = null;
        this.state = 'WAITING'; // WAITING, STARTING, PLAYING, ENDED
        this.maxPlayers = CONFIG.MAX_PLAYERS;
        this.minPlayersToStart = CONFIG.MIN_PLAYERS_TO_START;
        this.startCountdownTimer = null;
        this.startCountdown = CONFIG.START_COUNTDOWN;
    }

    // Add player to room
    addPlayer(socket, playerName) {
        if (this.players.size >= this.maxPlayers) {
            socket.emit('error', { message: 'Room is full' });
            return false;
        }

        if (this.state === 'PLAYING') {
            // Allow mid-game join if space available
            return this.addPlayerMidGame(socket, playerName);
        }

        const spawnIndex = this.players.size;
        const player = new Player(socket.id, playerName, spawnIndex);
        this.players.set(socket.id, player);

        console.log(`Player ${playerName} added to room ${this.id}`);

        // Send room state to new player
        socket.emit('room_joined', {
            roomId: this.id,
            playerId: socket.id,
            playerInfo: player.serialize()
        });

        // Notify others
        this.broadcastExcept(socket.id, 'player_joined', {
            player: player.serialize()
        });

        // Send current room state
        this.broadcastRoomState();

        // Manual start - no auto-start
        return true;
    }

    // Add player mid-game
    addPlayerMidGame(socket, playerName) {
        const spawnIndex = this.getAvailableSpawnIndex();
        if (spawnIndex === -1) {
            socket.emit('error', { message: 'No available spawn points' });
            return false;
        }

        const player = new Player(socket.id, playerName, spawnIndex);
        this.players.set(socket.id, player);
        this.game.addPlayer(player);

        socket.emit('game_joined', {
            roomId: this.id,
            playerId: socket.id,
            gameState: this.game.getFullState()
        });

        this.broadcastExcept(socket.id, 'player_joined_mid_game', {
            player: player.serialize()
        });

        return true;
    }

    // Remove player from room
    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (!player) return;

        console.log(`Player ${player.name} left room ${this.id}`);

        this.players.delete(socketId);

        if (this.game) {
            this.game.removePlayer(socketId);
        }

        this.broadcast('player_left', {
            playerId: socketId,
            playerName: player.name
        });

        // Cancel start countdown if not enough players
        if (this.state === 'STARTING' && !this.canStart()) {
            this.cancelStartCountdown();
        }

        this.broadcastRoomState();
    }

    // Check if game can start
    canStart() {
        return this.state === 'WAITING' &&
               this.players.size >= this.minPlayersToStart;
    }

    // Manually start game (triggered by button)
    manualStartGame() {
        if (!this.canStart()) {
            return false;
        }
        this.startGameCountdown();
        return true;
    }

    // Start game countdown
    startGameCountdown() {
        if (this.state !== 'WAITING') return;

        this.state = 'STARTING';
        let countdown = this.startCountdown;

        this.broadcast('game_starting', { countdown });

        this.startCountdownTimer = setInterval(() => {
            countdown--;

            if (countdown <= 0) {
                clearInterval(this.startCountdownTimer);
                this.startCountdownTimer = null;
                this.startGame();
            } else {
                this.broadcast('countdown_update', { countdown });
            }
        }, 1000);
    }

    // Cancel start countdown
    cancelStartCountdown() {
        if (this.startCountdownTimer) {
            clearInterval(this.startCountdownTimer);
            this.startCountdownTimer = null;
        }
        this.state = 'WAITING';
        this.broadcast('game_start_cancelled', {});
        this.broadcastRoomState();
    }

    // Start the game
    startGame() {
        console.log(`Starting game in room ${this.id}`);

        this.state = 'PLAYING';
        this.game = new Game(this);

        // Add all players to game
        for (const player of this.players.values()) {
            this.game.addPlayer(player);
        }

        // Send game start event with full state
        this.broadcast('game_started', {
            gameState: this.game.getFullState()
        });

        // Start game loop
        this.game.start();
    }

    // Handle game end
    handleGameEnd() {
        this.state = 'ENDED';

        // Reset after delay
        setTimeout(() => {
            this.reset();
        }, 5000);
    }

    // Reset room for new game
    reset() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }

        this.state = 'WAITING';

        // Reset player scores but keep them in room
        for (const player of this.players.values()) {
            player.score = 0;
            player.lives = CONFIG.STARTING_LIVES;
            player.state = 'ALIVE';
        }

        this.broadcast('room_reset', {});
        this.broadcastRoomState();

        // Auto-start if enough players
        if (this.canStart()) {
            this.startGameCountdown();
        }
    }

    // Get available spawn index
    getAvailableSpawnIndex() {
        const usedIndices = new Set();
        for (const player of this.players.values()) {
            usedIndices.add(player.spawnIndex);
        }

        for (let i = 0; i < this.maxPlayers; i++) {
            if (!usedIndices.has(i)) {
                return i;
            }
        }

        return -1;
    }

    // Broadcast to all players in room
    broadcast(event, data) {
        this.io.to(this.id).emit(event, data);
    }

    // Broadcast to all except one
    broadcastExcept(socketId, event, data) {
        for (const [playerId] of this.players) {
            if (playerId !== socketId) {
                this.io.to(playerId).emit(event, data);
            }
        }
    }

    // Broadcast current room state
    broadcastRoomState() {
        const state = {
            roomId: this.id,
            state: this.state,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                color: p.color
            }))
        };

        console.log('Broadcasting room state:', JSON.stringify(state));
        this.broadcast('room_state', state);
    }

    // Destroy room
    destroy() {
        if (this.startCountdownTimer) {
            clearInterval(this.startCountdownTimer);
        }

        if (this.game) {
            this.game.destroy();
        }

        this.players.clear();
    }
}

module.exports = Room;

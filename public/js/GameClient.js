// Game Client - main game orchestrator
class GameClient {
    constructor() {
        this.networkManager = new NetworkManager();
        this.renderer = null;
        this.inputManager = null;
        this.audioManager = new AudioManager();
        this.predictor = new Predictor();
        this.interpolator = new StateInterpolator();

        this.gameState = null;
        this.playerId = null;
        this.running = false;
        this.lastFrameTime = 0;

        // UI callbacks
        this.onRoomJoined = null;
        this.onGameStarting = null;
        this.onGameStarted = null;
        this.onGameEnd = null;
        this.onRoomState = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
    }

    // Initialize game client
    async init() {
        // Setup network event handlers
        this.setupNetworkHandlers();

        // Connect to server
        try {
            await this.networkManager.connect();
            console.log('Connected to game server');
        } catch (error) {
            console.error('Failed to connect:', error);
            throw error;
        }

        // Setup canvas renderer
        const canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(canvas);

        // Setup input manager
        this.inputManager = new InputManager(this.networkManager);
    }

    // Setup network event handlers
    setupNetworkHandlers() {
        this.networkManager.onRoomJoined = (data) => {
            console.log('Joined room:', data);
            this.playerId = data.playerId;
            if (this.onRoomJoined) this.onRoomJoined(data);
        };

        this.networkManager.onGameStarting = (data) => {
            console.log('Game starting in:', data.countdown);
            if (this.onGameStarting) this.onGameStarting(data);
        };

        this.networkManager.onCountdownUpdate = (data) => {
            if (this.onCountdownUpdate) this.onCountdownUpdate(data);
        };

        this.networkManager.onGameStarted = (data) => {
            console.log('Game started');
            console.log('Initial game state:', data.gameState);
            console.log('Players in state:', data.gameState?.players);
            this.gameState = data.gameState;
            this.interpolator.addState(data.gameState);

            // Initialize audio on first user interaction
            this.audioManager.init();
            this.audioManager.playGameStart();
            this.audioManager.startSiren();

            this.startGameLoop();
            if (this.onGameStarted) this.onGameStarted(data);
        };

        this.networkManager.onGameUpdate = (data) => {
            this.handleGameUpdate(data);
        };

        this.networkManager.onGameEnd = (data) => {
            console.log('Game ended:', data);
            this.stopGameLoop();
            this.audioManager.stopSiren();
            if (this.onGameEnd) this.onGameEnd(data);
        };

        this.networkManager.onRoomState = (data) => {
            if (this.onRoomState) this.onRoomState(data);
        };

        this.networkManager.onPlayerJoined = (data) => {
            if (this.onPlayerJoined) this.onPlayerJoined(data);
        };

        this.networkManager.onPlayerLeft = (data) => {
            if (this.onPlayerLeft) this.onPlayerLeft(data);
        };

        this.networkManager.onDotCollected = (data) => {
            this.handleDotCollected(data);
        };

        this.networkManager.onPowerPelletCollected = (data) => {
            this.handlePowerPelletCollected(data);
        };

        this.networkManager.onGhostEaten = (data) => {
            this.handleGhostEaten(data);
        };

        this.networkManager.onPlayerDied = (data) => {
            this.handlePlayerDied(data);
        };
    }

    // Handle dot collected
    handleDotCollected(data) {
        if (!this.gameState || !this.gameState.maze) return;

        // Remove dot from maze
        const dotIndex = this.gameState.maze.dots.findIndex(d => d.x === data.x && d.y === data.y);
        if (dotIndex !== -1) {
            this.gameState.maze.dots.splice(dotIndex, 1);
        }

        // Play waka sound
        this.audioManager.playWaka();
    }

    // Handle power pellet collected
    handlePowerPelletCollected(data) {
        if (!this.gameState || !this.gameState.maze) return;

        // Remove power pellet from maze
        const pelletIndex = this.gameState.maze.powerPellets.findIndex(p => p.x === data.x && p.y === data.y);
        if (pelletIndex !== -1) {
            this.gameState.maze.powerPellets.splice(pelletIndex, 1);
        }

        // Play power pellet sound
        this.audioManager.playPowerPellet();
    }

    // Handle ghost eaten
    handleGhostEaten(data) {
        // Play ghost eaten sound
        this.audioManager.playGhostEaten();
    }

    // Handle player died
    handlePlayerDied(data) {
        // Only play death sound if it's the local player
        if (data.playerId === this.playerId) {
            this.audioManager.playDeath();
        }
    }

    // Handle game update from server
    handleGameUpdate(data) {
        // Merge update with current state
        if (!this.gameState) {
            this.gameState = data;
        } else {
            // Update players and ghosts
            if (data.players) {
                this.gameState.players = data.players;
            }
            if (data.ghosts) {
                this.gameState.ghosts = data.ghosts;
            }
            if (data.scores) {
                this.gameState.scores = data.scores;
            }
        }

        // Add to interpolator
        this.interpolator.addState(this.gameState);

        // Update scoreboard
        this.updateScoreboard();
    }

    // Join room
    joinRoom(playerName) {
        this.networkManager.joinRoom(playerName);
    }

    // Start game loop
    startGameLoop() {
        this.running = true;
        this.inputManager.enable();
        this.lastFrameTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Stop game loop
    stopGameLoop() {
        this.running = false;
        this.inputManager.disable();
    }

    // Main game loop
    gameLoop(currentTime) {
        if (!this.running) return;

        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Get interpolated state
        const renderState = this.interpolator.getInterpolatedState(deltaTime * 3);

        // Render
        if (renderState) {
            this.renderer.render(renderState, deltaTime);
        }

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Update scoreboard UI
    updateScoreboard() {
        if (!this.gameState || !this.gameState.players) return;

        const scoreList = document.getElementById('score-list');
        if (!scoreList) return;

        scoreList.innerHTML = '';

        // Sort players by score
        const sortedPlayers = [...this.gameState.players].sort((a, b) => b.score - a.score);

        sortedPlayers.forEach(player => {
            const scoreItem = document.createElement('div');
            scoreItem.className = `score-item ${player.color.name}`;
            scoreItem.innerHTML = `
                <span class="name">${player.name}</span><br>
                <span class="score">Score: ${player.score}</span><br>
                <span class="lives">Lives: ${player.lives}</span>
            `;
            scoreList.appendChild(scoreItem);
        });
    }

    // Reset game client
    reset() {
        this.gameState = null;
        this.interpolator.reset();
        this.inputManager.reset();
    }
}

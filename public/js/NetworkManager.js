// Network Manager - handles Socket.io communication
class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.roomId = null;

        // Event handlers
        this.onRoomJoined = null;
        this.onGameStarting = null;
        this.onCountdownUpdate = null;
        this.onGameStarted = null;
        this.onGameUpdate = null;
        this.onGameEnd = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onRoomState = null;
        this.onError = null;
    }

    // Connect to server
    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io();

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connected = true;
                this.setupEventListeners();
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.connected = false;
            });
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        // Room events
        this.socket.on('room_joined', (data) => {
            this.playerId = data.playerId;
            this.roomId = data.roomId;
            if (this.onRoomJoined) this.onRoomJoined(data);
        });

        this.socket.on('room_state', (data) => {
            console.log('Received room_state event:', data);
            if (this.onRoomState) this.onRoomState(data);
        });

        this.socket.on('player_joined', (data) => {
            if (this.onPlayerJoined) this.onPlayerJoined(data);
        });

        this.socket.on('player_left', (data) => {
            if (this.onPlayerLeft) this.onPlayerLeft(data);
        });

        // Game start events
        this.socket.on('game_starting', (data) => {
            if (this.onGameStarting) this.onGameStarting(data);
        });

        this.socket.on('countdown_update', (data) => {
            if (this.onCountdownUpdate) this.onCountdownUpdate(data);
        });

        this.socket.on('game_start_cancelled', () => {
            if (this.onGameStartCancelled) this.onGameStartCancelled();
        });

        this.socket.on('game_started', (data) => {
            if (this.onGameStarted) this.onGameStarted(data);
        });

        // Game events
        this.socket.on('game_update', (data) => {
            if (this.onGameUpdate) this.onGameUpdate(data);
        });

        this.socket.on('game_end', (data) => {
            if (this.onGameEnd) this.onGameEnd(data);
        });

        // Dot collection events
        this.socket.on('dot_collected', (data) => {
            if (this.onDotCollected) this.onDotCollected(data);
        });

        this.socket.on('power_pellet_collected', (data) => {
            if (this.onPowerPelletCollected) this.onPowerPelletCollected(data);
        });

        // Error events
        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);
            if (this.onError) this.onError(data);
        });
    }

    // Join a room
    joinRoom(playerName) {
        this.socket.emit('room:join', { playerName });
    }

    // Start the game manually
    startGame() {
        console.log('NetworkManager.startGame() called');
        console.log('Socket:', this.socket);
        console.log('Emitting game:start event...');
        this.socket.emit('game:start');
    }

    // Send player input
    sendInput(input) {
        this.socket.emit('input', input);
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

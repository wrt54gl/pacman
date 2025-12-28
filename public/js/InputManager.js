// Input Manager - handles keyboard input
class InputManager {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.keys = {};
        this.sequenceNumber = 0;
        this.currentDirection = null;
        this.enabled = false;

        this.keyBindings = {
            'ArrowUp': 'UP',
            'KeyW': 'UP',
            'ArrowDown': 'DOWN',
            'KeyS': 'DOWN',
            'ArrowLeft': 'LEFT',
            'KeyA': 'LEFT',
            'ArrowRight': 'RIGHT',
            'KeyD': 'RIGHT'
        };

        this.setupEventListeners();
    }

    // Setup keyboard event listeners
    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    // Handle key down
    handleKeyDown(event) {
        if (!this.enabled) return;

        const direction = this.keyBindings[event.code];
        if (direction) {
            event.preventDefault();

            // Only send if direction changed
            if (this.currentDirection !== direction) {
                this.currentDirection = direction;
                const input = {
                    sequence: ++this.sequenceNumber,
                    direction: direction,
                    timestamp: Date.now()
                };

                this.networkManager.sendInput(input);
            }
        }
    }

    // Handle key up
    handleKeyUp(event) {
        const direction = this.keyBindings[event.code];
        if (direction && direction === this.currentDirection) {
            // Don't reset current direction on key up
            // This allows for smoother continuous movement
        }
    }

    // Enable input
    enable() {
        this.enabled = true;
    }

    // Disable input
    disable() {
        this.enabled = false;
        this.currentDirection = null;
    }

    // Reset
    reset() {
        this.keys = {};
        this.currentDirection = null;
        this.sequenceNumber = 0;
    }
}

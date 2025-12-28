// Shared game configuration (client-side)
const CONFIG = {
    // Grid dimensions
    TILE_SIZE: 8,
    GRID_WIDTH: 28,
    GRID_HEIGHT: 31,

    // Client rendering
    CANVAS_SCALE: 2,             // Upscale factor for modern displays
    INTERPOLATION_DELAY: 100,    // ms - Render slightly behind server time

    // Timing
    SERVER_TICK_RATE: 60,
    NETWORK_SEND_RATE: 20,

    // Game rules
    MAX_PLAYERS: 4,
    STARTING_LIVES: 3,

    // Movement speeds (pixels per second)
    PLAYER_SPEED: 80,
    GHOST_SPEED: 75,
    GHOST_TUNNEL_SPEED: 40,
    GHOST_FRIGHTENED_SPEED: 50,
    GHOST_EATEN_SPEED: 150,

    // Timings
    POWER_MODE_DURATION: 8000,   // ms
    GHOST_RESPAWN_TIME: 5000,    // ms
    PLAYER_RESPAWN_DELAY: 2000,  // ms

    // Scoring
    DOT_SCORE: 10,
    POWER_PELLET_SCORE: 50,
    GHOST_SCORES: [200, 400, 800, 1600],
    EXTRA_LIFE_SCORE: 10000,

    // Player colors
    PLAYER_COLORS: [
        { name: 'yellow', hex: '#FFFF00' },
        { name: 'red', hex: '#FF0000' },
        { name: 'cyan', hex: '#00FFFF' },
        { name: 'green', hex: '#00FF00' }
    ],

    // Power pellet positions
    POWER_PELLET_POSITIONS: [
        { x: 1, y: 3 },
        { x: 26, y: 3 },
        { x: 1, y: 23 },
        { x: 26, y: 23 }
    ],

    // Entity radii
    PLAYER_RADIUS: 6,
    GHOST_RADIUS: 6,
    DOT_RADIUS: 1,
    POWER_PELLET_RADIUS: 4,

    // Animation
    PACMAN_ANIMATION_SPEED: 0.2,  // Frame increment per render
    GHOST_ANIMATION_SPEED: 0.15,
    POWER_PELLET_BLINK_SPEED: 300 // ms per blink
};

// Shared game configuration
const CONFIG = {
    // Grid dimensions
    TILE_SIZE: 8,
    GRID_WIDTH: 28,
    GRID_HEIGHT: 31,

    // Timing
    SERVER_TICK_RATE: 60,        // Hz - Server updates per second
    NETWORK_SEND_RATE: 20,       // Hz - Network broadcasts per second
    TICK_INTERVAL: 1000 / 60,    // ms - Calculated from tick rate

    // Game rules
    MAX_PLAYERS: 4,
    STARTING_LIVES: 3,
    MIN_PLAYERS_TO_START: 1,
    START_COUNTDOWN: 3,          // seconds

    // Movement speeds (pixels per second)
    PLAYER_SPEED: 80,
    GHOST_SPEED: 75,
    GHOST_TUNNEL_SPEED: 40,
    GHOST_FRIGHTENED_SPEED: 50,
    GHOST_EATEN_SPEED: 150,      // Return to ghost house

    // Timings
    POWER_MODE_DURATION: 8000,   // ms
    GHOST_RESPAWN_TIME: 5000,    // ms
    PLAYER_RESPAWN_DELAY: 2000,  // ms
    PLAYER_SPAWN_INVULNERABILITY: 2000, // ms

    // Ghost AI mode timings (cycle pattern)
    SCATTER_CHASE_PATTERN: [
        { mode: 'SCATTER', duration: 7000 },
        { mode: 'CHASE', duration: 20000 },
        { mode: 'SCATTER', duration: 7000 },
        { mode: 'CHASE', duration: 20000 },
        { mode: 'SCATTER', duration: 5000 },
        { mode: 'CHASE', duration: 20000 },
        { mode: 'SCATTER', duration: 5000 },
        { mode: 'CHASE', duration: Infinity }
    ],

    // Scoring
    DOT_SCORE: 10,
    POWER_PELLET_SCORE: 50,
    GHOST_SCORES: [200, 400, 800, 1600], // Sequential ghost eating bonus
    EXTRA_LIFE_SCORE: 10000,

    // Player colors and spawn points
    PLAYER_COLORS: [
        { name: 'yellow', hex: '#FFFF00' },
        { name: 'red', hex: '#FF0000' },
        { name: 'cyan', hex: '#00FFFF' },
        { name: 'green', hex: '#00FF00' }
    ],

    PLAYER_SPAWN_POINTS: [
        { x: 13.5, y: 23, direction: 'LEFT' },  // Classic center-bottom
        { x: 1, y: 1, direction: 'RIGHT' },      // Top-left
        { x: 26, y: 1, direction: 'LEFT' },      // Top-right
        { x: 13.5, y: 5, direction: 'DOWN' }     // Upper-center
    ],

    // Ghost spawn positions (tile coordinates)
    GHOST_SPAWN_POSITIONS: {
        blinky: { x: 13.5, y: 11, direction: 'LEFT' },
        pinky: { x: 13.5, y: 14, direction: 'UP' },
        inky: { x: 11.5, y: 14, direction: 'UP' },
        clyde: { x: 15.5, y: 14, direction: 'UP' }
    },

    // Ghost release delays (ms)
    GHOST_RELEASE_DELAYS: {
        blinky: 0,
        pinky: 2000,
        inky: 4000,
        clyde: 6000
    },

    // Ghost scatter corners (tile coordinates)
    GHOST_SCATTER_CORNERS: {
        blinky: { x: 25, y: -2 },   // Top-right
        pinky: { x: 2, y: -2 },     // Top-left
        inky: { x: 27, y: 32 },     // Bottom-right
        clyde: { x: 0, y: 32 }      // Bottom-left
    },

    // Maze constants
    TOTAL_DOTS: 240,
    TOTAL_POWER_PELLETS: 4,

    POWER_PELLET_POSITIONS: [
        { x: 1, y: 3 },
        { x: 26, y: 3 },
        { x: 1, y: 23 },
        { x: 26, y: 23 }
    ],

    // Entity radii for collision (pixels)
    PLAYER_RADIUS: 6,
    GHOST_RADIUS: 6,
    DOT_RADIUS: 1,
    POWER_PELLET_RADIUS: 4
};

module.exports = CONFIG;

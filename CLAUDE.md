# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multiplayer Pac-Man is a real-time 4-player browser game built with Node.js, Socket.io, and HTML5 Canvas. The game uses an **authoritative server architecture** where the server maintains the single source of truth for all game state.

## Essential Commands

### Development
```bash
npm install          # Install dependencies
npm start            # Start server (port 3001 by default)
npm run dev          # Start with auto-reload (requires nodemon)
PORT=8080 npm start  # Start on custom port
```

The game runs at `http://localhost:3001` and is intended to be deployed at `pacman.toggle.ac` behind a reverse proxy.

## Architecture Overview

### Server Architecture (Authoritative)

The server runs a **60Hz game loop** that:
1. Processes queued player inputs
2. Updates player positions with collision detection
3. Updates ghost AI and positions
4. Checks all collisions (player-player, player-ghost, player-dot)
5. Broadcasts state to clients at **20Hz** (every 3rd tick)

**Key Server Components:**

- **`server/index.js`** - Express + Socket.io setup, room management
- **`server/Room.js`** - Lobby system, player join/leave, game lifecycle
- **`server/Game.js`** - Core game loop, state management, win/lose conditions
- **`server/Player.js`** - Player entity with movement, power mode, lives, scoring
- **`server/Ghost.js`** - Ghost entity with AI state machine and movement
- **`server/Maze.js`** - 28×31 tile grid, dot/pellet tracking, tunnel wrap-around
- **`server/CollisionManager.js`** - All collision detection (walls, entities, collectibles)
- **`server/ai/Pathfinding.js`** - A* pathfinding for ghost navigation at intersections

**Ghost AI States:**
- `IN_HOUSE` - Waiting to be released (timed delays: Blinky=0s, Pinky=2s, Inky=4s, Clyde=6s)
- `SCATTER` - Retreat to home corners
- `CHASE` - Target players (each ghost has unique targeting behavior)
- `FRIGHTENED` - Random movement, vulnerable (8 seconds after power pellet)
- `EATEN` - Return to spawn at high speed, then respawn after 5 seconds

**Ghost Targeting Behaviors (CHASE mode):**
- **Blinky** (red): Targets nearest player directly
- **Pinky** (pink): Targets 4 tiles ahead of highest-scoring player
- **Inky** (cyan): Targets 2 tiles ahead of most central player
- **Clyde** (orange): Chases if far (>8 tiles), scatters if close

### Client Architecture

The client uses **state interpolation** to render smooth movement between 20Hz server updates:

- **`public/js/main.js`** - Entry point, UI state management (lobby/game/game-over)
- **`public/js/GameClient.js`** - Game orchestrator, network event handling, game loop (requestAnimationFrame)
- **`public/js/NetworkManager.js`** - Socket.io wrapper, event handlers
- **`public/js/Renderer.js`** - Canvas rendering (maze, dots, players, ghosts)
- **`public/js/InputManager.js`** - Keyboard input (Arrow keys + WASD)
- **`public/js/StateInterpolator.js`** - Interpolates entity positions between server states
- **`public/js/Predictor.js`** - Placeholder for client-side prediction (currently simplified)

### Network Protocol

**Socket.io Events:**

*Client → Server:*
- `room:join` - Join game with player name
- `input` - Player direction change (sequence numbered for reconciliation)

*Server → Client:*
- `room_joined` - Confirmation with player ID and spawn info
- `room_state` - Current lobby state (players, countdown)
- `game_starting` - Countdown initiated
- `countdown_update` - Countdown tick
- `game_started` - Game begins with full state
- `game_update` - Delta state (20Hz) with players, ghosts, scores
- `game_end` - Final results with winner and stats
- `player_joined` / `player_left` - Lobby updates

### Configuration System

**Server Config (`server/config.js`):**
- `SERVER_TICK_RATE: 60` - Game loop frequency (DO NOT change without adjusting `NETWORK_SEND_RATE`)
- `NETWORK_SEND_RATE: 20` - Must be divisor of tick rate
- `MAX_PLAYERS: 4` - Up to 4 spawn points configured
- Movement speeds, ghost AI timings, scoring values
- Player spawn points (4 locations with colors: yellow, red, cyan, green)

**Client Config (`public/js/config.js`):**
- `CANVAS_SCALE: 2` - Rendering scale (increase for larger display, decrease for performance)
- `INTERPOLATION_DELAY: 100` - Client renders 100ms behind server time for smooth interpolation

Both configs must stay synchronized for tile sizes, speeds, and game constants.

### Collision System

**Player Collision (Bounce Physics):**
- Players collide using circle-based detection (`PLAYER_RADIUS: 6`)
- Elastic collision with restitution factor (0.8) creates bounce effect
- Implemented in `CollisionManager.resolvePlayerBounce()`

**Wall Collision:**
- Tile-based with 0.4 margin for forgiving turns
- Allows players to start turning slightly before tile center

**Tunnel Wrap-Around:**
- Row 14 is the tunnel (both `Maze.js` and `Ghost.js` handle this)
- Entities teleport to opposite side when crossing boundaries

### Game Loop Flow

**Server (60Hz):**
```
1. processInputs()          - Apply direction changes from input queue
2. updatePlayers()          - Move players, check wall collisions
3. updateGhosts()           - Update AI state, move ghosts
4. checkCollisions()        - Player-player, player-ghost, dot collection
5. checkPlayerRespawns()    - Handle death delays
6. checkGameState()         - Win (all dots collected) / Lose (all players dead)
7. broadcastState()         - Every 3rd tick, send state to clients
```

**Client (60fps via requestAnimationFrame):**
```
1. getInterpolatedState()   - Lerp between previous/current server states
2. renderer.render()        - Draw maze, entities to canvas
3. Continue loop
```

## Important Implementation Details

### Modifying Game Speed
If changing `SERVER_TICK_RATE`, you must:
1. Update `NETWORK_SEND_INTERVAL` calculation in `Game.js`
2. Ensure `NETWORK_SEND_RATE` is a divisor of tick rate
3. Test interpolation smoothness on client

### Adding New Ghost AI
1. Ghost behaviors are in `Ghost.getChaseTarget()` (currently all types in one file)
2. Each ghost type modifies the base target position differently
3. `Pathfinding.getNextDirection()` handles navigation at intersections
4. Ghosts must respect mode changes (scatter/chase) from `Game.updateGhostMode()`

### Maze Modifications
- `Maze.js` layout is a 2D array (28×31)
- Tile types: `EMPTY=0`, `WALL=1`, `DOT=2`, `POWER_PELLET=3`, `GHOST_HOUSE=4`, `TUNNEL=5`
- Dots and power pellets are stored as Sets (e.g., `"1,3"` for tile x=1, y=3)
- Changing maze requires updating collision logic in `CollisionManager`

### Scoring System
- Sequential ghost eating: 200 → 400 → 800 → 1600 points
- Combo resets when power mode ends
- Extra life granted at 10,000 points (only once per player)
- Score tracked per-player in `Player.score`

### Room Lifecycle
1. `WAITING` - Players can join
2. `STARTING` - 3-second countdown (cancels if player leaves)
3. `PLAYING` - Active game
4. `ENDED` - Shows results, auto-resets after 5 seconds

Mid-game joining is supported via `Room.addPlayerMidGame()`.

## Deployment Notes

**Reverse Proxy Requirements:**
- Must support WebSocket upgrades for Socket.io
- Forward both HTTP and `/socket.io/` paths
- See README.md for Nginx/Apache examples

**Environment Variables:**
- `PORT` - Server port (default: 3001)
- Intended deployment URL: `pacman.toggle.ac`

## Common Modification Patterns

### Adjusting Difficulty
Edit `server/config.js`:
- Decrease `PLAYER_SPEED` or increase `GHOST_SPEED`
- Reduce `POWER_MODE_DURATION`
- Decrease `STARTING_LIVES`

### Adding Power-Ups
1. Add tile type to `Maze.js` TILE constants
2. Place in maze layout
3. Add collection logic in `CollisionManager.checkDotCollection()`
4. Add rendering in `Renderer.js`

### Changing Player Count
1. Update `MAX_PLAYERS` in configs
2. Add spawn points to `PLAYER_SPAWN_POINTS` array
3. Add colors to `PLAYER_COLORS` array
4. Update CSS for new player colors

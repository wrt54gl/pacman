# Multiplayer Pac-Man

A real-time multiplayer Pac-Man game for web browsers, built with Node.js, Socket.io, and HTML5 Canvas.

## Features

- **4-player multiplayer** - Each player controls their own colored Pac-Man
- **Classic gameplay** - Traditional Pac-Man mechanics with dots, power pellets, and ghosts
- **Player collision** - Players can bump into each other with bounce physics
- **Individual scoring** - Compete for the highest score
- **Persistent gameplay** - Game continues as long as at least one player is alive
- **Real-time networking** - Low-latency multiplayer using WebSockets

## Requirements

- Node.js (v14 or higher)
- npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Game

### Development

```bash
npm start
```

The server will start on port 3001 by default. Access the game at:
```
http://localhost:3001
```

### Production with Custom Port

```bash
PORT=8080 npm start
```

## Configuration

### Server Configuration

Edit `server/config.js` to customize:
- Player limits and spawn points
- Movement speeds
- Ghost AI behavior
- Scoring values
- Game timing

### Client Configuration

Edit `public/js/config.js` to customize:
- Canvas rendering scale
- Animation speeds
- Visual effects

## Reverse Proxy Setup

To serve the game at `pacman.toggle.ac`, configure your reverse proxy to forward requests to the Node.js server.

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name pacman.toggle.ac;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Example Apache Configuration

```apache
<VirtualHost *:80>
    ServerName pacman.toggle.ac

    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    # WebSocket support
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/socket.io [NC]
    RewriteCond %{QUERY_STRING} transport=websocket [NC]
    RewriteRule /(.*) ws://localhost:3001/$1 [P,L]

    ProxyPass /socket.io/ http://localhost:3001/socket.io/
    ProxyPassReverse /socket.io/ http://localhost:3001/socket.io/
</VirtualHost>
```

## How to Play

### Controls

- **Arrow Keys** or **WASD** - Move your Pac-Man
- **Goal** - Collect all dots and power pellets while avoiding ghosts
- **Power Pellets** - Make ghosts vulnerable for a limited time

### Scoring

- **Dot** - 10 points
- **Power Pellet** - 50 points
- **Ghost (1st)** - 200 points
- **Ghost (2nd)** - 400 points
- **Ghost (3rd)** - 800 points
- **Ghost (4th)** - 1600 points
- **Extra Life** - Earned at 10,000 points

### Game Mechanics

1. **Join** - Enter your name and click "Join Game"
2. **Wait** - Game starts when at least 1 player joins (automatic 3-second countdown)
3. **Play** - Collect dots, eat ghosts in power mode, avoid getting caught
4. **Win** - Player with highest score wins when all dots are collected
5. **Lose** - Game ends when all players run out of lives

### Player Colors

- Player 1: Yellow
- Player 2: Red
- Player 3: Cyan
- Player 4: Green

## Architecture

### Server-Side

- **Express** - Web server
- **Socket.io** - Real-time communication
- **60Hz game loop** - Server authoritative game state
- **Ghost AI** - Four ghosts with classic Pac-Man behaviors (Blinky, Pinky, Inky, Clyde)

### Client-Side

- **HTML5 Canvas** - Game rendering
- **State interpolation** - Smooth movement between server updates
- **Input buffering** - Responsive controls

## Project Structure

```
pacman/
├── server/              # Server-side code
│   ├── index.js         # Express + Socket.io setup
│   ├── config.js        # Game configuration
│   ├── Game.js          # Game loop and state
│   ├── Room.js          # Lobby management
│   ├── Player.js        # Player entity
│   ├── Ghost.js         # Ghost entity
│   ├── Maze.js          # Maze layout
│   ├── CollisionManager.js  # Collision detection
│   └── ai/              # Ghost AI
│       ├── Pathfinding.js
│       └── ...
├── public/              # Client-side code
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── NetworkManager.js
│       ├── GameClient.js
│       ├── Renderer.js
│       ├── InputManager.js
│       └── main.js
└── package.json
```

## Development

### Running in Development Mode

For auto-restart on file changes:

```bash
npm install -g nodemon
npm run dev
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, specify a different port:
```bash
PORT=3002 npm start
```

### WebSocket Connection Issues

If using a reverse proxy, ensure WebSocket upgrades are properly configured. Check browser console for connection errors.

### Performance Issues

- Reduce `CANVAS_SCALE` in `public/js/config.js`
- Lower `SERVER_TICK_RATE` in `server/config.js` (not recommended below 30Hz)

## Future Enhancements

Potential improvements:
- Sound effects and music
- Sprite animations
- Fruit bonuses
- Multiple levels with increasing difficulty
- Persistent leaderboard
- Chat system
- Mobile touch controls
- Custom maze editor

## License

MIT

## Credits

Based on classic Pac-Man gameplay mechanics.

// Renderer - handles all canvas drawing
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE;
        this.height = CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE;
        this.scale = CONFIG.CANVAS_SCALE;

        // Animation
        this.animationTime = 0;
        this.powerPelletBlink = true;
    }

    // Clear canvas
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Render full game state
    render(gameState, deltaTime) {
        this.clear();
        this.animationTime += deltaTime;

        if (!gameState || !gameState.maze) return;

        // Draw maze
        this.renderMaze(gameState.maze);

        // Draw dots and power pellets
        this.renderDots(gameState.maze.dots);
        this.renderPowerPellets(gameState.maze.powerPellets);

        // Draw ghosts
        if (gameState.ghosts) {
            gameState.ghosts.forEach(ghost => this.renderGhost(ghost));
        }

        // Draw players
        if (gameState.players) {
            gameState.players.forEach(player => this.renderPlayer(player));
        }
    }

    // Render maze walls
    renderMaze(maze) {
        if (!maze || !maze.layout) return;

        this.ctx.strokeStyle = '#2121ff';
        this.ctx.lineWidth = 2;

        for (let y = 0; y < maze.layout.length; y++) {
            for (let x = 0; x < maze.layout[y].length; x++) {
                const tile = maze.layout[y][x];

                // Draw walls
                if (tile === 1) {
                    this.ctx.fillStyle = '#2121ff';
                    this.ctx.fillRect(
                        x * CONFIG.TILE_SIZE,
                        y * CONFIG.TILE_SIZE,
                        CONFIG.TILE_SIZE,
                        CONFIG.TILE_SIZE
                    );
                }
            }
        }
    }

    // Render dots
    renderDots(dots) {
        if (!dots) return;

        this.ctx.fillStyle = '#ffb8ae';

        dots.forEach(dot => {
            const x = dot.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const y = dot.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // Render power pellets
    renderPowerPellets(pellets) {
        if (!pellets) return;

        // Blink animation
        this.powerPelletBlink = Math.floor(this.animationTime / 300) % 2 === 0;

        if (this.powerPelletBlink) {
            this.ctx.fillStyle = '#ffb8ae';

            pellets.forEach(pellet => {
                const x = pellet.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                const y = pellet.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
    }

    // Render player
    renderPlayer(player) {
        if (!player || player.state === 'DEAD') return;

        const x = player.x;
        const y = player.y;

        // Draw Pac-Man as a circle with mouth animation
        this.ctx.fillStyle = player.color.hex;

        // Invulnerable effect
        if (player.invulnerable) {
            const alpha = Math.sin(this.animationTime * 10) * 0.5 + 0.5;
            this.ctx.globalAlpha = alpha;
        }

        // Calculate mouth angle based on direction
        let startAngle = 0;
        let endAngle = Math.PI * 2;
        const mouthSize = Math.abs(Math.sin(this.animationTime * 8)) * 0.3;

        switch (player.direction) {
            case 'RIGHT':
                startAngle = mouthSize;
                endAngle = Math.PI * 2 - mouthSize;
                break;
            case 'LEFT':
                startAngle = Math.PI + mouthSize;
                endAngle = Math.PI - mouthSize;
                break;
            case 'UP':
                startAngle = Math.PI * 1.5 + mouthSize;
                endAngle = Math.PI * 0.5 - mouthSize;
                break;
            case 'DOWN':
                startAngle = Math.PI * 0.5 + mouthSize;
                endAngle = Math.PI * 1.5 - mouthSize;
                break;
        }

        this.ctx.beginPath();
        this.ctx.arc(x, y, CONFIG.PLAYER_RADIUS, startAngle, endAngle);
        this.ctx.lineTo(x, y);
        this.ctx.fill();

        this.ctx.globalAlpha = 1;
    }

    // Render ghost
    renderGhost(ghost) {
        if (!ghost) return;

        const x = ghost.x;
        const y = ghost.y;

        // Ghost color based on state
        let color = '#fff';
        switch (ghost.type) {
            case 'blinky': color = '#ff0000'; break;
            case 'pinky': color = '#ffb8ff'; break;
            case 'inky': color = '#00ffff'; break;
            case 'clyde': color = '#ffb851'; break;
        }

        if (ghost.state === 'FRIGHTENED') {
            color = '#2121de';
        } else if (ghost.state === 'EATEN') {
            color = '#fff';
        }

        // Draw simple ghost shape
        this.ctx.fillStyle = color;

        // Body (semi-circle top + rectangle bottom)
        this.ctx.beginPath();
        this.ctx.arc(x, y - 1, CONFIG.GHOST_RADIUS - 1, Math.PI, 0);
        this.ctx.rect(
            x - CONFIG.GHOST_RADIUS + 1,
            y - 1,
            (CONFIG.GHOST_RADIUS - 1) * 2,
            CONFIG.GHOST_RADIUS
        );
        this.ctx.fill();

        // Eyes (if not eaten)
        if (ghost.state !== 'EATEN') {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(x - 3, y - 3, 2, 3);
            this.ctx.fillRect(x + 1, y - 3, 2, 3);

            if (ghost.state !== 'FRIGHTENED') {
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x - 2, y - 2, 1, 1);
                this.ctx.fillRect(x + 2, y - 2, 1, 1);
            }
        }
    }

    // Draw text centered
    drawText(text, x, y, color, size) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px 'Courier New', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    }
}

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
        this.ctx.lineWidth = 2 * this.scale;

        for (let y = 0; y < maze.layout.length; y++) {
            for (let x = 0; x < maze.layout[y].length; x++) {
                const tile = maze.layout[y][x];

                // Draw walls
                if (tile === 1) {
                    this.ctx.fillStyle = '#2121ff';
                    this.ctx.fillRect(
                        x * CONFIG.TILE_SIZE * this.scale,
                        y * CONFIG.TILE_SIZE * this.scale,
                        CONFIG.TILE_SIZE * this.scale,
                        CONFIG.TILE_SIZE * this.scale
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
            const x = (dot.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2) * this.scale;
            const y = (dot.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2) * this.scale;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 2 * this.scale, 0, Math.PI * 2);
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
                const x = (pellet.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2) * this.scale;
                const y = (pellet.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2) * this.scale;

                this.ctx.beginPath();
                this.ctx.arc(x, y, 4 * this.scale, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
    }

    // Render player
    renderPlayer(player) {
        if (!player || player.state === 'DEAD') return;

        const x = player.x * this.scale;
        const y = player.y * this.scale;

        // Draw Pac-Man as a circle with mouth animation
        this.ctx.fillStyle = player.color.hex;

        // Invulnerable effect
        if (player.invulnerable) {
            const alpha = Math.sin(this.animationTime * 10) * 0.5 + 0.5;
            this.ctx.globalAlpha = alpha;
        }

        // Calculate mouth angle based on direction
        const mouthSize = Math.abs(Math.sin(this.animationTime * 8)) * 0.25;
        let startAngle, endAngle;

        switch (player.direction) {
            case 'RIGHT':
                // Mouth facing right
                startAngle = 0.2 + mouthSize;
                endAngle = Math.PI * 2 - 0.2 - mouthSize;
                break;
            case 'LEFT':
                // Mouth facing left - draw from just below PI around to just above PI
                startAngle = Math.PI + 0.2 + mouthSize;
                endAngle = Math.PI * 3 - 0.2 - mouthSize; // PI + 2*PI - 0.2 - mouthSize
                break;
            case 'UP':
                // Mouth facing up
                startAngle = Math.PI * 1.5 + 0.2 + mouthSize;
                endAngle = Math.PI * 3.5 - 0.2 - mouthSize; // 1.5*PI + 2*PI - 0.2 - mouthSize
                break;
            case 'DOWN':
                // Mouth facing down
                startAngle = Math.PI * 0.5 + 0.2 + mouthSize;
                endAngle = Math.PI * 2.5 - 0.2 - mouthSize; // 0.5*PI + 2*PI - 0.2 - mouthSize
                break;
        }

        this.ctx.beginPath();
        this.ctx.arc(x, y, CONFIG.PLAYER_RADIUS * this.scale, startAngle, endAngle);
        this.ctx.lineTo(x, y);
        this.ctx.fill();

        this.ctx.globalAlpha = 1;
    }

    // Render ghost
    renderGhost(ghost) {
        if (!ghost) return;

        const x = ghost.x * this.scale;
        const y = ghost.y * this.scale;

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

        const s = this.scale; // shorthand

        // Body (semi-circle top + rectangle bottom)
        this.ctx.beginPath();
        this.ctx.arc(x, y - s, (CONFIG.GHOST_RADIUS - 1) * s, Math.PI, 0);
        this.ctx.rect(
            x - (CONFIG.GHOST_RADIUS - 1) * s,
            y - s,
            (CONFIG.GHOST_RADIUS - 1) * 2 * s,
            CONFIG.GHOST_RADIUS * s
        );
        this.ctx.fill();

        // Eyes (if not eaten)
        if (ghost.state !== 'EATEN') {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(x - 3 * s, y - 3 * s, 2 * s, 3 * s);
            this.ctx.fillRect(x + 1 * s, y - 3 * s, 2 * s, 3 * s);

            if (ghost.state !== 'FRIGHTENED') {
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x - 2 * s, y - 2 * s, 1 * s, 1 * s);
                this.ctx.fillRect(x + 2 * s, y - 2 * s, 1 * s, 1 * s);
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

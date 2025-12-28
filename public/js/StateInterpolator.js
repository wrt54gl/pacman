// State Interpolator - smooths movement between server updates
class StateInterpolator {
    constructor() {
        this.previousState = null;
        this.currentState = null;
        this.interpolationAlpha = 0;
    }

    // Add new server state
    addState(state) {
        this.previousState = this.currentState;
        this.currentState = state;
        this.interpolationAlpha = 0;
    }

    // Get interpolated state
    getInterpolatedState(alpha) {
        if (!this.currentState) {
            return null;
        }

        if (!this.previousState) {
            return this.currentState;
        }

        // Simple interpolation for this version
        // Could be enhanced with proper time-based interpolation
        this.interpolationAlpha = Math.min(1, this.interpolationAlpha + alpha);

        return this.interpolate(this.previousState, this.currentState, this.interpolationAlpha);
    }

    // Interpolate between two states
    interpolate(prev, curr, alpha) {
        const interpolated = {
            ...curr,
            players: curr.players.map((player, i) => {
                const prevPlayer = prev.players?.find(p => p.id === player.id);
                if (!prevPlayer) return player;

                return {
                    ...player,
                    x: this.lerp(prevPlayer.x, player.x, alpha),
                    y: this.lerp(prevPlayer.y, player.y, alpha)
                };
            }),
            ghosts: curr.ghosts?.map((ghost, i) => {
                const prevGhost = prev.ghosts?.find(g => g.id === ghost.id);
                if (!prevGhost) return ghost;

                return {
                    ...ghost,
                    x: this.lerp(prevGhost.x, ghost.x, alpha),
                    y: this.lerp(prevGhost.y, ghost.y, alpha)
                };
            })
        };

        return interpolated;
    }

    // Linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // Reset
    reset() {
        this.previousState = null;
        this.currentState = null;
        this.interpolationAlpha = 0;
    }
}

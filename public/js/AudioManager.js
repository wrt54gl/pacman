// AudioManager - handles all game sound effects
class AudioManager {
    constructor() {
        // Initialize Web Audio API
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.sounds = {};
        this.muted = false;
        this.sirenOscillator = null;
        this.wakaSoundIndex = 0;

        // Initialize audio context on user interaction
        this.initialized = false;
    }

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Audio system initialized');
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    // Play waka sound (eating dots)
    playWaka() {
        if (!this.initialized || this.muted) return;

        const freq = this.wakaSoundIndex === 0 ? 400 : 500;
        this.wakaSoundIndex = 1 - this.wakaSoundIndex;

        this.playTone(freq, 0.1, 0.05, 'square');
    }

    // Play power pellet sound
    playPowerPellet() {
        if (!this.initialized || this.muted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    // Play ghost eaten sound
    playGhostEaten() {
        if (!this.initialized || this.muted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.4);

        gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    // Play death sound
    playDeath() {
        if (!this.initialized || this.muted) return;

        this.stopSiren(); // Stop background siren

        const frequencies = [659, 622, 587, 554, 523, 494, 466, 440, 415, 392, 370, 349];
        let time = this.audioContext.currentTime;

        frequencies.forEach((freq, index) => {
            this.playTone(freq, 0.08, 0.08, 'sine', time);
            time += 0.08;
        });
    }

    // Play game start sound
    playGameStart() {
        if (!this.initialized || this.muted) return;

        const frequencies = [262, 294, 330, 349, 392, 440, 494, 523];
        let time = this.audioContext.currentTime;

        frequencies.forEach((freq, index) => {
            this.playTone(freq, 0.1, 0.1, 'square', time);
            time += 0.1;
        });
    }

    // Start background siren
    startSiren() {
        if (!this.initialized || this.muted || this.sirenOscillator) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        gainNode.gain.value = this.masterVolume * 0.15;

        // Oscillate between two frequencies
        const freq1 = 220;
        const freq2 = 247;
        const interval = 0.5;

        oscillator.frequency.setValueAtTime(freq1, this.audioContext.currentTime);

        let currentTime = this.audioContext.currentTime;
        let currentFreq = freq1;

        // Schedule frequency changes for 60 seconds
        for (let i = 0; i < 120; i++) {
            currentTime += interval;
            currentFreq = currentFreq === freq1 ? freq2 : freq1;
            oscillator.frequency.setValueAtTime(currentFreq, currentTime);
        }

        oscillator.start();
        this.sirenOscillator = oscillator;
    }

    // Stop background siren
    stopSiren() {
        if (this.sirenOscillator) {
            try {
                this.sirenOscillator.stop();
            } catch (e) {
                // Already stopped
            }
            this.sirenOscillator = null;
        }
    }

    // Play a simple tone
    playTone(frequency, duration, fadeOut, type = 'sine', startTime = null) {
        if (!this.initialized || this.muted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        const now = startTime || this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(this.masterVolume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + fadeOut);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Toggle mute
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopSiren();
        }
        return this.muted;
    }

    // Set master volume (0-1)
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

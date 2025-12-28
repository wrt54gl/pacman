// Main entry point
let gameClient = null;

// UI Elements
const lobbyScreen = document.getElementById('lobby');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over');
const nameEntry = document.getElementById('name-entry');
const roomInfo = document.getElementById('room-info');
const playerList = document.getElementById('player-list');
const countdownText = document.getElementById('countdown-text');
const playerNameInput = document.getElementById('player-name');
const joinBtn = document.getElementById('join-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const resultText = document.getElementById('result-text');
const finalScores = document.getElementById('final-scores');

// Initialize when page loads
window.addEventListener('load', async () => {
    console.log('Initializing Multiplayer Pac-Man...');

    try {
        gameClient = new GameClient();
        await gameClient.init();
        setupUI();
        console.log('Game client initialized');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('Failed to connect to game server. Please refresh the page.');
    }
});

// Setup UI event handlers
function setupUI() {
    // Join button
    joinBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            gameClient.joinRoom(playerName);
            playerNameInput.disabled = true;
            joinBtn.disabled = true;
        } else {
            alert('Please enter your name');
        }
    });

    // Enter key to join
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinBtn.click();
        }
    });

    // Play again button
    playAgainBtn.addEventListener('click', () => {
        showScreen('lobby');
        nameEntry.style.display = 'block';
        roomInfo.style.display = 'none';
        playerNameInput.value = '';
        playerNameInput.disabled = false;
        joinBtn.disabled = false;
        gameClient.reset();
    });

    // Setup game client callbacks
    gameClient.onRoomJoined = handleRoomJoined;
    gameClient.onGameStarting = handleGameStarting;
    gameClient.onCountdownUpdate = handleCountdownUpdate;
    gameClient.onGameStarted = handleGameStarted;
    gameClient.onGameEnd = handleGameEnd;
    gameClient.onRoomState = handleRoomState;
    gameClient.onPlayerJoined = handlePlayerJoined;
    gameClient.onPlayerLeft = handlePlayerLeft;
}

// Show screen
function showScreen(screenName) {
    lobbyScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');

    switch (screenName) {
        case 'lobby':
            lobbyScreen.classList.add('active');
            break;
        case 'game':
            gameScreen.classList.add('active');
            break;
        case 'game-over':
            gameOverScreen.classList.add('active');
            break;
    }
}

// Handle room joined
function handleRoomJoined(data) {
    nameEntry.style.display = 'none';
    roomInfo.style.display = 'block';
}

// Handle game starting
function handleGameStarting(data) {
    countdownText.textContent = `Game starting in ${data.countdown}...`;
}

// Handle countdown update
function handleCountdownUpdate(data) {
    countdownText.textContent = `Game starting in ${data.countdown}...`;
}

// Handle game started
function handleGameStarted(data) {
    showScreen('game');
}

// Handle game end
function handleGameEnd(data) {
    showScreen('game-over');

    // Set result text
    if (data.result === 'WIN') {
        if (data.winner && data.winner.id === gameClient.playerId) {
            resultText.textContent = 'You Won!';
        } else {
            resultText.textContent = data.winner ? `${data.winner.name} Wins!` : 'Level Complete!';
        }
    } else {
        resultText.textContent = 'Game Over';
    }

    // Display final scores
    finalScores.innerHTML = '';
    if (data.finalStats) {
        data.finalStats.forEach((player, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = `final-score-item ${player.color?.name || 'yellow'}`;
            if (index === 0) {
                scoreItem.classList.add('winner');
            }

            scoreItem.innerHTML = `
                ${index + 1}. ${player.name}<br>
                Score: ${player.score}<br>
                Dots: ${player.dotsCollected} | Ghosts: ${player.ghostsEaten}
            `;
            finalScores.appendChild(scoreItem);
        });
    }
}

// Handle room state update
function handleRoomState(data) {
    playerList.innerHTML = '';

    if (data.players) {
        data.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = `player-item ${player.color.name}`;
            playerItem.textContent = player.name;
            playerList.appendChild(playerItem);
        });
    }
}

// Handle player joined
function handlePlayerJoined(data) {
    console.log('Player joined:', data);
}

// Handle player left
function handlePlayerLeft(data) {
    console.log('Player left:', data);
}

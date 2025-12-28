// Main entry point
let gameClient = null;
window.gameClient = null; // Expose on window for onclick handler

// UI Elements - will be initialized after DOM loads
let lobbyScreen, gameScreen, gameOverScreen, nameEntry, roomInfo;
let playerList, countdownText, playerNameInput, joinBtn, startGameBtn;
let playAgainBtn, resultText, finalScores;

// Global handler for start button (called from HTML onclick)
window.handleStartButtonClick = function() {
    console.log('handleStartButtonClick called from HTML onclick!');

    if (!gameClient) {
        console.error('gameClient not initialized');
        alert('Game not ready yet!');
        return;
    }

    if (!gameClient.networkManager) {
        console.error('networkManager not initialized');
        alert('Network not ready yet!');
        return;
    }

    console.log('Sending game start request to server...');
    gameClient.networkManager.startGame();

    // Disable button
    const btn = document.getElementById('start-game-btn');
    if (btn) btn.disabled = true;
};

// Initialize when page loads
window.addEventListener('load', async () => {
    // Get UI elements after DOM is ready
    lobbyScreen = document.getElementById('lobby');
    gameScreen = document.getElementById('game-screen');
    gameOverScreen = document.getElementById('game-over');
    nameEntry = document.getElementById('name-entry');
    roomInfo = document.getElementById('room-info');
    playerList = document.getElementById('player-list');
    countdownText = document.getElementById('countdown-text');
    playerNameInput = document.getElementById('player-name');
    joinBtn = document.getElementById('join-btn');
    startGameBtn = document.getElementById('start-game-btn');
    playAgainBtn = document.getElementById('play-again-btn');
    resultText = document.getElementById('result-text');
    finalScores = document.getElementById('final-scores');

    console.log('Initializing Multiplayer Pac-Man...');

    try {
        gameClient = new GameClient();
        window.gameClient = gameClient; // Expose on window for onclick handler
        await gameClient.init();
        console.log('About to call setupUI()');
        setupUI();
        console.log('Game client initialized');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        console.error('Error stack:', error.stack);
        alert('Failed to connect to game server. Please refresh the page.');
    }
});

// Setup UI event handlers
function setupUI() {
    try {
        console.log('setupUI called');
        console.log('joinBtn:', joinBtn);
        console.log('startGameBtn:', startGameBtn);
        console.log('playAgainBtn:', playAgainBtn);

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

    // Start game button
    if (startGameBtn) {
        console.log('Start game button found and event listener attached');
        startGameBtn.addEventListener('click', (e) => {
            console.log('Start game button clicked!');
            console.log('Event:', e);
            console.log('gameClient:', gameClient);
            console.log('networkManager:', gameClient?.networkManager);

            if (gameClient && gameClient.networkManager) {
                console.log('Calling startGame()...');
                gameClient.networkManager.startGame();
                startGameBtn.disabled = true;
            } else {
                console.error('Game client or network manager not initialized');
                alert('Game client not ready!');
            }
        });
    } else {
        console.error('Start game button not found in DOM');
    }

    // Play again button
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            showScreen('lobby');
            nameEntry.style.display = 'block';
            roomInfo.style.display = 'none';
            playerNameInput.value = '';
            playerNameInput.disabled = false;
            joinBtn.disabled = false;
            startGameBtn.disabled = false;
            gameClient.reset();
        });
    } else {
        console.error('Play again button not found in DOM');
    }

    // Setup game client callbacks
    gameClient.onRoomJoined = handleRoomJoined;
    gameClient.onGameStarting = handleGameStarting;
    gameClient.onCountdownUpdate = handleCountdownUpdate;
    gameClient.onGameStarted = handleGameStarted;
    gameClient.onGameEnd = handleGameEnd;
    gameClient.onRoomState = handleRoomState;
    gameClient.onPlayerJoined = handlePlayerJoined;
    gameClient.onPlayerLeft = handlePlayerLeft;

    } catch (error) {
        console.error('Error in setupUI:', error);
        console.error('Error stack:', error.stack);
    }
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
    console.log('handleRoomState called with:', data);
    playerList.innerHTML = '';

    if (data.players) {
        console.log('Rendering', data.players.length, 'players');
        data.players.forEach(player => {
            console.log('Adding player:', player.name, 'color:', player.color.name);
            const playerItem = document.createElement('div');
            playerItem.className = `player-item ${player.color.name}`;
            playerItem.textContent = player.name;
            playerList.appendChild(playerItem);
        });
    } else {
        console.log('No players in data');
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

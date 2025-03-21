let gameRunning = false;
let lastTime;

// Game state
let gameState = {
    players: [
        { name: "Player 1", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 },
        { name: "Player 2", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 }
    ],
    currentPlayerIndex: 0,
    diceValues: [],
    selectedDice: [],
    rollCount: 0,
    maxRolls: 3,
    numDice: 8
};

function init() {
    lastTime = performance.now();
    gameRunning = true;
    updateUI();
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!gameRunning) return;

    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    update(deltaTime);
    
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // For animation effects if needed
}

function getCurrentPlayer() {
    return gameState.players[gameState.currentPlayerIndex];
}

function rollDice() {
    if (!gameRunning) return;
    
    // First roll or rolling selected dice
    if (gameState.rollCount === 0) {
        // First roll - roll all dice
        gameState.diceValues = [];
        for (let i = 0; i < gameState.numDice; i++) {
            gameState.diceValues.push(getRandomInt(1, 6));
        }
        gameState.rollCount = 1;
    } else if (gameState.rollCount < gameState.maxRolls) {
        // Re-roll selected dice
        gameState.selectedDice.forEach(index => {
            gameState.diceValues[index] = getRandomInt(1, 6);
        });
        gameState.rollCount++;
        gameState.selectedDice = [];
    }

    // Count sixes for current player
    getCurrentPlayer().sixes = gameState.diceValues.filter(value => value === 6).length;
    
    updateUI();
    
    // Enable end turn button after first roll
    document.getElementById('end-turn-btn').disabled = false;
    
    // Disable roll button if max rolls reached
    if (gameState.rollCount >= gameState.maxRolls) {
        document.getElementById('roll-btn').disabled = true;
    }
}

function toggleDiceSelection(index) {
    if (gameState.rollCount === 0 || gameState.rollCount >= gameState.maxRolls) return;
    
    const selectedIndex = gameState.selectedDice.indexOf(index);
    if (selectedIndex === -1) {
        gameState.selectedDice.push(index);
    } else {
        gameState.selectedDice.splice(selectedIndex, 1);
    }
    
    updateUI();
}

function calculateScore() {
    const currentPlayer = getCurrentPlayer();
    
    // Count occurrences of each dice value
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Index 0 is unused
    gameState.diceValues.forEach(value => counts[value]++);
    
    // 1s: Each 1 rewards player with 1 red gem
    currentPlayer.gems.red += counts[1];
    
    // 2s: Each pair of 2s rewards player with 1 blue gem
    currentPlayer.gems.blue += Math.floor(counts[2] / 2);
    
    // 3s: Each triplet of 3s rewards player with 1 green gem
    currentPlayer.gems.green += Math.floor(counts[3] / 3);
    
    // 4s: If there's only one 4, player gets 1 purple dice
    if (counts[4] === 1) {
        currentPlayer.gems.purple += 1;
    }
    
    // 5s: Various combinations for different gems
    if (counts[5] >= 1 && counts[5] <= 2) {
        currentPlayer.gems.red += 1;
    } else if (counts[5] === 3) {
        currentPlayer.gems.blue += 1;
    } else if (counts[5] === 4) {
        currentPlayer.gems.green += 1;
    } else if (counts[5] === 5) {
        currentPlayer.gems.purple += 1;
    }
}

function endTurn() {
    if (!gameRunning) return;
    
    calculateScore();
    switchPlayer();
    resetTurn();
    updateUI();
}

function endRound() {
    const players = gameState.players;
    
    // Compare sixes and award gems to the winner
    if (players[0].sixes > players[1].sixes) {
        players[0].gems.red += 1;
        players[0].gems.blue += 1;
    } else if (players[1].sixes > players[0].sixes) {
        players[1].gems.red += 1;
        players[1].gems.blue += 1;
    }
    
    // Reset sixes counts
    players[0].sixes = 0;
    players[1].sixes = 0;
}

function switchPlayer() {
    // If both players have played, end the round
    if (gameState.currentPlayerIndex === 1) {
        endRound();
    }
    
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
}

function resetTurn() {
    gameState.diceValues = [];
    gameState.selectedDice = [];
    gameState.rollCount = 0;
    document.getElementById('roll-btn').disabled = false;
    document.getElementById('end-turn-btn').disabled = true;
}

function updateUI() {
    // Update player cards
    document.querySelectorAll('.player-card').forEach((card, index) => {
        card.classList.toggle('active', index === gameState.currentPlayerIndex);
    });
    
    // Update gem counts
    for (let i = 0; i < gameState.players.length; i++) {
        document.getElementById(`player${i+1}-red-gems`).textContent = gameState.players[i].gems.red;
        document.getElementById(`player${i+1}-blue-gems`).textContent = gameState.players[i].gems.blue;
        document.getElementById(`player${i+1}-green-gems`).textContent = gameState.players[i].gems.green;
        document.getElementById(`player${i+1}-purple-gems`).textContent = gameState.players[i].gems.purple;
        document.getElementById(`player${i+1}-sixes`).textContent = gameState.players[i].gems.sixes;
    }
    
    // Update current player and roll count
    document.getElementById('current-player').textContent = `${getCurrentPlayer().name}'s Turn`;
    document.getElementById('roll-count').textContent = gameState.rollCount === 0 
        ? "Roll to start your turn" 
        : `Roll ${gameState.rollCount} of ${gameState.maxRolls}`;
    
   // Update dice display
   const diceContainer = document.querySelector('.dice-container');
   diceContainer.innerHTML = '';
   
   gameState.diceValues.forEach((value, index) => {
       const diceEl = document.createElement('div');
       diceEl.classList.add('dice');
       if (gameState.selectedDice.includes(index)) {
           diceEl.classList.add('selected');
       }
       diceEl.textContent = value;
       diceEl.dataset.index = index;
       diceEl.dataset.value = value; // Add this line for gradient colors
       diceEl.addEventListener('click', () => {
           toggleDiceSelection(index);
       });
       diceContainer.appendChild(diceEl);
   });
}

function startGame() {
    // Reset game state
    gameState = {
        players: [
            { name: "Player 1", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 },
            { name: "Player 2", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 }
        ],
        currentPlayerIndex: 0,
        diceValues: [],
        selectedDice: [],
        rollCount: 0,
        maxRolls: 3,
        numDice: 8
    };
    
    // Initialize game
    init();
}

function stopGame() {
    gameRunning = false;
}

// Expose functions to the global scope
window.startGame = startGame;
window.stopGame = stopGame;
window.rollDice = rollDice;
window.endTurn = endTurn;
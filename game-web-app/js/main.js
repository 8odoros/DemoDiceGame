// Combined game logic from main.js and game.js

// Game state
let gameState = {
    players: [
        { name: "Alice", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 },
        { name: "Bob", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 }
    ],
    currentPlayerIndex: 0,
    diceValues: [],
    selectedDice: [],
    rollCount: 0,
    maxRolls: 4, // FIXED: Now consistent with main.js
    numDice: 8,
    roundCount: 1 // Start from round 1
};

let gameRunning = false;
let lastTime;

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI state - everything hidden initially
    document.getElementById('roll-btn').style.display = 'none';
    document.getElementById('end-turn-btn').disabled = true;
    document.getElementById('end-turn-btn').style.display = 'none'; // Use display:none instead of class
    document.getElementById('current-player').textContent = 'Welcome to Dice Gem Game';
    
    // Don't create dice yet
    setupEventListeners();
});
// Fix setupEventListeners function
function setupEventListeners() {
    // Start/Restart game button
    document.getElementById('start-game-btn').addEventListener('click', () => {
        startGame();
        console.log("Game started!");
    });

    // Roll dice button
    document.getElementById('roll-btn').addEventListener('click', () => {
        if (!document.getElementById('roll-btn').disabled) {
            rollDice();
        }
    });

    // Fix end turn button handler
    document.getElementById('end-turn-btn').addEventListener('click', function() {
        console.log("End turn clicked"); // Debug logging
        endTurn(); // Call the endTurn function when clicked
    });

    // Player name customization
    document.querySelectorAll('.player-name').forEach((nameElement, index) => {
        nameElement.addEventListener('click', () => {
            if (!gameRunning) return;
            
            const newName = prompt(`Enter name for Player ${index + 1}:`, 
                gameState?.players?.[index]?.name || `Player ${index + 1}`);
                
            if (newName && newName.trim() !== '') {
                nameElement.textContent = newName.trim();
                if (gameState?.players?.[index]) {
                    gameState.players[index].name = newName.trim();
                    updateUI();
                }
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Spacebar to roll dice
        if (event.code === 'Space' &&
            document.getElementById('roll-btn').style.display !== 'none' &&
            !document.getElementById('roll-btn').disabled) {
            event.preventDefault();
            rollDice();
        }

        // Enter to end turn
        if (event.code === 'Enter' && !document.getElementById('end-turn-btn').disabled) {
            event.preventDefault();
            console.log("Enter key pressed - ending turn");
            endTurn();
        }
    });
}

function init() {
    lastTime = performance.now();
    gameRunning = true;
    updateUI();
    requestAnimationFrame(gameLoop);
    
    // Log game start
    logGameEvent('system', 'Game started!');
    
    // REMOVED: Auto-roll for first player
    // Now player must click the roll button explicitly
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


// the rollDice function 
function rollDice() {
    if (!gameRunning) return;
    
    // Prevent rolling if max rolls reached
    if (gameState.rollCount >= gameState.maxRolls) {
        showMaxRollsMessage();
        return;
    }
    
    const diceContainer = document.querySelector('.dice-container');
    
    // First roll - create dice if they don't exist yet
    if (gameState.rollCount === 0) {
        // Set the dice alignment based on current player
        if (gameState.currentPlayerIndex === 0) {
            // Alice's turn - align dice to the left
            diceContainer.classList.remove('align-right');
            diceContainer.classList.add('align-left');
        } else {
            // Bob's turn - align dice to the right
            diceContainer.classList.remove('align-left');
            diceContainer.classList.add('align-right');
        }
        
        document.getElementById('end-turn-btn').disabled = false;
        
        // Create dice on first roll
        diceContainer.innerHTML = ''; // Clear any existing dice
        
        
        // Create the dice - FIX THE SYNTAX ERROR HERE
        for (let i = 0; i < gameState.numDice; i++) {
            const dice = document.createElement('div');
            dice.classList.add('dice');
            dice.dataset.index = i;
            
            // Generate random dice value
            const value = Math.floor(Math.random() * 6) + 1;
            dice.dataset.value = value;
            dice.textContent = value;
            
            // Add proper click event handler
            dice.addEventListener('click', () => {
                if (gameState.rollCount > 0 && gameState.rollCount < gameState.maxRolls) {
                    const index = parseInt(dice.dataset.index);
                    toggleDiceSelection(index);
                }
            });
            
            diceContainer.appendChild(dice);
        }
        
        // Store dice values in state
        gameState.diceValues = Array.from(diceContainer.querySelectorAll('.dice'))
            .map(dice => parseInt(dice.dataset.value));
        
        // Sort dice in ascending order
        sortDice();
        
        // Log the first roll
        logGameEvent('player', `${getCurrentPlayer().name} rolled dice: ${gameState.diceValues.join(', ')}.`);
    } else {
        // For subsequent rolls, get existing dice
        const diceElements = diceContainer.querySelectorAll('.dice');
        
        // Roll only selected dice
        const selectedDiceElements = Array.from(diceElements).filter(dice => dice.classList.contains('selected'));
        selectedDiceElements.forEach(dice => {
            const newValue = Math.floor(Math.random() * 6) + 1;
            dice.dataset.value = newValue;
            dice.textContent = newValue;
            dice.classList.remove('selected'); // Deselect after rolling
        });
        
        // Update dice values in state
        gameState.diceValues = Array.from(diceElements).map(dice => parseInt(dice.dataset.value));
        
        // Clear selectedDice array to match visual state
        gameState.selectedDice = [];
        
        // Sort dice in ascending order after re-rolling
        sortDice();
        
        // Log the re-roll
        if (selectedDiceElements.length > 0) {
            logGameEvent('player', `${getCurrentPlayer().name} re-rolled ${selectedDiceElements.length} dice.`);
        }
    }

    // Count sixes for current player
    getCurrentPlayer().sixes = gameState.diceValues.filter(value => value === 6).length;
    
    // Increment roll count
    gameState.rollCount++;
    
    updateUI();
    updateRollButtonText(); // Update button text after roll
    
    // Enable end turn button after first roll
    document.getElementById('end-turn-btn').disabled = false;
    document.getElementById('end-turn-btn').style.display = 'inline-block';
    
    // Check if max rolls reached
    if (gameState.rollCount >= gameState.maxRolls) {
        // Disable roll button
        document.getElementById('roll-btn').disabled = true;
        document.getElementById('roll-btn').classList.add('disabled');
        
        // Log and show max rolls message
        logGameEvent('system', `${getCurrentPlayer().name} has used all rolls.`);
        showMaxRollsMessage();
    }

    // Update roll button visibility
    updateRollButtonVisibility();
}

// Add this function to show a message when max rolls are reached
function showMaxRollsMessage() {
    // Get the roll count element
    const rollCountEl = document.getElementById('roll-count');
    
    // Add a class to highlight the message
    rollCountEl.classList.add('max-rolls-reached');
    
    // Display the message
    rollCountEl.textContent = `Maximum ${gameState.maxRolls} rolls used! Please end your turn.`;
    
    // Optional: Show a toast notification
    showNotification(`${getCurrentPlayer().name} has used all ${gameState.maxRolls} rolls. End your turn to continue.`);
}

// Simple toast notification function
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('game-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'game-notification';
        document.querySelector('.game-container').appendChild(notification);
    }
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function toggleDiceSelection(index) {
    if (gameState.rollCount === 0 || gameState.rollCount >= gameState.maxRolls) {
        return;
    }
    
    const selectedIndex = gameState.selectedDice.indexOf(index);
    if (selectedIndex === -1) {
        gameState.selectedDice.push(index);
    } else {
        gameState.selectedDice.splice(selectedIndex, 1);
    }
    
    // Update UI to reflect selection state
    updateDiceSelection();
    
    // Show/enable roll button when dice are selected
    if (gameState.selectedDice.length > 0) {
        document.getElementById('roll-btn').disabled = false;
        document.getElementById('roll-btn').style.display = 'inline-block';
    } else {
        // If no dice selected, still show but indicate no action
        document.getElementById('roll-btn').disabled = true;
    }
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
    
    // 3s and 4s: Calculate green gems
    // (Implementation depends on your game rules)
    
    // Log the score
    logGameEvent('player', `${currentPlayer.name} earned ${counts[1]} red gems and ${Math.floor(counts[2] / 2)} blue gems.`);
}

function endTurn() {
    calculateScore();
    
    // Log the end of turn
    logGameEvent('player', `${getCurrentPlayer().name} ended their turn with ${getCurrentPlayer().sixes} sixes.`);
    
    // Reset roll count and selected dice
    gameState.rollCount = 0;
    gameState.selectedDice = [];
    
    // Update UI elements - enable roll button for next player
    document.getElementById('roll-btn').disabled = false;
    document.getElementById('roll-btn').style.display = 'inline-block';
    updateRollButtonText(); // Reset button text for next player
    
    // Disable end turn button until next roll
    document.getElementById('end-turn-btn').disabled = true;
    
    // Clear max-rolls-reached class if it exists
    document.getElementById('roll-count').classList.remove('max-rolls-reached');
    
    // Switch to next player
    switchPlayer();
    updateUI();
}

function endRound() {
    const players = gameState.players;
    
    // Compare number of sixes between players
    if (players[0].sixes > players[1].sixes) {
        players[0].gems.purple += 1;
        logGameEvent('system', `${players[0].name} wins the round with ${players[0].sixes} sixes and earns a purple gem!`);
    } else if (players[1].sixes > players[0].sixes) {
        players[1].gems.purple += 1;
        logGameEvent('system', `${players[1].name} wins the round with ${players[1].sixes} sixes and earns a purple gem!`);
    } else {
        logGameEvent('system', `Round ends in a tie! No purple gems awarded.`);
    }
    
    // Reset sixes counts
    players[0].sixes = 0;
    players[1].sixes = 0;

    // Increment round count after both players have played
    gameState.roundCount++;
    logGameEvent('system', `Round ${gameState.roundCount} begins.`);
    updateUI();
}

function updateUI() {
    // Update round counter
    document.getElementById('round-counter').textContent = gameState.roundCount;
    
    // Update roll counter
    if (gameState.rollCount > 0) {
        document.getElementById('roll-count').textContent = `Roll ${gameState.rollCount} of ${gameState.maxRolls}`;
    } else {
        document.getElementById('roll-count').textContent = '';
    }
    
    // Update player gems display
    updatePlayerGems();
    
    // Update current player indicator
    updateActivePlayer();
    
    // Update sixes counter for current player
    document.getElementById('sixes-count').textContent = `Sixes: ${getCurrentPlayer().sixes}`;

    // Update dice selection visualization
    updateDiceSelection();
    
    // Ensure roll button visibility
    updateRollButtonVisibility();
    updateRollButtonText();
}

function updatePlayerGems() {
    // Update gem displays for both players
    gameState.players.forEach((player, index) => {
        const playerId = `player${index + 1}`;
        
        // Update gem counts for each gem type
        for (const gemType in player.gems) {
            const gemElement = document.querySelector(`#${playerId} .${gemType}-gem span`);
            if (gemElement) {
                gemElement.textContent = player.gems[gemType];
            }
        }
    });
}

// 1. First, remove the alignment code from updateActivePlayer function
function updateActivePlayer() {
    // Update active player highlighting
    const player1Card = document.getElementById('player1');
    const player2Card = document.getElementById('player2');
    
    if (gameState.currentPlayerIndex === 0) {
        // Alice is playing
        player1Card.classList.add('active');
        player2Card.classList.remove('active');
        document.getElementById('current-player').textContent = `${gameState.players[0].name}'s Turn`;
        
        // REMOVED: Dice alignment code - will be handled in rollDice function
    } else {
        // Bob is playing
        player1Card.classList.remove('active');
        player2Card.classList.add('active');
        document.getElementById('current-player').textContent = `${gameState.players[1].name}'s Turn`;
        
        // REMOVED: Dice alignment code - will be handled in rollDice function
    }
}

function switchPlayer() {
    // If Bob (index 1) just finished, end the round
    if (gameState.currentPlayerIndex === 1) {
        endRound();
        
        // Log that we're returning to Alice for a new round
        logGameEvent('system', `Starting round ${gameState.roundCount} with ${gameState.players[0].name}'s turn.`);
    } else {
        // Just switching from Alice to Bob within the same round
        logGameEvent('system', `${gameState.players[1].name}'s turn.`);
    }
    
    // Switch to next player
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Make sure roll button text is updated
    updateRollButtonText();
}

function resetTurn() {
    gameState.rollCount = 0;
    gameState.selectedDice = [];
    document.getElementById('roll-btn').disabled = false;
    document.getElementById('end-turn-btn').disabled = true;
    updateUI();
}

function startGame() {
    // Reset game state
    gameState = {
        players: [
            { name: "Alice", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 },
            { name: "Bob", gems: { red: 0, blue: 0, green: 0, purple: 0 }, sixes: 0 }
        ],
        currentPlayerIndex: 0,
        diceValues: [],
        selectedDice: [],
        rollCount: 0,
        maxRolls: 4,
        numDice: 8,
        roundCount: 1
    };
    
    // Set game as running
    gameRunning = true;
    
    // Clear history
    const historyEl = document.getElementById('game-history');
    historyEl.innerHTML = '';
    
    // Show UI elements
    document.querySelector('.dice-container').classList.remove('hidden');
    document.querySelector('.dice-container').innerHTML = ''; // Ensure dice container is empty
    document.getElementById('roll-count').classList.remove('hidden');
    
    // Update UI first to ensure all elements are visible
    document.getElementById('roll-btn').style.display = 'inline-block';
    document.getElementById('roll-btn').disabled = false;
    document.getElementById('roll-btn').classList.add('active-btn');
    document.getElementById('start-game-btn').textContent = 'Restart Game';
    updateRollButtonText(); // Set initial button text
    
    // End turn button should be visible but disabled until first roll
    document.getElementById('end-turn-btn').style.display = 'inline-block';
    document.getElementById('end-turn-btn').disabled = true;
    
    // Initialize game
    init();
}

function createDice() {
    const diceContainer = document.querySelector('.dice-container');
    diceContainer.innerHTML = ''; // Clear existing dice

    for (let i = 0; i < gameState.numDice; i++) {
        const dice = document.createElement('div');
        dice.classList.add('dice');
        dice.dataset.index = i; // Add index to dataset
        const value = Math.floor(Math.random() * 6) + 1;
        dice.dataset.value = value;
        dice.textContent = value;
        
        // Simplified click handler - just update game state
        dice.addEventListener('click', () => {
            if (gameState.rollCount > 0 && gameState.rollCount < gameState.maxRolls) {
                const index = parseInt(dice.dataset.index);
                toggleDiceSelection(index);
                // UI will be updated by toggleDiceSelection
            }
        });
        
        diceContainer.appendChild(dice);
    }

    // Store initial dice values
    gameState.diceValues = Array.from(diceContainer.querySelectorAll('.dice'))
        .map(dice => parseInt(dice.dataset.value));
    
    // Sort dice in ascending order
    sortDice();
}

function sortDice() {
    const diceContainer = document.querySelector('.dice-container');
    const diceElements = Array.from(diceContainer.children);

    diceElements.sort((a, b) => parseInt(a.dataset.value) - parseInt(b.dataset.value));

    // Reappend in sorted order
    diceElements.forEach(dice => diceContainer.appendChild(dice));
}

function stopGame() {
    gameRunning = false;
    document.getElementById('roll-btn').style.display = 'none';
    document.getElementById('end-turn-btn').disabled = true;
}

// Log game events to the history panel
function logGameEvent(source, message) {
    const historyContainer = document.getElementById('game-history');
    const entryElement = document.createElement('div');
    entryElement.classList.add('history-entry');
    
    // Add specific class based on source
    if (source === 'player') {
        entryElement.classList.add(`history-player${gameState.currentPlayerIndex + 1}`);
    } else if (source === 'system') {
        entryElement.classList.add('history-system');
    }
    
    entryElement.textContent = message;
    
    // Add animation class for new entries
    entryElement.classList.add('history-new');
    
    // Add entry at the top
    historyContainer.prepend(entryElement);
    
    // Remove animation class after animation completes
    setTimeout(() => {
        entryElement.classList.remove('history-new');
    }, 1000);
}

// Add this function to ensure roll button visibility
function updateRollButtonVisibility() {
    const rollBtn = document.getElementById('roll-btn');
    
    if (gameRunning) {
        // Always show roll button when game is running, unless max rolls reached
        if (gameState.rollCount >= gameState.maxRolls) {
            rollBtn.disabled = true;
            rollBtn.style.display = 'inline-block';
        } else {
            rollBtn.disabled = false;
            rollBtn.style.display = 'inline-block';
        }
    } else {
        // Hide roll button when game is not running
        rollBtn.style.display = 'none';
    }
}

// Add this function to sync the UI with game state
function updateDiceSelection() {
    const diceElements = document.querySelectorAll('.dice');
    
    // First, remove all selected classes
    diceElements.forEach(dice => dice.classList.remove('selected'));
    
    // Then, add selected class only to those in the gameState.selectedDice array
    gameState.selectedDice.forEach(index => {
        const diceElement = document.querySelector(`.dice[data-index="${index}"]`);
        if (diceElement) {
            diceElement.classList.add('selected');
        }
    });
}

// Add this function to update the roll button text based on game state
function updateRollButtonText() {
    const rollBtn = document.getElementById('roll-btn');
    
    if (gameState.rollCount === 0) {
        rollBtn.textContent = "Roll All Dice";
    } else {
        rollBtn.textContent = "Roll Selected Dice";
    }
}

// Expose functions to the global scope for HTML interaction
window.startGame = startGame;
window.stopGame = stopGame;
window.rollDice = rollDice;
window.endTurn = endTurn;
window.toggleDiceSelection = toggleDiceSelection;
window.logGameEvent = logGameEvent;
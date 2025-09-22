//To run the server:
//npm install -g http-server
//http-server -p 8008
//http://localhost:8008/Documents/GitHub/DemoDiceGame/game-web-app/index.html

// Card definitions
const cardDeck = [
    { id: 1, name: "Gem Collector", cost: { red: 2, blue: 1, green: 0, purple: 0, wild: 0 }, points: 3 },
    { id: 2, name: "Lucky Charm", cost: { red: 1, blue: 1, green: 1, purple: 0, wild: 1 }, points: 4 },
    { id: 3, name: "Ruby Master", cost: { red: 3, blue: 0, green: 0, purple: 1, wild: 0 }, points: 5 },
    { id: 4, name: "Sapphire Ring", cost: { red: 0, blue: 3, green: 1, purple: 0, wild: 0 }, points: 4 },
    { id: 5, name: "Emerald Crown", cost: { red: 1, blue: 0, green: 3, purple: 0, wild: 0 }, points: 4 },
    { id: 6, name: "Mystic Orb", cost: { red: 0, blue: 0, green: 0, purple: 2, wild: 2 }, points: 6 },
    { id: 7, name: "Ancient Relic", cost: { red: 2, blue: 2, green: 0, purple: 0, wild: 0 }, points: 4 },
    { id: 8, name: "Crystal Ball", cost: { red: 1, blue: 1, green: 1, purple: 1, wild: 0 }, points: 5 },
    { id: 9, name: "Golden Chalice", cost: { red: 2, blue: 0, green: 2, purple: 0, wild: 0 }, points: 4 },
    { id: 10, name: "Silver Amulet", cost: { red: 0, blue: 2, green: 0, purple: 1, wild: 1 }, points: 4 },
    { id: 11, name: "Diamond Necklace", cost: { red: 1, blue: 0, green: 0, purple: 0, wild: 3 }, points: 5 },
    { id: 12, name: "Magical Pendant", cost: { red: 0, blue: 1, green: 2, purple: 1, wild: 0 }, points: 4 },
    { id: 13, name: "Treasure Chest", cost: { red: 3, blue: 1, green: 1, purple: 0, wild: 0 }, points: 6 },
    { id: 14, name: "Enchanted Ring", cost: { red: 1, blue: 1, green: 0, purple: 2, wild: 0 }, points: 5 },
    { id: 15, name: "Sacred Scroll", cost: { red: 0, blue: 0, green: 1, purple: 1, wild: 2 }, points: 4 },
    { id: 16, name: "Phoenix Feather", cost: { red: 4, blue: 0, green: 0, purple: 1, wild: 0 }, points: 7 },
    { id: 17, name: "Dragon Scale", cost: { red: 0, blue: 0, green: 4, purple: 1, wild: 0 }, points: 7 },
    { id: 18, name: "Starlight Gem", cost: { red: 2, blue: 2, green: 2, purple: 0, wild: 0 }, points: 8 },
    { id: 19, name: "Moonstone", cost: { red: 1, blue: 3, green: 0, purple: 2, wild: 0 }, points: 6 },
    { id: 20, name: "Legendary Artifact", cost: { red: 2, blue: 1, green: 1, purple: 1, wild: 1 }, points: 8 }
];

// Game state
let gameState = {
    players: [
        { name: "Alice", gems: { red: 0, blue: 0, green: 0, purple: 0 }, blackCubes: 0, points: 0, cards: [], activeCards: [null, null, null], scoringPile: [] },
        { name: "Bob", gems: { red: 0, blue: 0, green: 0, purple: 0 }, blackCubes: 0, points: 0, cards: [], activeCards: [null, null, null], scoringPile: [] }
    ],
    currentPlayerIndex: 0,
    diceValues: [],
    selectedDice: [],
    rollCount: 0,
    maxRolls: 4,
    numDice: 8,
    roundCount: 1,
    availableCards: []
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
    
    // Log game start
    logGameEvent('system', 'Game started!');
    
    // REMOVED: Auto-roll for first player
    // Now player must click the roll button explicitly
}

function calculateScore() {
    const currentPlayer = getCurrentPlayer();
    
    // Count occurrences of each dice value
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Index 0 is unused
    gameState.diceValues.forEach(value => counts[value]++);
    
    // 1s: Each 1 rewards player with 1 red gem
    const redGems = counts[1];
    currentPlayer.gems.red += redGems;
    
    // 2s: Each pair of 2s rewards player with 1 blue gem
    const blueGems = Math.floor(counts[2] / 2);
    currentPlayer.gems.blue += blueGems;
    
    // 3s: Each triplet of 3s rewards player with 1 green gem
    const greenGems = Math.floor(counts[3] / 3);
    currentPlayer.gems.green += greenGems;
    
    // 4s: Each quartet of 4s rewards player with 1 purple gem
    // If you roll less than 4 4s, get a black cube for each 4 rolled, keep them between rounds
    // Special rule: On turns where you complete having 4 cubes, you get no more cubes even if you have more 4s rolled
    // No remainder cubes are kept when converting
    let foursPurpleGems = 0;
    let newBlackCubes = 0;
    let cubesConverted = false;
    
    if (counts[4] >= 4) {
        // Player rolled at least 4 fours - get purple gems directly
        foursPurpleGems = Math.floor(counts[4] / 4);
        currentPlayer.gems.purple += foursPurpleGems;
        
        // Check if player had accumulated black cubes that now convert to purple gems
        if (currentPlayer.blackCubes >= 4) {
            const bonusPurpleGems = Math.floor(currentPlayer.blackCubes / 4);
            currentPlayer.gems.purple += bonusPurpleGems;
            currentPlayer.blackCubes = 0; // All cubes consumed, no remainder kept
            foursPurpleGems += bonusPurpleGems;
            cubesConverted = true;
        }
    } else {
        // Player rolled less than 4 fours - check if they can complete sets with existing cubes
        const totalFours = currentPlayer.blackCubes + counts[4];
        
        if (totalFours >= 4) {
            // Player will complete at least one set of 4 cubes
            foursPurpleGems = Math.floor(totalFours / 4);
            currentPlayer.gems.purple += foursPurpleGems;
            currentPlayer.blackCubes = 0; // All cubes consumed, no remainder kept
            cubesConverted = true;
            
            // Special rule: No additional cubes gained when completing sets
            newBlackCubes = 0;
        } else {
            // Player doesn't complete any sets - add to black cubes normally
            newBlackCubes = counts[4];
            currentPlayer.blackCubes += newBlackCubes;
        }
    }
    
    // 5s: At least one 5 gives 1 blue gem
    let fivesBlueGems = 0;
    if (counts[5] >= 1) {
        fivesBlueGems = 1;
        currentPlayer.gems.blue += 1;
    }
    
    // 6s: Progressive rewards based on count
    // 1:red  2,3:blue  4,5:green  6,7,8:purple
    let sixesRedGems = 0;
    let sixesBlueGems = 0;
    let sixesGreenGems = 0;
    let sixesPurpleGems = 0;
    
    if (counts[6] === 1) {
        sixesRedGems = 1;
        currentPlayer.gems.red += 1;
    } else if (counts[6] === 2 || counts[6] === 3) {
        sixesBlueGems = 1;
        currentPlayer.gems.blue += 1;
    } else if (counts[6] === 4 || counts[6] === 5) {
        sixesGreenGems = 1;
        currentPlayer.gems.green += 1;
    } else if (counts[6] >= 6) {
        sixesPurpleGems = 1;
        currentPlayer.gems.purple += 1;
    }
    
    // Update total gem counts for logging
    let totalRedGems = redGems + sixesRedGems;
    let totalBlueGems = blueGems + fivesBlueGems + sixesBlueGems;
    let totalGreenGems = greenGems + sixesGreenGems;
    let totalPurpleGems = foursPurpleGems + sixesPurpleGems;
    
    // Log the score with comprehensive details
    let scoreMessage = `${currentPlayer.name} earned: `;
    if (totalRedGems > 0) scoreMessage += `${totalRedGems} red gem${totalRedGems > 1 ? 's' : ''}, `;
    if (totalBlueGems > 0) scoreMessage += `${totalBlueGems} blue gem${totalBlueGems > 1 ? 's' : ''}, `;
    if (totalGreenGems > 0) scoreMessage += `${totalGreenGems} green gem${totalGreenGems > 1 ? 's' : ''}, `;
    if (totalPurpleGems > 0) scoreMessage += `${totalPurpleGems} purple gem${totalPurpleGems > 1 ? 's' : ''}, `;
    
    // Add black cubes info if any were gained
    if (newBlackCubes > 0) {
        scoreMessage += `${newBlackCubes} black cube${newBlackCubes > 1 ? 's' : ''}, `;
    }
    
    // Remove trailing comma and space
    scoreMessage = scoreMessage.replace(/, $/, '');
    
    // If no gems were earned
    if (scoreMessage === `${currentPlayer.name} earned: `) {
        scoreMessage = `${currentPlayer.name} didn't earn any gems this turn.`;
    }
    
    logGameEvent('player', scoreMessage);
    
    // Log black cubes status and conversions
    if (cubesConverted) {
        logGameEvent('player', `${currentPlayer.name} converted black cubes to purple gem${foursPurpleGems > 1 ? 's' : ''}!`);
    }
    if (currentPlayer.blackCubes > 0) {
        logGameEvent('player', `${currentPlayer.name} now has ${currentPlayer.blackCubes} black cube${currentPlayer.blackCubes > 1 ? 's' : ''}.`);
    }
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
        document.getElementById('end-turn-btn').disabled = false;
        
        // Create dice on first roll
        diceContainer.innerHTML = ''; // Clear any existing dice
        
        // Create the dice
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

function endTurn() {
    calculateScore();
    
    // Log the end of turn
    logGameEvent('player', `${getCurrentPlayer().name} ended their turn.`);
    
    // Reset roll count and selected dice
    gameState.rollCount = 0;
    gameState.selectedDice = [];
    
    // Update UI elements - enable roll button for next player
    document.getElementById('roll-btn').disabled = false;
    document.getElementById('roll-btn').style.display = 'inline-block';
    document.getElementById('roll-btn').classList.remove('disabled');
    updateRollButtonText(); // Reset button text for next player
    
    // Disable end turn button until next roll
    document.getElementById('end-turn-btn').disabled = true;
    
    // Clear max-rolls-reached class if it exists
    document.getElementById('roll-count').classList.remove('max-rolls-reached');
    
    // Switch to next player
    switchPlayer();
    
    // Set dice alignment for the NEXT player (after switchPlayer has been called)
    const diceContainer = document.querySelector('.dice-container');
    if (gameState.currentPlayerIndex === 0) {
        // Alice is next player - align dice to the left
        diceContainer.classList.remove('align-right');
        diceContainer.classList.add('align-left');
    } else {
        // Bob is next player - align dice to the right
        diceContainer.classList.remove('align-left');
        diceContainer.classList.add('align-right');
    }
    
    // Add question mark dice for the new player's turn
    createQuestionDice();
    
    updateUI();
}

function endRound() {
    // Increment round count after both players have played
    gameState.roundCount++;
    logGameEvent('system', `Round ${gameState.roundCount} begins.`);
    updateUI();
}

// Keep track of previous values for animation
let prevBlackCubes = [0, 0];

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

    // Update black cubes counter for BOTH players
    document.getElementById('player1-black-cubes').textContent = gameState.players[0].blackCubes;
    document.getElementById('player2-black-cubes').textContent = gameState.players[1].blackCubes;
    
    // Update points for both players
    document.getElementById('player1-points').textContent = gameState.players[0].points;
    document.getElementById('player2-points').textContent = gameState.players[1].points;

    // Update dice selection visualization
    updateDiceSelection();
    
    // Ensure roll button visibility
    updateRollButtonVisibility();
    updateRollButtonText();
    
    // Update black cubes counter with animation if changed
    for (let i = 0; i < 2; i++) {
        const blackCubesElement = document.getElementById(`player${i+1}-black-cubes`);
        if (blackCubesElement) {
            if (gameState.players[i].blackCubes !== prevBlackCubes[i]) {
                blackCubesElement.classList.add('pulse');
                setTimeout(() => blackCubesElement.classList.remove('pulse'), 500);
                prevBlackCubes[i] = gameState.players[i].blackCubes;
            }
            blackCubesElement.textContent = gameState.players[i].blackCubes;
        }
    }
    
    // Update card UI if it exists
    if (document.getElementById('available-cards')) {
        updateCardUI();
    }
    
    // Update player boards
    updatePlayerBoards();
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

// Update the startGame function to initialize a simple dice game
async function startGame() {
    // Reset game state
    gameState = {
        players: [
            { 
                name: "Alice", 
                gems: { red: 0, blue: 0, green: 0, purple: 0 }, 
                blackCubes: 0,
                points: 0,
                cards: [],
                activeCards: [null, null, null],
                scoringPile: []
            },
            { 
                name: "Bob", 
                gems: { red: 0, blue: 0, green: 0, purple: 0 }, 
                blackCubes: 0,
                points: 0,
                cards: [],
                activeCards: [null, null, null],
                scoringPile: []
            }
        ],
        currentPlayerIndex: 0,
        diceValues: [],
        selectedDice: [],
        rollCount: 0,
        maxRolls: 4,
        numDice: 8,
        roundCount: 1,
        availableCards: []
    };
    
    // Initialize card deck
    initializeCards();

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

    // Set initial dice alignment for Alice (player 0)
    const diceContainer = document.querySelector('.dice-container');
    diceContainer.classList.remove('align-right');
    diceContainer.classList.add('align-left');

    // Add question mark dice at the start of the game
    createQuestionDice();

    // Update UI
    updateUI();
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

// ============================
// CARD SYSTEM FUNCTIONS
// ============================

function initializeCards() {
    // Shuffle the deck and make first 3 cards available
    gameState.availableCards = shuffleArray([...cardDeck]).slice(0, 3);
    updateCardUI();
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function updateCardUI() {
    const cardContainer = document.getElementById('available-cards');
    cardContainer.innerHTML = '';
    
    gameState.availableCards.forEach((card, index) => {
        const cardElement = createCardElement(card, index);
        cardContainer.appendChild(cardElement);
    });
}

function createCardElement(card, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id;
    
    const canAfford = canPlayerAffordCard(getCurrentPlayer(), card);
    if (!canAfford) {
        cardDiv.classList.add('unaffordable');
    }
    
    cardDiv.innerHTML = `
        <div class="card-header">
            <h4 class="card-name">${card.name}</h4>
            <div class="card-points">${card.points} pts</div>
        </div>
        <div class="card-cost">
            ${formatCardCost(card.cost)}
        </div>
        <button class="buy-card-btn" ${!canAfford ? 'disabled' : ''} 
                onclick="buyCard(${index})">
            ${canAfford ? 'Buy' : 'Can\'t Afford'}
        </button>
    `;
    
    return cardDiv;
}

function formatCardCost(cost) {
    const gems = [];
    
    if (cost.red > 0) gems.push(`<span class="cost-gem red">${cost.red}</span>`);
    if (cost.blue > 0) gems.push(`<span class="cost-gem blue">${cost.blue}</span>`);
    if (cost.green > 0) gems.push(`<span class="cost-gem green">${cost.green}</span>`);
    if (cost.purple > 0) gems.push(`<span class="cost-gem purple">${cost.purple}</span>`);
    if (cost.wild > 0) gems.push(`<span class="cost-gem wild">${cost.wild}</span>`);
    
    return gems.join(' ');
}

function canPlayerAffordCard(player, card) {
    const cost = card.cost;
    let totalCost = cost.red + cost.blue + cost.green + cost.purple + cost.wild;
    let availableGems = player.gems.red + player.gems.blue + player.gems.green + player.gems.purple;
    
    // Check if player has enough specific gems
    let neededSpecific = Math.max(0, cost.red - player.gems.red) +
                        Math.max(0, cost.blue - player.gems.blue) +
                        Math.max(0, cost.green - player.gems.green) +
                        Math.max(0, cost.purple - player.gems.purple);
    
    let neededWild = cost.wild;
    let totalNeeded = neededSpecific + neededWild;
    
    return availableGems >= totalNeeded;
}

function buyCard(cardIndex) {
    const card = gameState.availableCards[cardIndex];
    const player = getCurrentPlayer();
    
    if (!canPlayerAffordCard(player, card)) {
        logGameEvent('system', `${player.name} cannot afford ${card.name}`);
        return;
    }
    
    // Show modal for payment if wild gems are involved
    if (card.cost.wild > 0) {
        showPaymentModal(card, cardIndex);
    } else {
        completeCardPurchase(card, cardIndex, card.cost);
    }
}

function showPaymentModal(card, cardIndex) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Purchase ${card.name}</h3>
            <p>Cost: ${formatCardCost(card.cost)}</p>
            <div class="payment-section">
                <h4>Pay with your gems:</h4>
                <div class="gem-payment">
                    <label>Red: <input type="number" id="pay-red" min="0" max="${getCurrentPlayer().gems.red}" value="0"></label>
                    <label>Blue: <input type="number" id="pay-blue" min="0" max="${getCurrentPlayer().gems.blue}" value="0"></label>
                    <label>Green: <input type="number" id="pay-green" min="0" max="${getCurrentPlayer().gems.green}" value="0"></label>
                    <label>Purple: <input type="number" id="pay-purple" min="0" max="${getCurrentPlayer().gems.purple}" value="0"></label>
                </div>
                <div class="modal-buttons">
                    <button onclick="processPaymentForCard(${card.id}, ${cardIndex})">Confirm Purchase</button>
                    <button onclick="closePaymentModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Store the card info for processing
    window.currentCardForPayment = card;
    
    document.body.appendChild(modal);
}

function processPaymentForCard(cardId, cardIndex) {
    const card = window.currentCardForPayment;
    if (!card) return;
    
    const payRed = parseInt(document.getElementById('pay-red').value) || 0;
    const payBlue = parseInt(document.getElementById('pay-blue').value) || 0;
    const payGreen = parseInt(document.getElementById('pay-green').value) || 0;
    const payPurple = parseInt(document.getElementById('pay-purple').value) || 0;
    
    const payment = { red: payRed, blue: payBlue, green: payGreen, purple: payPurple, wild: 0 };
    const totalPaid = payRed + payBlue + payGreen + payPurple;
    const totalCost = card.cost.red + card.cost.blue + card.cost.green + card.cost.purple + card.cost.wild;
    
    if (totalPaid !== totalCost) {
        alert(`Payment must equal ${totalCost} gems`);
        return;
    }
    
    closePaymentModal();
    completeCardPurchase(card, cardIndex, payment);
}

function closePaymentModal() {
    const modal = document.querySelector('.payment-modal');
    if (modal) {
        modal.remove();
    }
}

function completeCardPurchase(card, cardIndex, payment) {
    const player = getCurrentPlayer();
    
    // Deduct gems
    player.gems.red -= payment.red;
    player.gems.blue -= payment.blue;
    player.gems.green -= payment.green;
    player.gems.purple -= payment.purple;
    
    // Check if player has empty slots
    const emptySlotIndex = player.activeCards.findIndex(slot => slot === null);
    
    if (emptySlotIndex !== -1) {
        // Place card in empty slot
        player.activeCards[emptySlotIndex] = card;
        logGameEvent('player', `${player.name} bought ${card.name} and placed it in slot ${emptySlotIndex + 1}!`);
    } else {
        // All slots are full - need to replace a card
        showReplacementModal(card, cardIndex, payment);
        return; // Don't continue with the rest of the function yet
    }
    
    // Remove card from available cards and add new one
    gameState.availableCards.splice(cardIndex, 1);
    addNewCardToMarket();
    
    updateUI();
    updateCardUI();
}

function showReplacementModal(newCard, cardIndex, payment) {
    const player = getCurrentPlayer();
    
    const modal = document.createElement('div');
    modal.className = 'replacement-modal';
    modal.innerHTML = `
        <div class="replacement-modal-content">
            <h3>Replace a Card</h3>
            <p>Your active card slots are full. Choose a card to move to your scoring pile:</p>
            <div class="replacement-options">
                ${player.activeCards.map((card, slotIndex) => `
                    <div class="replacement-card" onclick="selectReplacementCard(${slotIndex})" data-slot="${slotIndex}">
                        <div class="replacement-card-name">${card.name}</div>
                        <div class="replacement-card-points">${card.points} pts</div>
                    </div>
                `).join('')}
            </div>
            <p><strong>New card:</strong> ${newCard.name} (${newCard.points} pts)</p>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="confirmReplacement(${cardIndex})" id="confirm-replacement-btn" disabled>
                    Confirm Replacement
                </button>
                <button onclick="cancelReplacement()" style="margin-left: 10px;">Cancel</button>
            </div>
        </div>
    `;
    
    // Store the data for later use
    window.pendingPayment = payment;
    window.pendingNewCard = newCard;
    window.pendingCardIndex = cardIndex;
    window.selectedReplacementSlot = -1;
    
    document.body.appendChild(modal);
}

function selectReplacementCard(slotIndex) {
    // Remove previous selection
    document.querySelectorAll('.replacement-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select new card
    const selectedCard = document.querySelector(`[data-slot="${slotIndex}"]`);
    selectedCard.classList.add('selected');
    
    // Enable confirm button
    document.getElementById('confirm-replacement-btn').disabled = false;
    window.selectedReplacementSlot = slotIndex;
}

function confirmReplacement(cardIndex) {
    const player = getCurrentPlayer();
    const slotIndex = window.selectedReplacementSlot;
    const newCard = window.pendingNewCard;
    
    if (slotIndex === -1) return;
    
    // Move the old card to scoring pile
    const oldCard = player.activeCards[slotIndex];
    player.scoringPile.push(oldCard);
    
    // Place new card in the slot
    player.activeCards[slotIndex] = newCard;
    
    logGameEvent('player', `${player.name} bought ${newCard.name}, moved ${oldCard.name} to scoring pile!`);
    
    // Remove card from available cards and add new one
    gameState.availableCards.splice(cardIndex, 1);
    addNewCardToMarket();
    
    // Close modal
    closeReplacementModal();
    
    updateUI();
    updateCardUI();
}

function cancelReplacement() {
    // Refund the gems (they were already deducted)
    const player = getCurrentPlayer();
    const payment = window.pendingPayment;
    
    player.gems.red += payment.red;
    player.gems.blue += payment.blue;
    player.gems.green += payment.green;
    player.gems.purple += payment.purple;
    
    closeReplacementModal();
    updateUI();
}

function closeReplacementModal() {
    const modal = document.querySelector('.replacement-modal');
    if (modal) {
        modal.remove();
    }
    window.pendingPayment = null;
    window.selectedReplacementSlot = -1;
}

function addNewCardToMarket() {
    const remainingCards = cardDeck.filter(c => 
        !gameState.availableCards.some(ac => ac.id === c.id) &&
        !gameState.players.some(p => 
            p.activeCards.some(pc => pc && pc.id === c.id) ||
            p.scoringPile.some(pc => pc.id === c.id)
        )
    );
    
    if (remainingCards.length > 0) {
        const newCard = remainingCards[Math.floor(Math.random() * remainingCards.length)];
        gameState.availableCards.push(newCard);
    }
}

// Expose functions to the global scope for HTML interaction
window.startGame = startGame;
window.stopGame = stopGame;
window.rollDice = rollDice;
window.endTurn = endTurn;
window.toggleDiceSelection = toggleDiceSelection;
window.logGameEvent = logGameEvent;
window.buyCard = buyCard;
window.processPaymentForCard = processPaymentForCard;
window.closePaymentModal = closePaymentModal;
window.showScoringPile = showScoringPile;
window.closeScoringModal = closeScoringModal;
window.selectReplacementCard = selectReplacementCard;
window.confirmReplacement = confirmReplacement;
window.cancelReplacement = cancelReplacement;
window.viewCard = viewCard;

// Add this new function
function createQuestionDice() {
    const diceContainer = document.querySelector('.dice-container');
    diceContainer.innerHTML = ''; // Clear existing dice
    
    // Create placeholder dice with question marks
    for (let i = 0; i < gameState.numDice; i++) {
        const dice = document.createElement('div');
        dice.classList.add('dice', 'unrolled');
        dice.dataset.index = i;
        dice.textContent = '?';
        
        // Dice aren't clickable until rolled
        diceContainer.appendChild(dice);
    }
    
    // Clear the dice values in the game state
    gameState.diceValues = [];
}

// Update player boards
function updatePlayerBoards() {
    gameState.players.forEach((player, playerIndex) => {
        // Update active cards in slots
        for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
            const slot = document.querySelector(`[data-player="${playerIndex}"][data-slot="${slotIndex}"]`);
            const card = player.activeCards[slotIndex];
            
            if (card) {
                slot.innerHTML = createSlotCardHTML(card);
                slot.classList.add('filled');
                slot.classList.remove('empty');
            } else {
                slot.innerHTML = '<span class="slot-placeholder">Empty</span>';
                slot.classList.remove('filled');
                slot.classList.add('empty');
            }
        }
        
        // Update scoring pile count
        const scoringCountElement = document.getElementById(`player${playerIndex + 1}-scoring-count`);
        const scoringPileElement = document.getElementById(`player${playerIndex + 1}-scoring-pile`);
        
        if (scoringCountElement) {
            scoringCountElement.textContent = player.scoringPile.length;
        }
        
        if (scoringPileElement) {
            if (player.scoringPile.length > 0) {
                scoringPileElement.classList.add('has-cards');
                scoringPileElement.textContent = `${player.scoringPile.length} card${player.scoringPile.length > 1 ? 's' : ''}`;
            } else {
                scoringPileElement.classList.remove('has-cards');
                scoringPileElement.textContent = 'Click to view';
            }
        }
        
        // Update total points (only from scoring pile)
        const totalPoints = player.scoringPile.reduce((sum, card) => sum + card.points, 0);
        player.points = totalPoints;
    });
}

function createSlotCardHTML(card) {
    return `
        <div class="slot-card" onclick="viewCard(${card.id})">
            <div class="slot-card-name">${card.name}</div>
            <div class="slot-card-cost">${formatSlotCardCost(card.cost)}</div>
            <div class="slot-card-points">${card.points}</div>
        </div>
    `;
}

function formatSlotCardCost(cost) {
    const gems = [];
    
    if (cost.red > 0) gems.push(`<span class="slot-cost-gem red">${cost.red}</span>`);
    if (cost.blue > 0) gems.push(`<span class="slot-cost-gem blue">${cost.blue}</span>`);
    if (cost.green > 0) gems.push(`<span class="slot-cost-gem green">${cost.green}</span>`);
    if (cost.purple > 0) gems.push(`<span class="slot-cost-gem purple">${cost.purple}</span>`);
    if (cost.wild > 0) gems.push(`<span class="slot-cost-gem wild">${cost.wild}</span>`);
    
    return gems.join('');
}

function viewCard(cardId) {
    // Find the card in any player's active cards or scoring pile
    const card = cardDeck.find(c => c.id === cardId);
    if (card) {
        alert(`${card.name}\nCost: ${formatCardCostText(card.cost)}\nPoints: ${card.points}`);
    }
}

function formatCardCostText(cost) {
    const parts = [];
    if (cost.red > 0) parts.push(`${cost.red} red`);
    if (cost.blue > 0) parts.push(`${cost.blue} blue`);
    if (cost.green > 0) parts.push(`${cost.green} green`);
    if (cost.purple > 0) parts.push(`${cost.purple} purple`);
    if (cost.wild > 0) parts.push(`${cost.wild} wild`);
    return parts.join(', ');
}

function showScoringPile(playerIndex) {
    const player = gameState.players[playerIndex];
    
    if (player.scoringPile.length === 0) {
        alert(`${player.name} has no cards in their scoring pile yet.`);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'scoring-modal';
    
    const totalPoints = player.scoringPile.reduce((sum, card) => sum + card.points, 0);
    
    modal.innerHTML = `
        <div class="scoring-modal-content">
            <h3>${player.name}'s Scoring Pile (${totalPoints} points)</h3>
            <div class="scoring-cards-grid">
                ${player.scoringPile.map(card => `
                    <div class="scoring-card">
                        <div class="scoring-card-name">${card.name}</div>
                        <div class="scoring-card-points">${card.points} pts</div>
                    </div>
                `).join('')}
            </div>
            <button class="modal-close-btn" onclick="closeScoringModal()">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeScoringModal() {
    const modal = document.querySelector('.scoring-modal');
    if (modal) {
        modal.remove();
    }
}
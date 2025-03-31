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
    roundCount: 1, // Start from round 1
    cards: {
        deck: [],
        displayed: [],
        discarded: []
    },
    victoryPoints: [0, 0] // Track victory points for each player
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
    const redGems = counts[1];
    currentPlayer.gems.red += redGems;
    
    // 2s: Each pair of 2s rewards player with 1 blue gem
    const blueGems = Math.floor(counts[2] / 2);
    currentPlayer.gems.blue += blueGems;
    
    // 3s: Each triplet of 3s rewards player with 1 green gem
    const greenGems = Math.floor(counts[3] / 3);
    currentPlayer.gems.green += greenGems;
    
    // 4s: If there's at least one 4, player gets a purple gem
    const purpleGems = counts[4] > 0 ? 1 : 0;
    currentPlayer.gems.purple += purpleGems;
    
    // 5s: Progressive rewards based on count
    let fivesRedGems = 0;
    let fivesBlueGems = 0;
    let fivesGreenGems = 0;
    let fivesPurpleGems = 0;
    
    // Award gems based on how many 5s were rolled
    if (counts[5] >= 4) {
        fivesPurpleGems = 1;
        currentPlayer.gems.purple += 1;
    } else if (counts[5] === 3) {
        fivesGreenGems = 1;
        currentPlayer.gems.green += 1;
    } else if (counts[5] === 2) {
        fivesBlueGems = 1;
        currentPlayer.gems.blue += 1;
    } else if (counts[5] === 1) {
        fivesRedGems = 1;
        currentPlayer.gems.red += 1;
    }
    
    // Update total gem counts for logging
    const totalRedGems = redGems + fivesRedGems;
    const totalBlueGems = blueGems + fivesBlueGems;
    const totalGreenGems = greenGems + fivesGreenGems;
    const totalPurpleGems = purpleGems + fivesPurpleGems;
    
    // Log the score with comprehensive details
    let scoreMessage = `${currentPlayer.name} earned: `;
    if (totalRedGems > 0) scoreMessage += `${totalRedGems} red gem${totalRedGems > 1 ? 's' : ''}, `;
    if (totalBlueGems > 0) scoreMessage += `${totalBlueGems} blue gem${totalBlueGems > 1 ? 's' : ''}, `;
    if (totalGreenGems > 0) scoreMessage += `${totalGreenGems} green gem${totalGreenGems > 1 ? 's' : ''}, `;
    if (totalPurpleGems > 0) scoreMessage += `${totalPurpleGems} purple gem${totalPurpleGems > 1 ? 's' : ''}, `;
    
    // Remove trailing comma and space
    scoreMessage = scoreMessage.replace(/, $/, '');
    
    // If no gems were earned
    if (scoreMessage === `${currentPlayer.name} earned: `) {
        scoreMessage = `${currentPlayer.name} didn't earn any gems this turn.`;
    }
    
    logGameEvent('player', scoreMessage);
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

// Keep track of previous values for animation
let prevVictoryPoints = [0, 0];
let prevSixes = [0, 0];

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
    
    // Update sixes counter for BOTH players (not just current)
    document.getElementById('player1-sixes').textContent = gameState.players[0].sixes;
    document.getElementById('player2-sixes').textContent = gameState.players[1].sixes;

    // Update dice selection visualization
    updateDiceSelection();
    
    // Ensure roll button visibility
    updateRollButtonVisibility();
    updateRollButtonText();

    // Check if the game has ended
    checkGameEnd();
    
    // Update victory points display
    document.getElementById('player1-vp').textContent = gameState.victoryPoints[0];
    document.getElementById('player2-vp').textContent = gameState.victoryPoints[1];
    
    // Update card display to reflect current player's available gems
    updateCardsDisplay();

    // Update victory points with animation if changed
    for (let i = 0; i < 2; i++) {
        const vpElement = document.getElementById(`player${i+1}-vp`);
        if (vpElement) {
            if (gameState.victoryPoints[i] !== prevVictoryPoints[i]) {
                vpElement.classList.add('pulse');
                setTimeout(() => vpElement.classList.remove('pulse'), 500);
                prevVictoryPoints[i] = gameState.victoryPoints[i];
            }
            vpElement.textContent = gameState.victoryPoints[i];
        }
    }
    
    // Update sixes counter with animation if changed
    for (let i = 0; i < 2; i++) {
        const sixesElement = document.getElementById(`player${i+1}-sixes`);
        if (sixesElement) {
            if (gameState.players[i].sixes !== prevSixes[i]) {
                sixesElement.classList.add('pulse');
                setTimeout(() => sixesElement.classList.remove('pulse'), 500);
                prevSixes[i] = gameState.players[i].sixes;
            }
            sixesElement.textContent = gameState.players[i].sixes;
        }
    }
    updatePurchasedCardsDisplay();
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

// Initialize the card system in startGame()
function startGame() {
    // Reset game state
    gameState = {
        players: [
            { 
                name: "Alice", 
                gems: { red: 0, blue: 0, green: 0, purple: 0 }, 
                sixes: 0,
                purchasedCards: [] // Initialize purchased cards array
            },
            { 
                name: "Bob", 
                gems: { red: 0, blue: 0, green: 0, purple: 0 }, 
                sixes: 0,
                purchasedCards: [] // Initialize purchased cards array
            }
        ],
        currentPlayerIndex: 0,
        diceValues: [],
        selectedDice: [],
        rollCount: 0,
        maxRolls: 4,
        numDice: 8,
        roundCount: 1,
        cards: {
            deck: [],
            displayed: [],
            discarded: []
        },
        victoryPoints: [0, 0]
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
    
    // Set initial dice alignment for Alice (player 0)
    const diceContainer = document.querySelector('.dice-container');
    diceContainer.classList.remove('align-right');
    diceContainer.classList.add('align-left');
    
    // Add question mark dice at the start of the game
    createQuestionDice();
    
    // Add card system initialization
    gameState.cards.deck = generateDeck();
    gameState.cards.displayed = [];
    gameState.cards.discarded = [];
    gameState.victoryPoints = [0, 0];
    
    // Draw initial 5 cards
    drawCards(5);
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

// Add this to updateUI or as a separate function called from updateUI
function checkGameEnd() {
    const maxPoints = 10; // Adjust based on desired game length
    
    if (gameState.victoryPoints[0] >= maxPoints || gameState.victoryPoints[1] >= maxPoints) {
        // Determine winner
        let winner;
        if (gameState.victoryPoints[0] > gameState.victoryPoints[1]) {
            winner = gameState.players[0].name;
        } else if (gameState.victoryPoints[1] > gameState.victoryPoints[0]) {
            winner = "It's a tie!";
        }
        
        // Log game end
        logGameEvent('system', `Game over! ${winner} wins with ${Math.max(gameState.victoryPoints[0], gameState.victoryPoints[1])} victory points!`);
        
        // Disable game controls
        gameRunning = false;
        document.getElementById('roll-btn').disabled = true;
        document.getElementById('end-turn-btn').disabled = true;
        
        // Show game end notification
        showNotification(`Game over! ${winner} wins!`, 6000);
    }
}

// Add this array of fantasy object names
const fantasyObjectNames = [
    // Weapons
    "Dragon's Bane", "Shadowblade", "Lightbringer", "Storm Caller", "Whispering Bow",
    "Frostbite Dagger", "Soulreaver", "Void Scepter", "Thunder Hammer", "Celestial Staff",
    
    // Artifacts
    "Orb of Destiny", "Ancient Codex", "Philosopher's Stone", "Celestial Compass", "Eternity Hourglass",
    "Astral Prism", "Void Mirror", "Dreamcatcher Locket", "Crystal of Insight", "Rune of Power",
    
    // Talismans
    "Phoenix Feather", "Dragon Scale", "Unicorn Horn", "Mermaid's Tear", "Fairy Dust Vial",
    "Wizard's Amulet", "Elven Brooch", "Dwarven Ring", "Griffin Talon", "Siren's Pearl",
    
    // Relics
    "Crown of Ages", "Chalice of Life", "Tome of Secrets", "Mask of Truth", "Gauntlet of Giants",
    "Heart of Mountain", "Eye of Oracle", "Shield of Heroes", "Boots of Speed", "Cloak of Shadows",
    
    // Scrolls & Potions
    "Elixir of Wisdom", "Scroll of Time", "Potion of Courage", "Enchanted Ink", "Remedy of Restoration",
    "Essence of Elements", "Brew of Strength", "Arcane Formula", "Mist of Dreams", "Flask of Flames"
];

// Generate the card deck
function generateDeck() {
    const deck = [];
    const gemTypes = ['red', 'blue', 'green', 'purple'];
    
    // Create a copy of the names array that we can modify
    const availableNames = [...fantasyObjectNames];
    
    // Create 52 unique cards with different costs and point values
    for (let i = 0; i < 52; i++) {
        // Determine gem requirements (2-5 gems)
        const gemCount = Math.floor(Math.random() * 4) + 2; // 2-5 gems
        const cost = {};
        
        // Initialize all gem types to 0
        gemTypes.forEach(type => cost[type] = 0);
        
        // Distribute gem requirements
        for (let j = 0; j < gemCount; j++) {
            const gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
            cost[gemType]++;
        }
        
        // Determine victory points (1-5 points, higher costs = more points)
        const points = Math.floor(gemCount / 2) + Math.floor(Math.random() * 3) + 1;
        
        // Generate a random card name or use fallback if we run out
        let cardName;
        if (availableNames.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableNames.length);
            cardName = availableNames.splice(randomIndex, 1)[0]; // Remove the used name
        } else {
            cardName = `Mysterious Artifact #${i}`; // Fallback name
        }
        
        // Create card
        const card = {
            id: i,
            name: cardName,
            cost: cost,
            points: points,
            // Add visual variety with different "card types"
            type: ['treasure', 'artifact', 'spell', 'relic'][Math.floor(Math.random() * 4)]
        };
        
        deck.push(card);
    }
    
    // Shuffle the deck
    return shuffleDeck(deck);
}

// Shuffle deck function
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Draw cards from deck
function drawCards(count) {
    // Draw specified number of cards or as many as possible
    const cardsToDisplay = Math.min(count, gameState.cards.deck.length);
    
    for (let i = 0; i < cardsToDisplay; i++) {
        // Move card from deck to displayed
        if (gameState.cards.deck.length > 0) {
            gameState.cards.displayed.push(gameState.cards.deck.pop());
        }
    }
    
    // Update the displayed cards UI
    updateCardsDisplay();
}

// Updated function to display multiple gem icons instead of counts
function renderCardCost(cost) {
    let html = '';
    
    // Create a gem container
    html += '<div class="gem-requirements-container">';
    
    // For each gem type
    for (const [gemType, count] of Object.entries(cost)) {
        // Only process if there are gems of this type required
        if (count > 0) {
            // Add a container for this gem type
            html += `<div class="gem-type-group gem-type-${gemType}">`;
            
            // Repeat the gem icon for the count
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="gem-requirement">
                        <div class="gem-requirement-icon gem-requirement-${gemType}"></div>
                    </div>
                `;
            }
            
            html += '</div>'; // Close the gem type group
        }
    }
    
    html += '</div>'; // Close the container
    return html;
}

// Update cards display in UI
function updateCardsDisplay() {
    const cardDisplay = document.querySelector('.card-display');
    if (!cardDisplay) {
        console.error("Card display container not found!");
        return;
    }
    
    cardDisplay.innerHTML = '';
    
    console.log("Displaying cards:", gameState.cards.displayed.length);
    
    gameState.cards.displayed.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', `card-${card.type}`);
        cardElement.dataset.index = index;
        
        // Check if current player can afford this card
        const canAfford = canPlayerAffordCard(gameState.currentPlayerIndex, card);
        if (!canAfford) {
            cardElement.classList.add('unavailable');
        }
        
        // Card content with fantasy name
        cardElement.innerHTML = `
            <div class="card-header">
                <div class="card-points">${card.points}</div>
                <h4 class="card-name">${card.name}</h4>
            </div>
            <div class="card-cost">
                ${renderCardCost(card.cost)}
            </div>
            <div class="card-type">${card.type}</div>
        `;
        
        // Add click handler for card purchase
        cardElement.addEventListener('click', () => {
            if (canAfford) {
                purchaseCard(index);
            } else {
                showNotification("You don't have enough gems to purchase this card!");
            }
        });
        
        cardDisplay.appendChild(cardElement);
    });
}

// Check if player can afford a card
function canPlayerAffordCard(playerIndex, card) {
    const player = gameState.players[playerIndex];
    
    for (const [gemType, count] of Object.entries(card.cost)) {
        if (player.gems[gemType] < count) {
            return false;
        }
    }
    
    return true;
}

// Purchase a card
function purchaseCard(cardIndex) {
    const card = gameState.cards.displayed[cardIndex];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Check if player can afford card
    if (!canPlayerAffordCard(gameState.currentPlayerIndex, card)) {
        showNotification("You don't have enough gems to purchase this card!");
        return;
    }
    
    // Initialize purchased cards array if it doesn't exist
    if (!player.purchasedCards) {
        player.purchasedCards = [];
    }
    
    // Deduct gems
    for (const [gemType, count] of Object.entries(card.cost)) {
        player.gems[gemType] -= count;
    }
    
    // Add victory points
    if (!gameState.victoryPoints) {
        gameState.victoryPoints = [0, 0];
    }
    gameState.victoryPoints[gameState.currentPlayerIndex] += card.points;
    
    // Add to player's purchased cards collection
    player.purchasedCards.push({...card}); // Store a copy of the card
    
    // Log purchase
    logGameEvent('player', `${player.name} purchased ${card.name || 'a card'} for ${card.points} victory points!`);
    
    // Move card to discarded pile
    gameState.cards.discarded.push(card);
    gameState.cards.displayed.splice(cardIndex, 1);
    
    // Draw a new card
    if (gameState.cards.deck.length > 0) {
        drawCards(1);
    }
    
    // Update UI
    updateUI();
}

// Expose functions to the global scope for HTML interaction
window.startGame = startGame;
window.stopGame = stopGame;
window.rollDice = rollDice;
window.endTurn = endTurn;
window.toggleDiceSelection = toggleDiceSelection;
window.logGameEvent = logGameEvent;

function updatePurchasedCardsDisplay() {
    // For each player
    for (let i = 0; i < 2; i++) {
        const player = gameState.players[i];
        const container = document.getElementById(`player${i+1}-purchased-cards`);
        
        if (!container) {
            console.error(`Container for player ${i+1} cards not found`);
            continue;
        }
        
        // Clear the container
        container.innerHTML = '';
        
        // Add thumbnails for each purchased card
        if (player.purchasedCards && player.purchasedCards.length > 0) {
            player.purchasedCards.forEach((card, idx) => {
                const thumbnail = document.createElement('div');
                thumbnail.classList.add('card-thumbnail', `card-${card.type}`);
                
                // Points badge inside the thumbnail
                const pointsBadge = document.createElement('div');
                pointsBadge.classList.add('points-badge');
                pointsBadge.textContent = card.points;
                thumbnail.appendChild(pointsBadge);
                
                // Create preview container as a separate element
                const previewContainer = document.createElement('div');
                previewContainer.classList.add('card-preview-container');
                
                // Create the full card preview
                const preview = document.createElement('div');
                preview.classList.add('card-preview', `card-${card.type}`);
                
                // Card content
                preview.innerHTML = `
                    <div class="card-header">
                        <div class="card-points">${card.points}</div>
                        <h4 class="card-name">${card.name || 'Mystery Card'}</h4>
                    </div>
                    <div class="card-cost">
                        ${renderCardCost(card.cost)}
                    </div>
                    <div class="card-type">${card.type}</div>
                `;
                
                // Add preview to container, container to thumbnail
                previewContainer.appendChild(preview);
                thumbnail.appendChild(previewContainer);
                
                // Add finished thumbnail to player's cards container
                container.appendChild(thumbnail);
            });
        } else {
            // If no cards, show message
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('empty-cards-message');
            emptyMessage.textContent = 'No cards yet';
            container.appendChild(emptyMessage);
        }
    }
}

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
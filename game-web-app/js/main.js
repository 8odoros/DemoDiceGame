//To run the server:
//npm install -g http-server
//http-server -p 8008
//http://localhost:8008/Documents/GitHub/DemoDiceGame/game-web-app/index.html

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
    
    // Log game start
    logGameEvent('system', 'Game started!');
    
    // REMOVED: Auto-roll for first player
    // Now player must click the roll button explicitly
}

function calculateScore() {
    const currentPlayer = getCurrentPlayer();
    const opposingPlayer = gameState.players[1 - gameState.currentPlayerIndex];
    
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
    
    // 4s: If there's at least one 4, player gets a green gem
    const fourGreenGems = counts[4] > 0 ? 1 : 0;
    currentPlayer.gems.green += fourGreenGems;
    
    // 5s: Progressive rewards based on count
    let fivesRedGems = 0;
    let fivesBlueGems = 0;
    let fivesGreenGems = 0;
    let fivesPurpleGems = 0;
    
        // Award gems based on how many 5s were rolled
        if (counts[5] === 4) {
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
    
    // 6s: Player whot wins the round earns a purple gem
    // (Already handled in endRound function)
    
    // Update total gem counts for logging
    let totalRedGems = redGems + fivesRedGems;     // Changed from const to let
    let totalBlueGems = blueGems + fivesBlueGems;
    let totalGreenGems = greenGems + fivesGreenGems + fourGreenGems;
    let totalPurpleGems = fivesPurpleGems;
    
    // Apply bonus card effects
    const bonusGems = applyBonusCardEffects(currentPlayer, opposingPlayer, counts);
    if (bonusGems ) {
        logGameEvent('player', 'Gems earned from bonus ards: '+bonusGems.red+' red, '+bonusGems.blue+' blue, '+bonusGems.green+' green, '+bonusGems.purple+' purple.');
    }

    // Add bonus gems to total counts
    for (const [gemType, count] of Object.entries(bonusGems)) {
        if (gemType === 'red') totalRedGems += count;
        else if (gemType === 'blue') totalBlueGems += count;
        else if (gemType === 'green') totalGreenGems += count;
        else if (gemType === 'purple') totalPurpleGems += count;
        
        // Add to player's gem count
        currentPlayer.gems[gemType] += count;
    }
    
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

// Function to apply bonus card effects
function applyBonusCardEffects(player, opponent, diceCounts) {
    const bonusGems = { red: 0, blue: 0, green: 0, purple: 0 };
    
    // If player has no bonus cards, return empty bonus
    if (!player.bonusCards || player.bonusCards.length === 0) {
        return bonusGems;
    }
    
    // Apply each bonus card effect
    player.bonusCards.forEach(card => {
        const effect = getBonusCardEffect(card.bonusType);
        if (effect) {
            const result = effect(diceCounts, player, opponent);
            if (result) {
                // Log the bonus
                logGameEvent('bonus', `${player.name}'s "${card.name}" activated: ${card.description}`);
                
                // Add result to bonus gems
                for (const [gemType, count] of Object.entries(result)) {
                    bonusGems[gemType] += count;
                }
            }
        }
    });
    
    return bonusGems;
}

// Helper to get the effect function for a bonus card type
function getBonusCardEffect(bonusType) {
    const card = bonusCardTypes.find(c => c.id === bonusType);
    return card ? card.effect : null;
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
    updateBonusCardsDisplay();
    
    // Update player cards display (regular and bonus)
    updatePurchasedCardsDisplay();
    
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

// Function to update the display of purchased bonus cards
function updatePurchasedBonusCardsDisplay() {
    for (let i = 0; i < 2; i++) {
        const player = gameState.players[i];
        const container = document.getElementById(`player${i+1}-purchased-cards`);
        
        if (!container) continue;
        
        // Skip if we've already added standard cards
        const bonusStart = container.querySelectorAll('.card-thumbnail').length;
        
        // Add bonus card thumbnails
        if (player.bonusCards && player.bonusCards.length > 0) {
            player.bonusCards.forEach((card, idx) => {
                const thumbnail = document.createElement('div');
                thumbnail.classList.add('card-thumbnail', 'bonus-card-thumbnail');
                
                // Points badge
                const pointsBadge = document.createElement('div');
                pointsBadge.classList.add('points-badge');
                pointsBadge.textContent = card.points;
                thumbnail.appendChild(pointsBadge);
                
                // Bonus indicator
                const bonusIndicator = document.createElement('div');
                bonusIndicator.classList.add('bonus-indicator');
                bonusIndicator.textContent = 'B';
                thumbnail.appendChild(bonusIndicator);
                
                // Create preview
                const previewContainer = document.createElement('div');
                previewContainer.classList.add('card-preview-container');
                
                const preview = document.createElement('div');
                preview.classList.add('card-preview', 'bonus-card');
                
                preview.innerHTML = `
                    <div class="card-header">
                        <div class="card-points">${card.points}</div>
                        <h4 class="card-name">${card.name}</h4>
                    </div>
                    <div class="card-description">${card.description}</div>
                    <div class="card-cost">
                        ${renderCardCost(card.cost)}
                    </div>
                    <div class="card-type">Bonus</div>
                `;
                
                previewContainer.appendChild(preview);
                thumbnail.appendChild(previewContainer);
                
                container.appendChild(thumbnail);
            });
        }
    }
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

// Add this function to parse CSV data
function parseCSV(csvText) {
    const rows = csvText.trim().split('\n');
    const headers = rows.shift().split(';');
    return rows.map(row => {
        const values = row.split(';');
        const card = headers.reduce((acc, header, index) => {
            acc[header.trim()] = isNaN(values[index]) ? values[index].trim() : parseInt(values[index], 10);
            return acc;
        }, {});
        // Combine cost columns into a single object
        card.cost = {
            red: card.cost_red || 0,
            blue: card.cost_blue || 0,
            green: card.cost_green || 0,
            purple: card.cost_purple || 0
        };

        card.type = card.type || 'regular'; // Default to 'regular' if type is not specified
        
        // Remove individual cost columns
        delete card.cost_red;
        delete card.cost_blue;
        delete card.cost_green;
        delete card.cost_purple;
        return card;
    });
}

// Add this function to load cards from a CSV file
async function loadCardsFromCSV(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error(`Error loading cards from ${filePath}:`, error);
        return [];
    }
}

// Update the startGame function to load cards from CSV files
async function startGame() {
    // Reset game state
    gameState = {
        players: [
            { 
                name: "Alice", 
                gems: { red: 0, blue: 0, green: 0, purple: 0 }, 
                sixes: 0,
                purchasedCards: [],
                bonusCards: []
            },
            { 
                name: "Bob", 
                gems: { red: 0, blue: 0, green: 0, purple: 0 }, 
                sixes: 0,
                purchasedCards: [],
                bonusCards: []
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

    // Load cards from CSV files
    const bonus_Cards = await loadCardsFromCSV('assets/bonus_cards.csv');
    const market_Cards = await loadCardsFromCSV('assets/market_cards.csv');

    // Initialize the card decks
    gameState.cards.deck = shuffleDeck(market_Cards);
    gameState.bonusCards = {
        deck: shuffleDeck(bonus_Cards),
        displayed: [],
        discarded: []
    };

    // Set game as running
    gameRunning = true;

    // Clear history
    const historyEl = document.getElementById('game-history');
    historyEl.innerHTML = '';

    // Remove redundant UI elements
    cleanupRedundantElements();

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

    // Draw initial regular cards
    drawCards(5);

    // Draw initial bonus cards
    drawBonusCards(5);

    // Update UI to show the cards
    updateUI();
}

// Define bonus card types with proper effect implementations
const bonusCardTypes = [
    {
        id: "ones_bonus",
        name: "1s Enhancer",
        description: "If you roll more than 2 ones, get a blue gem",
        cost: { red: 2, blue: 0, green: 0, purple: 0 },
        points: 1,
        effect: function(diceCounts) {
            return diceCounts[1] > 2 ? { blue: 1 } : null;
        }
    },
    {
        id: "no_low_numbers",
        name: "High Roller",
        description: "If no 1s and no 2s are rolled, get a green gem",
        cost: { red: 1, blue: 1, green: 0, purple: 0 },
        points: 1,
        effect: function(diceCounts) {
            return (diceCounts[1] === 0 && diceCounts[2] === 0) ? { green: 1 } : null;
        }
    },
    {
        id: "all_numbers",
        name: "Collector",
        description: "Get a purple gem if all numbers 1-6 are rolled",
        cost: { red: 1, blue: 1, green: 1, purple: 0 },
        points: 2,
        effect: function(diceCounts) {
            return (diceCounts[1] > 0 && diceCounts[2] > 0 && counts[3] > 0 && 
                   counts[4] > 0 && counts[5] > 0 && counts[6] > 0) ? 
                   { purple: 1 } : null;
        }
    },
    {
        id: "most_sixes_bonus",
        name: "Sixes Reward",
        description: "If you have the most 6s, also get a red gem",
        cost: { red: 0, blue: 0, green: 1, purple: 0 },
        points: 1,
        effect: function(diceCounts, player, opponent) {
            return (player.sixes > opponent.sixes) ? { red: 1 } : null;
        }
    },
    {
        id: "double_fives",
        name: "Five's Friend",
        description: "If you roll exactly two 5s, get a blue gem",
        cost: { red: 1, blue: 0, green: 1, purple: 0 },
        points: 1,
        effect: function(diceCounts) {
            return diceCounts[5] === 2 ? { blue: 1 } : null;
        }
    },
    {
        id: "threes_bonus",
        name: "Thirds Time",
        description: "If you roll 2 or 4 threes, get a red gem",
        cost: { red: 0, blue: 2, green: 0, purple: 0 },
        points: 1,
        effect: function(diceCounts) {
            return (diceCounts[3] === 2 || diceCounts[3] === 4) ? { red: 1 } : null;
        }
    },
    {
        id: "run_of_three",
        name: "Mini Straight", 
        description: "If you roll 3 consecutive numbers, get a green gem",
        cost: { red: 2, blue: 0, green: 0, purple: 0 },
        points: 1,
        effect: function(diceCounts) {
            for (let i = 1; i <= 4; i++) {
                if (diceCounts[i] > 0 && diceCounts[i+1] > 0 && diceCounts[i+2] > 0) {
                    return { green: 1 };
                }
            }
            return null;
        }
    },
    {
        id: "four_of_kind",
        name: "Four Finder",
        description: "If you roll 4 of any number, get a purple gem",
        cost: { red: 0, blue: 1, green: 1, purple: 0 },
        points: 2,
        effect: function(diceCounts) {
            for (let i = 1; i <= 6; i++) {
                if (diceCounts[i] >= 4) {
                    return { purple: 1 };
                }
            }
            return null;
        }
    }
];

// Draw bonus cards function
function drawBonusCards(count) {
    const cardsToDisplay = Math.min(count, gameState.bonusCards.deck.length);
    
    for (let i = 0; i < cardsToDisplay; i++) {
        if (gameState.bonusCards.deck.length > 0) {
            gameState.bonusCards.displayed.push(gameState.bonusCards.deck.pop());
        }
    }
    
    updateBonusCardsDisplay();
}

// Display bonus cards
function updateBonusCardsDisplay() {
    // Add safety check to prevent errors
    if (!gameState.bonusCards || !gameState.bonusCards.displayed) {
        console.log("Bonus cards not yet initialized, skipping display update");
        return;
    }
    
    const bonusCardDisplay = document.querySelector('.bonus-card-display');
    if (!bonusCardDisplay) {
        console.error("Bonus card display container not found!");
        return;
    }
    
    bonusCardDisplay.innerHTML = '';
    
    gameState.bonusCards.displayed.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', 'bonus-card');
        cardElement.dataset.index = index;
        
        // Check if current player can afford this card
        const canAfford = canPlayerAffordCard(gameState.currentPlayerIndex, card);
        if (!canAfford) {
            cardElement.classList.add('unavailable');
        }
        
        // Card content
        cardElement.innerHTML = `
            <div class="card-header">
                <div class="card-points">${card.points}</div>
                <h4 class="card-name">${card.name}</h4>
            </div>
            <div class="card-description">${card.description}</div>
            <div class="card-cost">
                ${renderCardCost(card.cost)}
            </div>
            <div class="card-type">Bonus</div>
        `;
        
        // Add click handler for card purchase
        cardElement.addEventListener('click', () => {
                purchaseBonusCard(index);
        });
        
        bonusCardDisplay.appendChild(cardElement);
    });
}

// Enhanced purchaseBonusCard function with debugging
function purchaseBonusCard(index) {
    console.log(`Attempting to purchase bonus card at index ${index}`);
    
    const card = gameState.bonusCards.displayed[index];
    console.log("Card to purchase:", card);
    
    const player = gameState.players[gameState.currentPlayerIndex];
    console.log("Player attempting to purchase:", player);
    
    // Check if player can afford card
    const canAfford = canPlayerAffordCard(gameState.currentPlayerIndex, card);
    console.log(`Player can afford card: ${canAfford}`);
    
    if (!canAfford) {
        console.log("Player doesn't have enough gems");
        showNotification("You don't have enough gems to purchase this card!");
        return;
    }
    
    console.log("Proceeding with purchase...");
    
    // Initialize bonusCards array if needed
    if (!player.bonusCards) {
        player.bonusCards = [];
    }
    
    // Deduct gems
    for (const [gemType, count] of Object.entries(card.cost)) {
        player.gems[gemType] -= count;
        console.log(`Deducted ${count} ${gemType} gems. Player now has ${player.gems[gemType]}`);
    }
    
    // Add victory points
    gameState.victoryPoints[gameState.currentPlayerIndex] += card.points;
    console.log(`Added ${card.points} victory points. Player now has ${gameState.victoryPoints[gameState.currentPlayerIndex]}`);
    
    // Add to player's bonus cards collection
    player.bonusCards.push({...card});
    console.log(`Added card to player's bonus cards. Player now has ${player.bonusCards.length} bonus cards`);
    
    // Log purchase
    logGameEvent('player', `${player.name} purchased ${card.name} (${card.description})`);
    
    // Move card to discarded pile
    gameState.bonusCards.discarded.push(card);
    gameState.bonusCards.displayed.splice(index, 1);
    
    // Draw a new card
    if (gameState.bonusCards.deck.length > 0) {
        console.log(`Drawing a new bonus card from deck (${gameState.bonusCards.deck.length} cards remaining)`);
        drawBonusCards(1);
    }
    
    // Update UI
    updateUI();
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
    const gemEntries = Object.entries(cost).filter(([_, count]) => count > 0);

    // Calculate total gems required
    const totalGems = gemEntries.reduce((sum, [_, count]) => sum + count, 0);

    // Create a gem container
    html += '<div class="gem-requirements-container">';

    // If total gems are 3 or more, split into two rows
    if (totalGems >= 3) {
        let row1 = '';
        let row2 = '';
        let currentRow = 1;
        let gemsInRow = 0;

        gemEntries.forEach(([gemType, count]) => {
            for (let i = 0; i < count; i++) {
                const gemHtml = `
                    <div class="gem-requirement">
                        <div class="gem-requirement-icon gem-requirement-${gemType}"></div>
                    </div>
                `;

                if (currentRow === 1) {
                    row1 += gemHtml;
                    gemsInRow++;
                    if (gemsInRow >= Math.ceil(totalGems / 2)) {
                        currentRow = 2;
                        gemsInRow = 0;
                    }
                } else {
                    row2 += gemHtml;
                }
            }
        });

        // Add rows to the container
        html += `<div class="gem-row">${row1}</div>`;
        html += `<div class="gem-row">${row2}</div>`;
    } else {
        // Single row for fewer than 3 gems
        gemEntries.forEach(([gemType, count]) => {
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="gem-requirement">
                        <div class="gem-requirement-icon gem-requirement-${gemType}"></div>
                    </div>
                `;
            }
        });
    }

    html += '</div>'; // Close the container
    return html;
}

// Update regular cards display
function updateCardsDisplay() {
    const cardDisplay = document.querySelector('.card-display');
    if (!cardDisplay) {
        console.error("Card display container not found!");
        return;
    }
    
    cardDisplay.innerHTML = '';
    
    gameState.cards.displayed.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card', `card-${card.type}`);
        cardElement.dataset.index = index;
        
        // Check if current player can afford this card
        const canAfford = canPlayerAffordCard(gameState.currentPlayerIndex, card);
        if (!canAfford) {
            cardElement.classList.add('unavailable');
        }
        
        // Card content
        cardElement.innerHTML = `
            <div class="card-header">
                <span class="card-animal-face">${card.animal_face || ''}</span>
                <div class="card-points">${card.points}</div>
                <h4 class="card-name">${card.name}</h4>
            </div>
            <div class="card-description">${card.description}</div>
            <div class="card-cost">
                ${renderCardCost(card.cost)}
            </div>
            <div class="card-type">Bonus</div>
        `;
        
        // Add click handler for card purchase
        cardElement.addEventListener('click', () => {
                purchaseCard(index);
        });
        
        cardDisplay.appendChild(cardElement);
    });
}

// Check if player can afford a card
function canPlayerAffordCard(player, card) {
    if (!card.cost) {
        console.error('Card cost is undefined:', card);
        return false;
    }
    return Object.entries(card.cost).every(([gemType, cost]) => {
        return gameState.players[player].gems[gemType] >= cost;
    });
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
        
        // Add thumbnails for each regular purchased card
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
        }
        
        // Add thumbnails for each bonus card
        if (player.bonusCards && player.bonusCards.length > 0) {
            player.bonusCards.forEach((card, idx) => {
                const thumbnail = document.createElement('div');
                thumbnail.classList.add('card-thumbnail', 'bonus-card-thumbnail');
                
                // Points badge
                const pointsBadge = document.createElement('div');
                pointsBadge.classList.add('points-badge');
                pointsBadge.textContent = card.points;
                thumbnail.appendChild(pointsBadge);
                
                // Bonus indicator
                const bonusIndicator = document.createElement('div');
                bonusIndicator.classList.add('bonus-indicator');
                bonusIndicator.textContent = 'B';
                bonusIndicator.style.position = 'absolute';
                bonusIndicator.style.top = '2px';
                bonusIndicator.style.left = '2px';
                bonusIndicator.style.fontSize = '10px';
                bonusIndicator.style.color = '#569cd6';
                bonusIndicator.style.fontWeight = 'bold';
                thumbnail.appendChild(bonusIndicator);
                
                // Create preview container
                const previewContainer = document.createElement('div');
                previewContainer.classList.add('card-preview-container');
                
                // Create the preview
                const preview = document.createElement('div');
                preview.classList.add('card-preview', 'bonus-card');
                
                // Preview content
                preview.innerHTML = `
                    <div class="card-header">
                        <div class="card-points">${card.points}</div>
                        <h4 class="card-name">${card.name}</h4>
                    </div>
                    <div class="card-description">${card.description}</div>
                    <div class="card-cost">
                        ${renderCardCost(card.cost)}
                    </div>
                    <div class="card-type">Bonus</div>
                `;
                
                // Add to DOM
                previewContainer.appendChild(preview);
                thumbnail.appendChild(previewContainer);
                container.appendChild(thumbnail);
            });
        }
        
        // If no cards at all, show empty message
        if ((!player.purchasedCards || player.purchasedCards.length === 0) && 
            (!player.bonusCards || player.bonusCards.length === 0)) {
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

// Add this function to remove duplicate UI elements
function cleanupRedundantElements() {
    // Remove duplicate sixes counters
    const sixesCounters = document.querySelectorAll('.sixes-count');
    sixesCounters.forEach(element => {
        element.style.display = 'none';
    });
    
    // Remove duplicate victory points displays
    const victoryPointsDisplays = document.querySelectorAll('.victory-points');
    victoryPointsDisplays.forEach(element => {
        element.style.display = 'none';
    });
}
document.addEventListener('DOMContentLoaded', () => {
    let rollCount = 0;
    const maxRolls = 4; // Increase the maximum number of rolls to 4
    let roundCounter = 1; // Start from round 1
    let gameRunning = false;

    // Initialize UI state
    document.getElementById('roll-btn').style.display = 'none';
    document.getElementById('end-turn-btn').disabled = true;

    // Game audio elements preload
    const diceRollSound = new Audio('assets/audio/dice-roll.mp3');
    const turnEndSound = new Audio('assets/audio/turn-end.mp3');
    const gameStartSound = new Audio('assets/audio/game-start.mp3');

    // Attach event listeners
    document.getElementById('start-game-btn').addEventListener('click', () => {
        startGame();
        console.log("Game started!"); // Debug message

        // Update UI when game starts
        document.getElementById('roll-btn').style.display = 'inline-block';
        document.getElementById('start-game-btn').textContent = 'Restart Game';

        try {
            gameStartSound.play();
        } catch (error) {
            console.log("Sound couldn't play. User may need to interact with page first.");
        }
    });

    document.getElementById('roll-btn').addEventListener('click', () => {
        if (!document.getElementById('roll-btn').disabled) {
            rollDice();
            try {
                diceRollSound.play();
            } catch (error) {
                console.log("Sound couldn't play:", error);
            }
        }
    });

    document.getElementById('end-turn-btn').addEventListener('click', () => {
        endTurn();
        try {
            turnEndSound.play();
        } catch (error) {
            console.log("Sound couldn't play:", error);
        }
    });

    // Allow players to customize their names
    document.querySelectorAll('.player-name').forEach((nameElement, index) => {
        nameElement.addEventListener('click', () => {
            if (!gameRunning) return; // Prevent name changes before game starts

            const newName = prompt(`Enter name for Player ${index + 1}:`,
                gameState?.players?.[index]?.name || `Player ${index + 1}`);

            if (newName && newName.trim() !== '') {
                nameElement.textContent = newName.trim();
                if (gameState && gameState.players && gameState.players[index]) {
                    gameState.players[index].name = newName.trim();
                    updateUI();
                }
            }
        });
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Spacebar to roll dice if roll button is visible and enabled
        if (event.code === 'Space' &&
            document.getElementById('roll-btn').style.display !== 'none' &&
            !document.getElementById('roll-btn').disabled) {
            event.preventDefault(); // Prevent space from scrolling page
            rollDice();
            try { diceRollSound.play(); } catch (e) { }
        }

        // Enter to end turn if end turn button is enabled
        if (event.code === 'Enter' && !document.getElementById('end-turn-btn').disabled) {
            event.preventDefault();
            endTurn();
            try { turnEndSound.play(); } catch (e) { }
        }
    });

    // Function to safely play sounds
    function playSound(src) {
        try {
            const audio = new Audio(src);
            audio.play().catch(e => console.log("Audio couldn't play automatically"));
        } catch (error) {
            console.log("Sound error:", error);
        }
    }

    // Update instructions when user selects dice
    const diceContainer = document.querySelector('.dice-container');
    diceContainer.addEventListener('click', () => {
        if (gameState && gameState.selectedDice && gameState.selectedDice.length > 0) {
            document.getElementById('roll-btn').classList.add('highlight');
            setTimeout(() => {
                document.getElementById('roll-btn').classList.remove('highlight');
            }, 1000);
        }
    });

    function rollDice() {
        if (rollCount < maxRolls) {
            const diceContainer = document.querySelector('.dice-container');
            const diceElements = diceContainer.querySelectorAll('.dice');

            diceElements.forEach(dice => {
                if (dice.classList.contains('selected')) {
                    const newValue = Math.floor(Math.random() * 6) + 1;
                    dice.dataset.value = newValue;
                    dice.textContent = newValue;
                    dice.classList.remove('selected'); // Deselect after rolling
                }
            });

            rollCount++;
            document.getElementById('roll-count').textContent = `Roll ${rollCount} of ${maxRolls}`;
            if (rollCount === 1) {
                document.getElementById('end-turn-btn').classList.remove('hidden'); // Show the "End Turn" button after the first roll
            }
            if (rollCount === maxRolls) {
                endTurn(); // Automatically end turn when max rolls are reached
            }

            // Sort dice in ascending order
            sortDice();
        }
    }

    function endTurn() {
        rollCount = 0;
        document.getElementById('roll-count').textContent = ''; // Clear roll count
        document.getElementById('roll-btn').disabled = true;
        document.getElementById('end-turn-btn').disabled = true;
        // Additional logic to switch turns, update UI, etc.
        addHistoryEntry(`${getCurrentPlayerName()} ended their turn.`);
        switchPlayer();
    }

    function startGame() {
        rollCount = 0;
        roundCounter = 1; // Reset to round 1
        document.getElementById('round-counter').textContent = roundCounter;
        document.getElementById('roll-count').textContent = `Roll ${rollCount + 1} of ${maxRolls}`;
        document.getElementById('roll-btn').disabled = false;
        document.getElementById('end-turn-btn').disabled = false;
        document.getElementById('end-turn-btn').classList.add('hidden'); // Hide the "End Turn" button initially
        createDice(); // Create dice when the game starts
        gameRunning = true;
        addHistoryEntry("Game started.");
    }

    function createDice() {
        const diceContainer = document.querySelector('.dice-container');
        diceContainer.innerHTML = ''; // Clear existing dice

        for (let i = 0; i < 8; i++) { // Create 8 dice
            const dice = document.createElement('div');
            dice.classList.add('dice');
            const value = Math.floor(Math.random() * 6) + 1; // Random value between 1 and 6
            dice.dataset.value = value;
            dice.textContent = value;
            dice.addEventListener('click', () => selectDice(dice)); // Add event listener for selection
            diceContainer.appendChild(dice);
        }

        // Sort dice in ascending order
        sortDice();
    }

    function selectDice(dice) {
        dice.classList.toggle('selected');
    }

    function addHistoryEntry(entry) {
        const historyContainer = document.getElementById('game-history');
        const entryElement = document.createElement('div');
        entryElement.classList.add('history-entry');
        entryElement.textContent = entry;
        historyContainer.prepend(entryElement); // Add new entry at the top
    }

    function getCurrentPlayerName() {
        const currentPlayerElement = document.querySelector('.player-card.active .player-name');
        return currentPlayerElement ? currentPlayerElement.textContent : 'Unknown Player';
    }

    function switchPlayer() {
        const player1 = document.getElementById('player1');
        const player2 = document.getElementById('player2');
        if (player1.classList.contains('active')) {
            player1.classList.remove('active');
            player2.classList.add('active');
            document.getElementById('current-player').textContent = "Bob's Turn";
        } else {
            player2.classList.remove('active');
            player1.classList.add('active');
            document.getElementById('current-player').textContent = "Alice's Turn";
        }
        document.getElementById('roll-btn').disabled = false;
        document.getElementById('end-turn-btn').disabled = true;
    }

    function sortDice() {
        const diceContainer = document.querySelector('.dice-container');
        const diceElements = Array.from(diceContainer.children);

        diceElements.sort((a, b) => a.dataset.value - b.dataset.value);

        diceElements.forEach(dice => diceContainer.appendChild(dice));
    }

    // Call createDice when the game starts
    document.getElementById('start-game-btn').addEventListener('click', startGame);

    // Ensure dice are created on page load for testing
    document.addEventListener('DOMContentLoaded', createDice);
});
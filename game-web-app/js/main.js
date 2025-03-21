document.addEventListener('DOMContentLoaded', () => {
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
        rollDice();
        try {
            diceRollSound.play();
        } catch (error) {
            console.log("Sound couldn't play:", error);
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
            try { diceRollSound.play(); } catch (e) {}
        }
        
        // Enter to end turn if end turn button is enabled
        if (event.code === 'Enter' && !document.getElementById('end-turn-btn').disabled) {
            event.preventDefault();
            endTurn();
            try { turnEndSound.play(); } catch (e) {}
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
});
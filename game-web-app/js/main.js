document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners
    document.getElementById('start-game-btn').addEventListener('click', () => {
        startGame();
        console.log("Game started!"); // Debug message
    });
    
    document.getElementById('roll-btn').addEventListener('click', () => {
        rollDice();
        playSound('assets/audio/dice-roll.mp3');
    });
    
    document.getElementById('end-turn-btn').addEventListener('click', () => {
        endTurn();
        playSound('assets/audio/turn-end.mp3');
    });
    
    // Allow players to customize their names
    document.querySelectorAll('.player-name').forEach((nameElement, index) => {
        nameElement.addEventListener('click', () => {
            const newName = prompt(`Enter name for Player ${index + 1}:`, `Player ${index + 1}`);
            if (newName && newName.trim() !== '') {
                nameElement.textContent = newName.trim();
                window.gameState.players[index].name = newName.trim();
                updateUI();
            }
        });
    });
});
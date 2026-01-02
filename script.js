// Game state variables
let secretWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let board = [];
let keyboard = {};

// DOM elements
const boardElement = document.getElementById('board');
const keyboardElement = document.getElementById('keyboard');
const messageElement = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

// Keyboard layout
const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['BACK', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER']
];

/**
 * Initialize and start the game
 */
function startGame() {
    secretWord = generateRandomWord();
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    board = [];
    keyboard = {};
    
    // Log secret word for testing
    console.log('Secret word:', secretWord);
    
    createBoard();
    createKeyboard();
    
    // Clear any messages
    messageElement.textContent = '';
    messageElement.className = 'message';
}

/**
 * Generate a random word from the valid words list
 * @returns {string} Random 5-letter word in uppercase
 */
function generateRandomWord() {
    const randomIndex = Math.floor(Math.random() * VALID_WORDS.length);
    return VALID_WORDS[randomIndex].toUpperCase();
}

/**
 * Create the 6x5 game board
 */
function createBoard() {
    boardElement.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.setAttribute('data-row', i);
        
        const rowTiles = [];
        
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.setAttribute('data-row', i);
            tile.setAttribute('data-col', j);
            row.appendChild(tile);
            rowTiles.push(tile);
        }
        
        boardElement.appendChild(row);
        board.push(rowTiles);
    }
}

/**
 * Create the on-screen QWERTY keyboard
 */
function createKeyboard() {
    keyboardElement.innerHTML = '';
    
    keys.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';
        
        row.forEach(key => {
            const keyButton = document.createElement('button');
            keyButton.className = 'key';
            keyButton.textContent = key;
            
            if (key === 'ENTER' || key === 'BACK') {
                keyButton.classList.add('wide');
            }
            
            keyButton.addEventListener('click', () => handleKeyPress(key));
            keyboardRow.appendChild(keyButton);
            
            // Store reference to key button
            keyboard[key] = keyButton;
        });
        
        keyboardElement.appendChild(keyboardRow);
    });
}

/**
 * Handle keyboard input (both on-screen and physical)
 * @param {string} key - The key that was pressed
 */
function handleKeyPress(key) {
    if (gameOver) return;
    
    if (key === 'ENTER') {
        if (currentTile === 5) {
            checkGuess();
        }
    } else if (key === 'BACK') {
        if (currentTile > 0) {
            currentTile--;
            const tile = board[currentRow][currentTile];
            tile.textContent = '';
            tile.classList.remove('filled');
        }
    } else {
        if (currentTile < 5) {
            const tile = board[currentRow][currentTile];
            tile.textContent = key;
            tile.classList.add('filled', 'pop');
            
            // Remove pop animation after it completes
            setTimeout(() => {
                tile.classList.remove('pop');
            }, 150);
            
            currentTile++;
        }
    }
}

/**
 * Check if a word exists in the valid words list
 * @param {string} word - The word to validate
 * @returns {boolean} True if word is valid
 */
function isValidWord(word) {
    return VALID_WORDS.includes(word.toLowerCase());
}

/**
 * Show invalid word error message and shake animation
 */
function showInvalidWordMessage() {
    messageElement.textContent = '❌ Word is not in the list';
    messageElement.className = 'message error';
    
    // Add shake animation to current row
    const currentRowElement = boardElement.querySelector(`[data-row="${currentRow}"]`);
    currentRowElement.classList.add('shake');
    
    // Remove shake animation and error message after 1 second
    setTimeout(() => {
        currentRowElement.classList.remove('shake');
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 1000);
}

/**
 * Check the current guess and update tile colors
 */
function checkGuess() {
    const guess = board[currentRow].map(tile => tile.textContent).join('');
    
    // Validate word first
    if (!isValidWord(guess)) {
        showInvalidWordMessage();
        return;
    }
    
    // Create arrays to track letter usage
    const secretLetters = secretWord.split('');
    const guessLetters = guess.split('');
    const tileStatuses = Array(5).fill('');
    
    // First pass: Mark correct letters (green)
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === secretLetters[i]) {
            tileStatuses[i] = 'correct';
            secretLetters[i] = null; // Mark as used
        }
    }
    
    // Second pass: Mark present letters (yellow)
    for (let i = 0; i < 5; i++) {
        if (tileStatuses[i] === '') {
            const letterIndex = secretLetters.indexOf(guessLetters[i]);
            if (letterIndex !== -1) {
                tileStatuses[i] = 'present';
                secretLetters[letterIndex] = null; // Mark as used
            } else {
                tileStatuses[i] = 'absent';
            }
        }
    }
    
    // Animate tiles with flip effect (staggered)
    board[currentRow].forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add('flip');
            
            setTimeout(() => {
                tile.classList.add(tileStatuses[index]);
                tile.classList.remove('flip');
                
                // Update keyboard colors
                updateKeyboard(guessLetters[index], tileStatuses[index]);
            }, 250);
        }, index * 100);
    });
    
    // Check win/lose after animations complete
    setTimeout(() => {
        if (guess === secretWord) {
            handleWin();
        } else if (currentRow === 5) {
            handleLose();
        } else {
            currentRow++;
            currentTile = 0;
        }
    }, 5 * 100 + 500);
}

/**
 * Update keyboard key colors based on guess results
 * @param {string} letter - The letter to update
 * @param {string} status - The status (correct, present, or absent)
 */
function updateKeyboard(letter, status) {
    const key = keyboard[letter];
    if (!key) return;
    
    // Priority: correct > present > absent
    // Don't downgrade a key's status
    if (key.classList.contains('correct')) return;
    if (key.classList.contains('present') && status !== 'correct') return;
    
    key.classList.remove('correct', 'present', 'absent');
    key.classList.add(status);
}

/**
 * Handle win condition
 */
function handleWin() {
    gameOver = true;
    messageElement.textContent = '🎉 You Win!';
    messageElement.className = 'message success';
}

/**
 * Handle lose condition
 */
function handleLose() {
    gameOver = true;
    messageElement.textContent = `❌ Game Over! The word was ${secretWord}`;
    messageElement.className = 'message game-over';
}

/**
 * Restart the game
 */
function restartGame() {
    startGame();
}

// Event listeners
restartBtn.addEventListener('click', restartGame);

// Physical keyboard support
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    const key = e.key.toUpperCase();
    
    if (key === 'ENTER') {
        handleKeyPress('ENTER');
    } else if (key === 'BACKSPACE') {
        handleKeyPress('BACK');
    } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
    }
});

// Start the game when page loads

startGame();

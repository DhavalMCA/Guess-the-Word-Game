// ==============================
// GAME STATE VARIABLES
// ==============================
let secretWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let board = [];
let keyboard = {};

// ==============================
// FILTER WORD LIST (IMPORTANT FIX)
// ==============================
// Keep ONLY 5-letter words
const FIVE_LETTER_WORDS = VALID_WORDS.filter(word => word.length === 5);

// ==============================
// DOM ELEMENTS
// ==============================
const boardElement = document.getElementById('board');
const keyboardElement = document.getElementById('keyboard');
const messageElement = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

// ==============================
// KEYBOARD LAYOUT
// ==============================
const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['BACK', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER']
];

// ==============================
// START GAME
// ==============================
function startGame() {
    secretWord = generateRandomWord();
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    board = [];
    keyboard = {};

    console.log('Secret word:', secretWord); // for testing

    createBoard();
    createKeyboard();

    messageElement.textContent = '';
    messageElement.className = 'message';
}

// ==============================
// RANDOM WORD GENERATOR (FIXED)
// ==============================
function generateRandomWord() {
    const randomIndex = Math.floor(Math.random() * FIVE_LETTER_WORDS.length);
    return FIVE_LETTER_WORDS[randomIndex].toUpperCase();
}

// ==============================
// CREATE BOARD (6x5)
// ==============================
function createBoard() {
    boardElement.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.dataset.row = i;

        const rowTiles = [];

        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.row = i;
            tile.dataset.col = j;
            row.appendChild(tile);
            rowTiles.push(tile);
        }

        boardElement.appendChild(row);
        board.push(rowTiles);
    }
}

// ==============================
// CREATE KEYBOARD
// ==============================
function createKeyboard() {
    keyboardElement.innerHTML = '';

    keys.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';

        row.forEach(key => {
            const keyBtn = document.createElement('button');
            keyBtn.textContent = key;
            keyBtn.className = 'key';

            if (key === 'ENTER' || key === 'BACK') {
                keyBtn.classList.add('wide');
            }

            keyBtn.addEventListener('click', () => handleKeyPress(key));
            keyboardRow.appendChild(keyBtn);
            keyboard[key] = keyBtn;
        });

        keyboardElement.appendChild(keyboardRow);
    });
}

// ==============================
// HANDLE KEY PRESS
// ==============================
function handleKeyPress(key) {
    if (gameOver) return;

    if (key === 'ENTER') {
        if (currentTile === 5) checkGuess();
        return;
    }

    if (key === 'BACK') {
        if (currentTile > 0) {
            currentTile--;
            board[currentRow][currentTile].textContent = '';
            board[currentRow][currentTile].classList.remove('filled');
        }
        return;
    }

    if (currentTile < 5) {
        const tile = board[currentRow][currentTile];
        tile.textContent = key;
        tile.classList.add('filled', 'pop');

        setTimeout(() => tile.classList.remove('pop'), 150);
        currentTile++;
    }
}

// ==============================
// VALID WORD CHECK (FIXED)
// ==============================
function isValidWord(word) {
    return FIVE_LETTER_WORDS.includes(word.toLowerCase());
}

// ==============================
// INVALID WORD MESSAGE
// ==============================
function showInvalidWordMessage() {
    messageElement.textContent = '❌ Word not in list';
    messageElement.className = 'message error';

    const rowEl = boardElement.querySelector(`[data-row="${currentRow}"]`);
    rowEl.classList.add('shake');

    setTimeout(() => {
        rowEl.classList.remove('shake');
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 1000);
}

// ==============================
// CHECK GUESS
// ==============================
function checkGuess() {
    const guess = board[currentRow].map(t => t.textContent).join('');

    if (!isValidWord(guess)) {
        showInvalidWordMessage();
        return;
    }

    const secretArr = secretWord.split('');
    const guessArr = guess.split('');
    const status = Array(5).fill('');

    // Correct letters
    for (let i = 0; i < 5; i++) {
        if (guessArr[i] === secretArr[i]) {
            status[i] = 'correct';
            secretArr[i] = null;
        }
    }

    // Present / absent letters
    for (let i = 0; i < 5; i++) {
        if (!status[i]) {
            const idx = secretArr.indexOf(guessArr[i]);
            if (idx !== -1) {
                status[i] = 'present';
                secretArr[idx] = null;
            } else {
                status[i] = 'absent';
            }
        }
    }

    board[currentRow].forEach((tile, i) => {
        setTimeout(() => {
            tile.classList.add('flip');

            setTimeout(() => {
                tile.classList.add(status[i]);
                tile.classList.remove('flip');
                updateKeyboard(guessArr[i], status[i]);
            }, 250);
        }, i * 100);
    });

    setTimeout(() => {
        if (guess === secretWord) {
            handleWin();
        } else if (currentRow === 5) {
            handleLose();
        } else {
            currentRow++;
            currentTile = 0;
        }
    }, 1000);
}

// ==============================
// UPDATE KEYBOARD COLORS
// ==============================
function updateKeyboard(letter, status) {
    const key = keyboard[letter];
    if (!key) return;

    if (key.classList.contains('correct')) return;
    if (key.classList.contains('present') && status !== 'correct') return;

    key.classList.remove('correct', 'present', 'absent');
    key.classList.add(status);
}

// ==============================
// WIN / LOSE
// ==============================
function handleWin() {
    gameOver = true;
    messageElement.textContent = '🎉 You Win!';
    messageElement.className = 'message success';
}

function handleLose() {
    gameOver = true;
    messageElement.textContent = `❌ Game Over! Word was ${secretWord}`;
    messageElement.className = 'message game-over';
}

// ==============================
// RESTART
// ==============================
restartBtn.addEventListener('click', startGame);

// ==============================
// PHYSICAL KEYBOARD SUPPORT
// ==============================
document.addEventListener('keydown', e => {
    if (gameOver) return;

    const key = e.key.toUpperCase();

    if (key === 'ENTER') handleKeyPress('ENTER');
    else if (key === 'BACKSPACE') handleKeyPress('BACK');
    else if (/^[A-Z]$/.test(key)) handleKeyPress(key);
});

// ==============================
// INIT
// ==============================
startGame();

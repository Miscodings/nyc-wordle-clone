const tileDisplay = document.querySelector('.tile-container');
const keyboardDisplay = document.querySelector('.key-container');
const messageDisplay = document.querySelector('#message-container');

// nyc themed answers
const nycWords = [
    "BRONX", "BAGEL", "PIZZA", "FERRY", "TRAIN", 
    "METRO", "TIMES", "BROAD", "STOOP", "SLICE", 
    "TAXIS", "APPLE", "UNION", "GRAND", "TOKEN", 
    "RIVER", "PARKS", "TRACK", "LOCAL", "RATTY",
    "BODGA", "KINGS", "QUEEN", "MANHA" 
];

// we will fetch valid english words into this Set
let validWords = new Set(nycWords); 

// standard wordle dictionary vvv
fetch('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words')
    .then(response => response.text())
    .then(text => {
        const words = text.toUpperCase().split('\n');
        words.forEach(word => validWords.add(word));
        console.log("Dictionary loaded:", validWords.size, "words");
    })
    .catch(err => {
        console.error("Error loading dictionary, using fallback.");
        // fallback: if internet fails, at least allow the nyc words + some basics
    });


// random word!!
const wordle = nycWords[Math.floor(Math.random() * nycWords.length)];
console.log("Debug: The word is " + wordle);

const keys = [
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
    'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<<'
];

const guessRows = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', '']
];

let currentRow = 0;
let currentTile = 0;
let isGameOver = false;

// initialize board
guessRows.forEach((guessRow, guessRowIndex) => {
    const rowElement = document.createElement('div');
    rowElement.setAttribute('id', 'guessRow-' + guessRowIndex);
    rowElement.classList.add('tile-row');
    
    guessRow.forEach((guess, guessIndex) => {
        const tileElement = document.createElement('div');
        tileElement.setAttribute('id', 'guessRow-' + guessRowIndex + '-tile-' + guessIndex);
        tileElement.classList.add('tile');
        rowElement.append(tileElement);
    });
    tileDisplay.append(rowElement);
});

// initialize keyboard
const rows = [
    keys.slice(0, 10),
    keys.slice(10, 19),
    keys.slice(19)
];

rows.forEach(rowKeys => {
    const rowElement = document.createElement('div');
    rowElement.classList.add('key-row');
    
    rowKeys.forEach(key => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = key;
        buttonElement.setAttribute('id', key);
        buttonElement.addEventListener('click', () => handleClick(key));
        buttonElement.classList.add('key');
        if (key === 'ENTER' || key === '<<') {
            buttonElement.classList.add('key-wide');
        }
        rowElement.append(buttonElement);
    });
    keyboardDisplay.append(rowElement);
});

document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    
    let key = e.key.toUpperCase();
    if (key === 'ENTER') {
        handleClick('ENTER');
    } else if (key === 'BACKSPACE') {
        handleClick('<<');
    } else if (/^[A-Z]$/.test(key)) {
        handleClick(key);
    }
});

const handleClick = (key) => {
    if (isGameOver) return;

    if (key === '<<') {
        deleteLetter();
        return;
    }
    if (key === 'ENTER') {
        checkRow();
        return;
    }
    addLetter(key);
};

const addLetter = (letter) => {
    if (currentTile < 5 && currentRow < 6) {
        const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
        tile.textContent = letter;
        guessRows[currentRow][currentTile] = letter;
        tile.setAttribute('data', letter);
        tile.classList.add('active');
        currentTile++;
    }
};

const deleteLetter = () => {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
        tile.textContent = '';
        guessRows[currentRow][currentTile] = '';
        tile.classList.remove('active');
        tile.removeAttribute('data');
    }
};

const checkRow = () => {
    const guess = guessRows[currentRow].join('');
    
    if (currentTile > 4) {
        // VALIDATION CHECK
        if (!validWords.has(guess) && !nycWords.includes(guess)) {
            showMessage("Not in word list");
            shakeRow();
            return;
        }

        flipTile();
        
        if (guess === wordle) {
            showMessage('BING BONG! YOU WON!');
            isGameOver = true;
            return;
        } else {
            if (currentRow >= 5) {
                isGameOver = true;
                showMessage('Game Over. Word: ' + wordle);
                return;
            }
            if (currentRow < 5) {
                currentRow++;
                currentTile = 0;
            }
        }
    }
};

const showMessage = (message) => {
    messageDisplay.textContent = message;
    setTimeout(() => {
        messageDisplay.textContent = '';
    }, 2000);
};

const shakeRow = () => {
    const row = document.getElementById('guessRow-' + currentRow);
    row.classList.add('shake');
    setTimeout(() => {
        row.classList.remove('shake');
    }, 500);
};

const flipTile = () => {
    const rowTiles = document.querySelector('#guessRow-' + currentRow).childNodes;
    let checkWordle = wordle;
    const guess = [];

    rowTiles.forEach((tile, index) => {
        guess.push({ letter: tile.getAttribute('data'), color: 'absent-overlay' });
    });

    guess.forEach((guessObj, index) => {
        if (guessObj.letter === wordle[index]) {
            guessObj.color = 'correct';
            checkWordle = checkWordle.replace(guessObj.letter, '');
        }
    });

    guess.forEach((guessObj) => {
        if (guessObj.color !== 'correct') {
            if (checkWordle.includes(guessObj.letter)) {
                guessObj.color = 'present';
                checkWordle = checkWordle.replace(guessObj.letter, '');
            } else {
                guessObj.color = 'absent';
            }
        }
    });

    rowTiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.remove('active');
            tile.classList.add(guess[index].color);
            addColorToKey(guess[index].letter, guess[index].color);
        }, 300 * index);
    });
};

const addColorToKey = (keyLetter, color) => {
    const key = document.getElementById(keyLetter);
    if (key.classList.contains('correct')) return;
    if (key.classList.contains('present') && color !== 'correct') return;

    key.classList.remove('present', 'absent'); 
    key.classList.add(color);
};
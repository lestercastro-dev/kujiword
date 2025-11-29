// --- 1. WORD BANK ---
const wordBank = wordBankData; 

// --- 2. GAME VARIABLES ---
const GRID_SIZE = 12; 
let grid = [];
let activeWords = [];
let currentDirection = 'across'; 

// --- 3. PAGE & THEME LOGIC ---

function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        icon.setAttribute('name', 'moon');
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.setAttribute('name', 'sunny');
    }
}

function startGame() {
    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');
    document.getElementById('home-btn-fixed').classList.remove('hidden');
    document.getElementById('win-modal').classList.add('hidden'); 
    generatePuzzle();
}

function goHome() {
    document.getElementById('game-page').classList.add('hidden');
    document.getElementById('home-btn-fixed').classList.add('hidden');
    document.getElementById('win-modal').classList.add('hidden'); 
    document.getElementById('home-page').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('win-modal').classList.add('hidden');
}

// --- 4. GENERATOR ---

function generatePuzzle() {
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('-'));
    activeWords = [];
    currentDirection = 'across';

    let shuffled = [...wordBank].sort(() => 0.5 - Math.random());
    let count = 0;
    
    for (let i = 0; i < shuffled.length && count < 10; i++) {
        let currentWord = shuffled[i];
        if (currentWord.word.length > GRID_SIZE) continue;

        if (count === 0) {
            let r = Math.floor(GRID_SIZE / 2);
            let c = Math.floor((GRID_SIZE - currentWord.word.length) / 2);
            placeWord(currentWord, r, c, 'across');
            count++;
        } else {
            if (tryToFit(currentWord)) count++;
        }
    }
    renderBoard();
}

function tryToFit(wordObj) {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] !== '-') { 
                for (let i = 0; i < wordObj.word.length; i++) {
                    if (wordObj.word[i] === grid[r][c]) {
                        if (canPlace(wordObj.word, r, c - i, 'across')) {
                            placeWord(wordObj, r, c - i, 'across');
                            return true;
                        }
                        if (canPlace(wordObj.word, r - i, c, 'down')) {
                            placeWord(wordObj, r - i, c, 'down');
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function canPlace(word, r, c, direction) {
    if (r < 0 || c < 0 || r >= GRID_SIZE || c >= GRID_SIZE) return false;
    if (direction === 'across') {
        if (c + word.length > GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
            let cell = grid[r][c + i];
            if (cell !== '-' && cell !== word[i]) return false;
            if (cell === '-') {
                if (r > 0 && grid[r-1][c+i] !== '-') return false;
                if (r < GRID_SIZE-1 && grid[r+1][c+i] !== '-') return false;
            }
        }
        if (c > 0 && grid[r][c-1] !== '-') return false;
        if (c + word.length < GRID_SIZE && grid[r][c+word.length] !== '-') return false;

    } else { 
        if (r + word.length > GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
            let cell = grid[r + i][c];
            if (cell !== '-' && cell !== word[i]) return false;
            if (cell === '-') {
                if (c > 0 && grid[r+i][c-1] !== '-') return false;
                if (c < GRID_SIZE-1 && grid[r+i][c+1] !== '-') return false;
            }
        }
        if (r > 0 && grid[r-1][c] !== '-') return false;
        if (r + word.length < GRID_SIZE && grid[r+word.length][c] !== '-') return false;
    }
    return true;
}

function placeWord(wordObj, r, c, direction) {
    for (let i = 0; i < wordObj.word.length; i++) {
        if (direction === 'across') grid[r][c + i] = wordObj.word[i];
        else grid[r + i][c] = wordObj.word[i];
    }
    activeWords.push({ ...wordObj, row: r, col: c, dir: direction });
}

// --- 5. RENDERER ---

function renderBoard() {
    const board = document.getElementById('crossword-board');
    const acrossList = document.getElementById('across-clues');
    const downList = document.getElementById('down-clues');

    board.innerHTML = '';
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    
    // *** IMPORTANT MOBILE FIX ***
    // We use var(--tile-size) instead of 55px. 
    // This allows CSS to shrink the tiles on mobile.
    board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, var(--tile-size))`;

    activeWords.sort((a,b) => (a.row - b.row) || (a.col - b.col));
    let numCounter = 1;
    let numMap = {};

    activeWords.forEach(w => {
        let key = `${w.row}-${w.col}`;
        if(!numMap[key]) numMap[key] = numCounter++;
        
        let li = document.createElement('li');
        li.innerText = `${numMap[key]}. ${w.clue}`;
        if(w.dir === 'across') acrossList.appendChild(li);
        else downList.appendChild(li);
    });

    for(let r=0; r<GRID_SIZE; r++){
        for(let c=0; c<GRID_SIZE; c++){
            let cell = document.createElement('div');
            cell.className = 'game-cell';
            
            if(grid[r][c] === '-') {
                cell.classList.add('black-square');
            } else {
                let input = document.createElement('input');
                input.maxLength = 1;
                input.dataset.r = r;
                input.dataset.c = c;
                
                input.addEventListener('click', () => handleCellClick(input));
                input.addEventListener('keydown', (e) => handleKeyDown(e, input));
                input.addEventListener('focus', () => highlightActiveWord(r, c));

                cell.appendChild(input);

                if(numMap[`${r}-${c}`]) {
                    let span = document.createElement('span');
                    span.className = 'number-label';
                    span.innerText = numMap[`${r}-${c}`];
                    cell.appendChild(span);
                }
            }
            board.appendChild(cell);
        }
    }
}

// --- 6. INTELLIGENT TYPING ENGINE ---

function handleCellClick(input) {
    const r = parseInt(input.dataset.r);
    const c = parseInt(input.dataset.c);

    let hasHorizontal = false;
    let hasVertical = false;

    if ((c > 0 && grid[r][c-1] !== '-') || (c < GRID_SIZE-1 && grid[r][c+1] !== '-')) {
        hasHorizontal = true;
    }
    if ((r > 0 && grid[r-1][c] !== '-') || (r < GRID_SIZE-1 && grid[r+1][c] !== '-')) {
        hasVertical = true;
    }

    if (hasHorizontal && hasVertical) {
        if (document.activeElement === input) {
            currentDirection = (currentDirection === 'across') ? 'down' : 'across';
        }
    } else if (hasHorizontal) {
        currentDirection = 'across';
    } else if (hasVertical) {
        currentDirection = 'down';
    }

    highlightActiveWord(r, c);
}

function handleKeyDown(e, input) {
    const r = parseInt(input.dataset.r);
    const c = parseInt(input.dataset.c);

    if (e.key === 'ArrowRight') {
        currentDirection = 'across'; moveFocus(r, c, 1, true); 
        highlightActiveWord(r, c); return;
    } else if (e.key === 'ArrowLeft') {
        currentDirection = 'across'; moveFocus(r, c, -1, true);
        highlightActiveWord(r, c); return;
    } else if (e.key === 'ArrowDown') {
        currentDirection = 'down'; moveFocus(r, c, 1, true);
        highlightActiveWord(r, c); return;
    } else if (e.key === 'ArrowUp') {
        currentDirection = 'down'; moveFocus(r, c, -1, true);
        highlightActiveWord(r, c); return;
    }

    if (e.key === 'Backspace') {
        e.preventDefault();
        input.value = '';
        moveFocus(r, c, -1);
        return;
    }

    if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        e.preventDefault(); 
        input.value = e.key.toUpperCase();
        moveFocus(r, c, 1);
        
        input.style.backgroundColor = 'var(--tile-bg)';
        input.style.borderColor = 'var(--tile-border)';
        input.style.color = 'var(--tile-text)';
    }
}

function moveFocus(r, c, offset, forceDirection = false) {
    let nextR = r;
    let nextC = c;

    if (forceDirection) {
        if (currentDirection === 'across') nextC += offset;
        else nextR += offset;
    } else {
        if (currentDirection === 'across') nextC += offset;
        else nextR += offset;
    }

    if (nextR >= 0 && nextR < GRID_SIZE && nextC >= 0 && nextC < GRID_SIZE) {
        const nextInput = document.querySelector(`input[data-r='${nextR}'][data-c='${nextC}']`);
        if (nextInput) {
            nextInput.focus();
            highlightActiveWord(nextR, nextC);
        }
    }
}

function highlightActiveWord(r, c) {
    document.querySelectorAll('input').forEach(i => i.classList.remove('active-word-highlight'));
    
    let cellsToHighlight = [];
    cellsToHighlight.push({r,c});

    if (currentDirection === 'across') {
        let tempC = c - 1;
        while (tempC >= 0 && grid[r][tempC] !== '-') {
            cellsToHighlight.push({r: r, c: tempC});
            tempC--;
        }
        tempC = c + 1;
        while (tempC < GRID_SIZE && grid[r][tempC] !== '-') {
            cellsToHighlight.push({r: r, c: tempC});
            tempC++;
        }
    } else {
        let tempR = r - 1;
        while (tempR >= 0 && grid[tempR][c] !== '-') {
            cellsToHighlight.push({r: tempR, c: c});
            tempR--;
        }
        tempR = r + 1;
        while (tempR < GRID_SIZE && grid[tempR][c] !== '-') {
            cellsToHighlight.push({r: tempR, c: c});
            tempR++;
        }
    }

    cellsToHighlight.forEach(pos => {
        const el = document.querySelector(`input[data-r='${pos.r}'][data-c='${pos.c}']`);
        if(el) el.classList.add('active-word-highlight');
    });
}

function checkAnswers() {
    const inputs = document.querySelectorAll('input');
    document.querySelectorAll('input').forEach(i => i.classList.remove('active-word-highlight'));

    let isPuzzleCompleteAndCorrect = true;

    inputs.forEach(inp => {
        const r = inp.dataset.r;
        const c = inp.dataset.c;
        const val = inp.value.toUpperCase();
        const correctVal = grid[r][c];

        if (val.length > 0) {
            if (val === correctVal) {
                inp.style.backgroundColor = 'var(--correct-bg)';
                inp.style.color = 'var(--correct-text)';
            } else {
                inp.style.backgroundColor = 'var(--wrong-bg)';
                inp.style.color = 'var(--correct-text)';
                isPuzzleCompleteAndCorrect = false;

                setTimeout(() => {
                    inp.style.backgroundColor = 'var(--tile-bg)';
                    inp.style.borderColor = 'var(--tile-border)';
                    inp.style.color = 'var(--tile-text)';
                }, 3000);
            }
        } else {
            isPuzzleCompleteAndCorrect = false;
        }
    });

    if(isPuzzleCompleteAndCorrect) {
        document.getElementById('win-modal').classList.remove('hidden');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('frame');
    const dropButton = document.getElementById('drop-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const scoreDisplay = document.getElementById('score');

    document.addEventListener('dblclick', (event) => {
        event.preventDefault();
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    const FRUIT_SIZE = 40;
    const GRID_COLUMNS = 15;
    const GRID_ROWS = 15;
    const CELL_SIZE = FRUIT_SIZE;
    const FRUITS = ['🍌', '🍎', '🍊'];
    frame.style.width = GRID_COLUMNS * CELL_SIZE + 'px';
    frame.style.height = GRID_ROWS * CELL_SIZE + 'px';

    const columnHeights = Array(GRID_COLUMNS).fill(0);
    const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLUMNS).fill(null));

    let dropColumn = Math.floor(GRID_COLUMNS / 2);
    let dropping = false;
    let currentFruit = spawnFruit();
    let score = 0;

    function updateFruitPosition() {
        currentFruit.style.left = dropColumn * CELL_SIZE + 'px';
    }

    leftButton.addEventListener('click', () => {
        if (dropping) return;
        dropColumn = Math.max(0, dropColumn - 1);
        updateFruitPosition();
    });

    rightButton.addEventListener('click', () => {
        if (dropping) return;
        dropColumn = Math.min(GRID_COLUMNS - 1, dropColumn + 1);
        updateFruitPosition();
    });

    document.addEventListener('keydown', (e) => {
        if (dropping) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            dropColumn = Math.max(0, dropColumn - 1);
            updateFruitPosition();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            dropColumn = Math.min(GRID_COLUMNS - 1, dropColumn + 1);
            updateFruitPosition();
        }
    });

    dropButton.addEventListener('click', () => {
        if (dropping) return;
        if (columnHeights[dropColumn] >= GRID_ROWS) {
            return;
        }
        dropping = true;

        let position = currentFruit.offsetTop || 0;
        let velocity = 0;
        const gravity = 0.5;
        const targetRow = GRID_ROWS - columnHeights[dropColumn] - 1;
        const target = targetRow * CELL_SIZE;

        function fall() {
            velocity += gravity;
            position += velocity;
            if (position >= target) {
                position = target;
                currentFruit.style.top = position + 'px';
                const placedFruit = {
                    element: currentFruit,
                    type: currentFruit.dataset.type,
                    row: targetRow,
                    col: dropColumn,
                };
                grid[targetRow][dropColumn] = placedFruit;
                columnHeights[dropColumn] += 1;
                checkMatches(targetRow, dropColumn);
                currentFruit = spawnFruit();
                dropping = false;
                return;
            }
            currentFruit.style.top = position + 'px';
            requestAnimationFrame(fall);
        }
        requestAnimationFrame(fall);
    });

    function spawnFruit() {
        const fruit = document.createElement('div');
        const type = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        fruit.textContent = type;
        fruit.dataset.type = type;
        fruit.className = 'fruit';
        fruit.style.fontSize = FRUIT_SIZE + 'px';
        fruit.style.lineHeight = FRUIT_SIZE + 'px';
        fruit.style.top = '0px';
        fruit.style.left = dropColumn * CELL_SIZE + 'px';
        frame.appendChild(fruit);
        return fruit;
    }

    function updateScore() {
        scoreDisplay.textContent = `スコア: ${score}`;
    }

    function checkMatches(row, col) {
        const cell = grid[row][col];
        if (!cell) return;

        const matched = new Set();

        function collectMatches(deltaRow, deltaCol) {
            const positions = [{ row, col }];
            let r = row + deltaRow;
            let c = col + deltaCol;

            while (isInside(r, c) && grid[r][c] && grid[r][c].type === cell.type) {
                positions.push({ row: r, col: c });
                r += deltaRow;
                c += deltaCol;
            }

            r = row - deltaRow;
            c = col - deltaCol;

            while (isInside(r, c) && grid[r][c] && grid[r][c].type === cell.type) {
                positions.push({ row: r, col: c });
                r -= deltaRow;
                c -= deltaCol;
            }

            if (positions.length >= 3) {
                positions.forEach(({ row: pr, col: pc }) => {
                    matched.add(`${pr},${pc}`);
                });
            }
        }

        collectMatches(0, 1);
        collectMatches(1, 0);

        if (matched.size === 0) {
            return;
        }

        const cellsToRemove = Array.from(matched).map((key) => {
            const [r, c] = key.split(',').map(Number);
            return { row: r, col: c };
        });

        removeMatches(cellsToRemove);
        score += cellsToRemove.length * 10;
        updateScore();
    }

    function removeMatches(cells) {
        const columnsToCollapse = new Set();

        cells.forEach(({ row, col }) => {
            const cell = grid[row][col];
            if (!cell) return;
            cell.element.remove();
            grid[row][col] = null;
            columnsToCollapse.add(col);
        });

        columnsToCollapse.forEach((col) => {
            collapseColumn(col);
        });
    }

    function collapseColumn(col) {
        let writeRow = GRID_ROWS - 1;
        for (let row = GRID_ROWS - 1; row >= 0; row--) {
            const cell = grid[row][col];
            if (!cell) continue;

            if (row !== writeRow) {
                grid[writeRow][col] = cell;
                grid[row][col] = null;
                cell.row = writeRow;
                cell.element.style.top = writeRow * CELL_SIZE + 'px';
            }
            writeRow--;
        }

        for (let row = writeRow; row >= 0; row--) {
            grid[row][col] = null;
        }

        columnHeights[col] = GRID_ROWS - 1 - writeRow;
    }

    function isInside(row, col) {
        return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLUMNS;
    }
});


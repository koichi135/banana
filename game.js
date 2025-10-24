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

    const GRID_COLUMNS = 15;
    const GRID_ROWS = 15;
    const FRUITS = ['🍌', '🍎', '🍊'];
    const MAX_CELL_SIZE = 40;

    let cellSize = MAX_CELL_SIZE;
    let previousCellSize = cellSize;

    const columnHeights = Array(GRID_COLUMNS).fill(0);
    const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLUMNS).fill(null));

    let dropColumn = Math.floor(GRID_COLUMNS / 2);
    let dropping = false;
    let currentFruit = null;
    let score = 0;

    adjustLayout();
    currentFruit = spawnFruit();

    function updateFruitPosition() {
        if (!currentFruit) return;
        currentFruit.style.left = dropColumn * cellSize + 'px';
        currentFruit.dataset.col = dropColumn;
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
        const gravity = Math.max(0.4, cellSize / 100);
        const targetRow = GRID_ROWS - columnHeights[dropColumn] - 1;
        const target = targetRow * cellSize;

        function fall() {
            velocity += gravity;
            position += velocity;
            if (position >= target) {
                position = target;
                currentFruit.style.top = position + 'px';
                currentFruit.dataset.row = targetRow;
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
                updateFruitPosition();
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
        fruit.style.fontSize = cellSize + 'px';
        fruit.style.lineHeight = cellSize + 'px';
        fruit.style.top = '0px';
        fruit.style.left = dropColumn * cellSize + 'px';
        fruit.dataset.row = -1;
        fruit.dataset.col = dropColumn;
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
                cell.col = col;
                cell.element.dataset.row = writeRow;
                cell.element.dataset.col = col;
                cell.element.style.top = writeRow * cellSize + 'px';
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

    function calculateCellSize() {
        const widthBased = Math.floor((window.innerWidth - 32) / GRID_COLUMNS);
        const heightBasedRaw = Math.floor((window.innerHeight - 260) / GRID_ROWS);
        const heightBased = heightBasedRaw > 0 ? heightBasedRaw : Number.POSITIVE_INFINITY;
        const candidate = Math.min(MAX_CELL_SIZE, widthBased, heightBased);
        if (!Number.isFinite(candidate) || candidate <= 0) {
            return MAX_CELL_SIZE;
        }
        return Math.max(18, candidate);
    }

    function adjustLayout() {
        previousCellSize = cellSize;
        cellSize = calculateCellSize();
        frame.style.width = GRID_COLUMNS * cellSize + 'px';
        frame.style.height = GRID_ROWS * cellSize + 'px';
        frame.style.backgroundSize = `${cellSize}px ${cellSize}px`;

        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLUMNS; col++) {
                const cell = grid[row][col];
                if (!cell) continue;
                cell.element.style.fontSize = cellSize + 'px';
                cell.element.style.lineHeight = cellSize + 'px';
                cell.element.style.left = col * cellSize + 'px';
                cell.element.style.top = row * cellSize + 'px';
                cell.element.dataset.row = row;
                cell.element.dataset.col = col;
            }
        }

        if (currentFruit) {
            currentFruit.style.fontSize = cellSize + 'px';
            currentFruit.style.lineHeight = cellSize + 'px';
            const row = Number(currentFruit.dataset.row);
            if (!Number.isNaN(row) && row >= 0) {
                currentFruit.style.top = row * cellSize + 'px';
            } else {
                const currentTop = parseFloat(currentFruit.style.top);
                if (!Number.isNaN(currentTop)) {
                    const ratio = previousCellSize > 0 ? cellSize / previousCellSize : 1;
                    currentFruit.style.top = currentTop * ratio + 'px';
                }
            }
            updateFruitPosition();
        }
    }

    window.addEventListener('resize', () => {
        adjustLayout();
    });
});


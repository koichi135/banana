document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('frame');
    const scene = document.getElementById('scene');
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

    const GRID_COLUMNS = 6;
    const GRID_ROWS = 12;
    const FRUIT_TYPES = [
        { key: 'banana', emoji: '🍌', scoreValue: 10, matchGroup: 'banana' },
        { key: 'apple', emoji: '🍎', scoreValue: 10, matchGroup: 'apple' },
        { key: 'orange', emoji: '🍊', scoreValue: 10, matchGroup: 'orange' },
    ];
    const SUPER_BANANA = { key: 'super-banana', emoji: '🍌✨', scoreValue: 100, matchGroup: 'banana' };
    const SUPER_BANANA_PROBABILITY = 0.08;
    const MAX_CELL_SIZE = 40;

    let cellSize = MAX_CELL_SIZE;
    let previousCellSize = cellSize;

    const columnHeights = Array(GRID_COLUMNS).fill(0);
    const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLUMNS).fill(null));

    let dropColumn = Math.floor(GRID_COLUMNS / 2);
    let dropping = false;
    let currentFruit = null;
    let score = 0;
    let gameOver = false;

    enable3dTilt();
    adjustLayout();
    currentFruit = spawnFruit();

    function enable3dTilt() {
        if (!scene || !frame) {
            return;
        }

        const maxRotate = 8;

        function applyTilt(clientX, clientY) {
            const rect = scene.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const percentX = (clientX - centerX) / (rect.width / 2);
            const percentY = (clientY - centerY) / (rect.height / 2);
            const rotateY = Math.max(-1, Math.min(1, percentX)) * maxRotate;
            const rotateX = Math.max(-1, Math.min(1, -percentY)) * maxRotate;

            frame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            frame.style.boxShadow = `${-rotateY * 1.2}px ${18 + Math.abs(rotateX)}px 32px rgba(0, 0, 0, 0.45)`;
        }

        function resetTilt() {
            frame.style.transform = 'rotateX(0deg) rotateY(0deg)';
            frame.style.boxShadow = '0 18px 30px rgba(0, 0, 0, 0.4)';
        }

        scene.addEventListener('pointermove', (event) => {
            applyTilt(event.clientX, event.clientY);
        });

        scene.addEventListener('pointerleave', resetTilt);
        resetTilt();
    }

    function updateFruitPosition() {
        if (!currentFruit) return;
        currentFruit.style.left = dropColumn * cellSize + 'px';
        currentFruit.dataset.col = dropColumn;
    }

    leftButton.addEventListener('click', () => {
        if (dropping || gameOver) return;
        dropColumn = Math.max(0, dropColumn - 1);
        updateFruitPosition();
    });

    rightButton.addEventListener('click', () => {
        if (dropping || gameOver) return;
        dropColumn = Math.min(GRID_COLUMNS - 1, dropColumn + 1);
        updateFruitPosition();
    });

    document.addEventListener('keydown', (e) => {
        if (dropping || gameOver) return;
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
        if (dropping || gameOver) return;
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
                const rawScoreValue = Number(currentFruit.dataset.scoreValue);
                const placedFruit = {
                    element: currentFruit,
                    type: currentFruit.dataset.type,
                    variant: currentFruit.dataset.variant,
                    scoreValue: Number.isFinite(rawScoreValue) ? rawScoreValue : 10,
                    row: targetRow,
                    col: dropColumn,
                };
                grid[targetRow][dropColumn] = placedFruit;
                columnHeights[dropColumn] += 1;
                const reachedTop = targetRow === 0;
                checkMatches(targetRow, dropColumn);
                if (gameOver) {
                    return;
                }
                if (reachedTop || isTopRowOccupied()) {
                    handleGameOver();
                    return;
                }
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

    function pickFruitDescriptor() {
        if (Math.random() < SUPER_BANANA_PROBABILITY) {
            return SUPER_BANANA;
        }
        return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    }

    function spawnFruit() {
        if (gameOver) {
            return null;
        }
        const fruit = document.createElement('div');
        const descriptor = pickFruitDescriptor();
        fruit.textContent = descriptor.emoji;
        fruit.dataset.type = descriptor.matchGroup;
        fruit.dataset.variant = descriptor.key;
        fruit.dataset.scoreValue = String(descriptor.scoreValue);
        fruit.className = 'fruit';
        if (descriptor.key === 'super-banana') {
            fruit.classList.add('super-banana');
        }
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

        const visited = new Set();
        const cluster = [];
        const stack = [{ row, col }];

        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.row},${current.col}`;
            if (visited.has(key)) {
                continue;
            }
            visited.add(key);

            const currentCell = grid[current.row][current.col];
            if (!currentCell || currentCell.type !== cell.type) {
                continue;
            }

            cluster.push(current);

            const neighbors = [
                { row: current.row - 1, col: current.col },
                { row: current.row + 1, col: current.col },
                { row: current.row, col: current.col - 1 },
                { row: current.row, col: current.col + 1 },
            ];

            neighbors.forEach((neighbor) => {
                if (!isInside(neighbor.row, neighbor.col)) {
                    return;
                }
                const neighborCell = grid[neighbor.row][neighbor.col];
                if (!neighborCell || neighborCell.type !== cell.type) {
                    return;
                }
                stack.push(neighbor);
            });
        }

        if (cluster.length < 3) {
            return;
        }

        const cellsToRemove = cluster;

        const scoreGain = cellsToRemove.reduce((total, { row: r, col: c }) => {
            const targetCell = grid[r][c];
            if (!targetCell) {
                return total;
            }
            const value = targetCell.scoreValue || (targetCell.variant === 'super-banana' ? 100 : 10);
            return total + value;
        }, 0);

        removeMatches(cellsToRemove);
        score += scoreGain;
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

    function isTopRowOccupied() {
        for (let col = 0; col < GRID_COLUMNS; col++) {
            if (grid[0][col]) {
                return true;
            }
        }
        return false;
    }

    function handleGameOver() {
        if (gameOver) {
            return;
        }
        gameOver = true;
        dropping = false;
        currentFruit = null;
        dropButton.disabled = true;
        leftButton.disabled = true;
        rightButton.disabled = true;
        scoreDisplay.textContent = `ゲームオーバー! スコア: ${score}`;
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


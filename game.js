document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('frame');
    const dropButton = document.getElementById('drop-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const scoreDisplay = document.getElementById('score');

    const FRUIT_SIZE = 40;
    const MOVE_STEP = 25;
    const FRUITS = ['🍌', '🍎', '🍊'];
    let stackHeight = 0;
    let dropX = (frame.clientWidth - FRUIT_SIZE) / 2;
    let dropping = false;
    let currentFruit = spawnFruit();
    const fruits = [];
    let score = 0;

    function updateFruitPosition() {
        currentFruit.style.left = dropX + 'px';
    }

    leftButton.addEventListener('click', () => {
        if (dropping) return;
        dropX = Math.max(0, dropX - MOVE_STEP);
        updateFruitPosition();
    });

    rightButton.addEventListener('click', () => {
        if (dropping) return;
        dropX = Math.min(frame.clientWidth - FRUIT_SIZE, dropX + MOVE_STEP);
        updateFruitPosition();
    });

    document.addEventListener('keydown', (e) => {
        if (dropping) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            dropX = Math.max(0, dropX - MOVE_STEP);
            updateFruitPosition();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            dropX = Math.min(frame.clientWidth - FRUIT_SIZE, dropX + MOVE_STEP);
            updateFruitPosition();
        }
    });

    dropButton.addEventListener('click', () => {
        if (dropping) return;
        dropping = true;

        let position = -FRUIT_SIZE;
        let velocity = 0;
        const gravity = 0.5;
        const target = frame.clientHeight - stackHeight - FRUIT_SIZE;

        function fall() {
            velocity += gravity;
            position += velocity;
            if (position >= target) {
                position = target;
                currentFruit.style.top = position + 'px';
                const landedX = parseFloat(currentFruit.style.left) || 0;
                if (fruits.length > 0) {
                    const lastFruit = fruits[fruits.length - 1];
                    if (Math.abs(lastFruit.x - landedX) < FRUIT_SIZE / 2) {
                        score += 1;
                        updateScore();
                    }
                }
                fruits.push({ element: currentFruit, x: landedX, type: currentFruit.dataset.type });
                stackHeight += FRUIT_SIZE;
                removeMatchingFruits();
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
        fruit.style.top = -FRUIT_SIZE + 'px';
        fruit.style.left = dropX + 'px';
        frame.appendChild(fruit);
        return fruit;
    }

    function updateScore() {
        scoreDisplay.textContent = `スコア: ${score}`;
    }

    function removeMatchingFruits() {
        let removed = false;
        while (fruits.length >= 3) {
            const lastIndex = fruits.length - 1;
            const type = fruits[lastIndex].type;
            if (
                fruits[lastIndex - 1].type === type &&
                fruits[lastIndex - 2].type === type
            ) {
                removeTopFruits(3);
                score += 3;
                removed = true;
            } else {
                break;
            }
        }
        if (removed) {
            updateScore();
        }
    }

    function removeTopFruits(count) {
        for (let i = 0; i < count; i++) {
            const removed = fruits.pop();
            removed.element.remove();
        }
        stackHeight = fruits.length * FRUIT_SIZE;
    }
});


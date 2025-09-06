document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('frame');
    const dropButton = document.getElementById('drop-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');

    const BANANA_SIZE = 40;
    const MOVE_STEP = 10;
    let stackHeight = 0;
    let dropX = (frame.clientWidth - BANANA_SIZE) / 2;
    let dropping = false;
    let currentBanana = spawnBanana();
    let gorilla;

    gorilla = spawnGorilla();

    function updateBananaPosition() {
        currentBanana.style.left = dropX + 'px';
    }

    leftButton.addEventListener('click', () => {
        if (dropping) return;
        dropX = Math.max(0, dropX - MOVE_STEP);
        updateBananaPosition();
    });

    rightButton.addEventListener('click', () => {
        if (dropping) return;
        dropX = Math.min(frame.clientWidth - BANANA_SIZE, dropX + MOVE_STEP);
        updateBananaPosition();
    });

    document.addEventListener('keydown', (e) => {
        if (dropping) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            dropX = Math.max(0, dropX - MOVE_STEP);
            updateBananaPosition();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            dropX = Math.min(frame.clientWidth - BANANA_SIZE, dropX + MOVE_STEP);
            updateBananaPosition();
        }
    });

    dropButton.addEventListener('click', () => {
        if (dropping) return;
        dropping = true;

        let position = -BANANA_SIZE;
        let velocity = 0;
        const gravity = 0.5;
        const target = frame.clientHeight - stackHeight - BANANA_SIZE;

        function fall() {
            velocity += gravity;
            position += velocity;
            if (position >= target) {
                position = target;
                currentBanana.style.top = position + 'px';
                stackHeight += BANANA_SIZE;
                currentBanana = spawnBanana();
                gorilla = spawnGorilla();
                dropping = false;
                return;
            }
            currentBanana.style.top = position + 'px';
            requestAnimationFrame(fall);
        }
        requestAnimationFrame(fall);
    });

    function spawnBanana() {
        const banana = document.createElement('div');
        banana.textContent = '🍌';
        banana.className = 'banana';
        banana.style.fontSize = BANANA_SIZE + 'px';
        banana.style.lineHeight = BANANA_SIZE + 'px';
        banana.style.top = -BANANA_SIZE + 'px';
        banana.style.left = dropX + 'px';
        frame.appendChild(banana);
        return banana;
    }

    function spawnGorilla() {
        if (gorilla) {
            gorilla.remove();
        }
        const g = document.createElement('div');
        g.textContent = '🦍';
        g.className = 'gorilla';
        g.style.fontSize = BANANA_SIZE + 'px';
        g.style.lineHeight = BANANA_SIZE + 'px';
        const maxX = frame.clientWidth - BANANA_SIZE;
        const randomX = Math.floor(Math.random() * (maxX + 1));
        g.style.left = randomX + 'px';
        g.style.top = -BANANA_SIZE + 'px';
        frame.appendChild(g);

        let position = -BANANA_SIZE;
        let velocity = 0;
        const gravity = 0.5;
        const target = frame.clientHeight - BANANA_SIZE;

        function fall() {
            velocity += gravity;
            position += velocity;
            if (position >= target) {
                position = target;
                g.style.top = position + 'px';
                return;
            }
            g.style.top = position + 'px';
            requestAnimationFrame(fall);
        }

        requestAnimationFrame(fall);
        return g;
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('frame');
    const button = document.getElementById('drop-button');

    const BANANA_SIZE = 40;
    let stackHeight = 0;
    let currentBanana = spawnBanana();
    let dropping = false;

    button.addEventListener('click', () => {
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
        frame.appendChild(banana);
        return banana;
    }
});


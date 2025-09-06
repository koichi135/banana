document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('frame');
    const button = document.getElementById('drop-button');

    let stackHeight = 0;
    let bananaHeight = 0;
    let currentBanana = spawnBanana();
    let dropping = false;

    button.addEventListener('click', () => {
        if (dropping) return;
        dropping = true;

        let position = -bananaHeight;
        let velocity = 0;
        const gravity = 0.5;
        const target = frame.clientHeight - stackHeight - bananaHeight;

        function fall() {
            velocity += gravity;
            position += velocity;
            if (position >= target) {
                position = target;
                currentBanana.style.top = position + 'px';
                stackHeight += bananaHeight;
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
        frame.appendChild(banana);
        bananaHeight = banana.getBoundingClientRect().height;
        banana.style.top = -bananaHeight + 'px';
        return banana;
    }
});


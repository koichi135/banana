document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('spawn-banana');
    const container = document.getElementById('banana-container');

    button.addEventListener('click', () => {
        const banana = document.createElement('span');
        banana.textContent = '🍌';
        container.appendChild(banana);
    });
});

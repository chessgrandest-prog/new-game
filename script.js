class GamePortal {
    constructor() {
        this.games = [];
        this.currentGame = null;
        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadGames();
        this.renderGames();
    }

    cacheElements() {
        this.gameList = document.getElementById('gameList');
        this.gameFrameContainer = document.getElementById('gameFrameContainer');
        this.gameFrame = document.getElementById('gameFrame');
        this.backToListBtn = document.getElementById('backToList');
        this.gameTitle = document.getElementById('gameTitle');
        this.gameCategory = document.getElementById('gameCategory');
        this.gameControls = document.getElementById('gameControls');
    }

    bindEvents() {
        this.backToListBtn.addEventListener('click', () => this.showGameList());
    }

    async loadGames() {
        try {
            const response = await fetch('games.json');
            if (!response.ok) throw new Error('Failed to load games');
            this.games = await response.json();
        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Failed to load games. Please try again later.');
        }
    }

    renderGames() {
        if (this.games.length === 0) {
            this.gameList.innerHTML = `
                <div class="loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No games available</p>
                </div>
            `;
            return;
        }

        this.gameList.innerHTML = this.games.map(game => `
            <div class="game-card" data-game-id="${game.id}">
                <img src="${game.image}" alt="${game.title}" class="game-image" loading="lazy">
                <div class="game-content">
                    <span class="game-category">${game.category}</span>
                    <h3>${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="play-button">
                        <i class="fas fa-play"></i> Play Now
                    </div>
                </div>
            </div>
        `).join('');

        // Add click event listeners to game cards
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const gameId = parseInt(card.dataset.gameId);
                const game = this.games.find(g => g.id === gameId);
                if (game) {
                    this.playGame(game);
                }
            });
        });
    }

    playGame(game) {
        this.currentGame = game;
        
        // Update game info
        this.gameTitle.textContent = game.title;
        this.gameCategory.textContent = game.category;
        this.gameControls.textContent = "Click to play • Use arrow keys or mouse";
        
        // Show loading state
        const iframeContainer = this.gameFrame.parentElement;
        iframeContainer.querySelector('.iframe-loading').classList.remove('hidden');
        
        // Load game in iframe
        this.gameFrame.onload = () => {
            iframeContainer.querySelector('.iframe-loading').classList.add('hidden');
        };
        
        this.gameFrame.onerror = () => {
            iframeContainer.querySelector('.iframe-loading').innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load game. Try a different game.</p>
            `;
        };
        
        this.gameFrame.src = game.url;
        
        // Switch views
        this.gameList.classList.add('hidden');
        this.gameFrameContainer.classList.remove('hidden');
        this.backToListBtn.classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showGameList() {
        this.gameList.classList.remove('hidden');
        this.gameFrameContainer.classList.add('hidden');
        this.backToListBtn.classList.add('hidden');
        
        // Clear iframe src to stop any running games
        this.gameFrame.src = '';
        this.currentGame = null;
    }

    showError(message) {
        this.gameList.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize the game portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GamePortal();
});
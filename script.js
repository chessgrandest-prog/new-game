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
        // Event delegation for game cards
        this.gameList.addEventListener('click', (e) => {
            const gameCard = e.target.closest('.game-card');
            if (gameCard) {
                const gameId = parseInt(gameCard.dataset.gameId);
                const game = this.games.find(g => g.id === gameId);
                if (game) {
                    this.playGame(game);
                }
            }
        });

        this.backToListBtn.addEventListener('click', () => this.showGameList());
    }

    async loadGames() {
        try {
            const response = await fetch('games.json');
            if (!response.ok) throw new Error('Failed to load games');
            this.games = await response.json();
            
            // Fix URLs for GitHub raw content
            this.games.forEach(game => {
                // Decode URL-encoded characters
                game.url = decodeURIComponent(game.url);
            });
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
                <div class="image-container">
                    <img 
                        src="${game.image}" 
                        alt="${game.title}" 
                        class="game-image" 
                        loading="lazy"
                        onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 200\"><rect fill=\"%23667eea\" width=\"300\" height=\"200\"/><text fill=\"white\" font-family=\"Arial\" font-size=\"20\" x=\"150\" y=\"100\" text-anchor=\"middle\">${game.title.replace(/[^a-zA-Z0-9 ]/g, '')}</text></svg>'"
                    >
                </div>
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
    }

    async playGame(game) {
        console.log('Loading game:', game.title, 'from:', game.url);
        
        this.currentGame = game;
        
        // Update game info
        this.gameTitle.textContent = game.title;
        this.gameCategory.textContent = game.category;
        this.gameControls.textContent = "Click to play • Use arrow keys or mouse";
        
        // Show loading state
        const iframeContainer = this.gameFrame.parentElement;
        const loadingElement = iframeContainer.querySelector('.iframe-loading');
        loadingElement.classList.remove('hidden');
        
        // Switch views
        this.gameList.classList.add('hidden');
        this.gameFrameContainer.classList.remove('hidden');
        this.backToListBtn.classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Load game in iframe
        try {
            // First, fetch the HTML content to check if it's valid
            console.log('Fetching game from:', game.url);
            
            // Set iframe source after a small delay to ensure view transition
            setTimeout(() => {
                this.gameFrame.src = game.url;
                
                // Set up load and error handlers
                this.gameFrame.onload = () => {
                    console.log('Game loaded successfully');
                    setTimeout(() => {
                        loadingElement.classList.add('hidden');
                    }, 500);
                };
                
                this.gameFrame.onerror = (error) => {
                    console.error('Failed to load game in iframe:', error);
                    loadingElement.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Failed to load game</h3>
                            <p>This game cannot be loaded in an iframe.</p>
                            <p class="small">This is usually because the game's server blocks iframe embedding.</p>
                            <button onclick="window.open('${game.url}', '_blank')" class="btn">
                                <i class="fas fa-external-link-alt"></i> Open in New Tab
                            </button>
                        </div>
                    `;
                };
            }, 300);
            
        } catch (error) {
            console.error('Error loading game:', error);
            loadingElement.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Game</h3>
                    <p>${error.message}</p>
                    <button onclick="window.open('${game.url}', '_blank')" class="btn">
                        <i class="fas fa-external-link-alt"></i> Open in New Tab
                    </button>
                </div>
            `;
        }
    }

    showGameList() {
        // Clear iframe first to stop any running games
        this.gameFrame.src = '';
        
        // Switch views
        this.gameList.classList.remove('hidden');
        this.gameFrameContainer.classList.add('hidden');
        this.backToListBtn.classList.add('hidden');
        
        this.currentGame = null;
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GamePortal();
});
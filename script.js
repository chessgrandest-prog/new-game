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
        // Use event delegation for game cards
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

        // Use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
            this.gameList.innerHTML = this.games.map(game => `
                <div class="game-card" data-game-id="${game.id}">
                    <div class="image-container">
                        <img 
                            src="${game.image}" 
                            alt="${game.title}" 
                            class="game-image" 
                            loading="lazy"
                            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 200%22><rect fill=%22%23667eea%22 width=%22300%22 height=%22200%22/><text fill=%22white%22 font-family=%22Arial%22 font-size=%2220%22 x=%22150%22 y=%22100%22 text-anchor=%22middle%22>${encodeURIComponent(game.title)}</text></svg>'"
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

            // Preload first few images for better UX
            this.preloadImages();
        });
    }

    preloadImages() {
        // Preload first 3 images
        this.games.slice(0, 3).forEach(game => {
            const img = new Image();
            img.src = game.image;
        });
    }

    playGame(game) {
        this.currentGame = game;
        
        // Update game info immediately
        this.gameTitle.textContent = game.title;
        this.gameCategory.textContent = game.category;
        this.gameControls.textContent = "Click to play • Use arrow keys or mouse";
        
        // Use a timeout to ensure smooth transition
        setTimeout(() => {
            this.switchToGameView();
            this.loadGameFrame(game.url);
        }, 100);
    }

    switchToGameView() {
        this.gameList.classList.add('hidden');
        this.gameFrameContainer.classList.remove('hidden');
        this.backToListBtn.classList.remove('hidden');
        
        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    loadGameFrame(url) {
        const iframeContainer = this.gameFrame.parentElement;
        const loadingElement = iframeContainer.querySelector('.iframe-loading');
        
        // Show loading
        loadingElement.classList.remove('hidden');
        
        // Reset and load iframe
        this.gameFrame.src = '';
        
        // Use timeout to ensure smooth loading
        setTimeout(() => {
            this.gameFrame.src = url;
            
            // Hide loading after iframe loads
            this.gameFrame.onload = () => {
                setTimeout(() => {
                    loadingElement.classList.add('hidden');
                }, 300);
            };
            
            this.gameFrame.onerror = () => {
                loadingElement.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load game. The game may not support iframe embedding.</p>
                    <p style="margin-top: 10px; font-size: 0.9em;">Try: <a href="${url}" target="_blank" rel="noopener">Open in new tab</a></p>
                `;
            };
        }, 200);
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
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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

// Initialize with debounce to prevent multiple init
let gamePortalInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    if (!gamePortalInstance) {
        gamePortalInstance = new GamePortal();
    }
});
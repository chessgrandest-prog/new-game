class GamePortal {
    constructor() {
        this.games = [];
        this.currentGame = null;
        this.filteredGames = [];
        this.favorites = new Set();
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.sortBy = 'name-asc';
        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadGames();
        this.loadFavorites();
        this.renderGames();
        this.updateCounters();
    }

    cacheElements() {
        this.gameList = document.getElementById('gameList');
        this.gameFrameContainer = document.getElementById('gameFrameContainer');
        this.gameFrame = document.getElementById('gameFrame');
        this.backToListBtn = document.getElementById('backToList');
        this.gameTitle = document.getElementById('gameTitle');
        this.gameCategory = document.getElementById('gameCategory');
        this.gameControls = document.getElementById('gameControls');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.categoryFilters = document.querySelectorAll('.category-filter');
        this.sortSelect = document.getElementById('sortSelect');
        this.resetFiltersBtn = document.getElementById('resetFilters');
        this.noResults = document.getElementById('noResults');
        this.toggleFavoriteBtn = document.getElementById('toggleFavorite');
        this.backToTopBtn = document.getElementById('backToTop');
        this.gameCount = document.getElementById('gameCount');
        this.favoriteCount = document.getElementById('favoriteCount');
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
            
            // Handle favorite toggle on game cards
            const favoriteIcon = e.target.closest('.favorite-icon');
            if (favoriteIcon) {
                e.stopPropagation();
                const gameId = parseInt(favoriteIcon.closest('.game-card').dataset.gameId);
                this.toggleGameFavorite(gameId);
            }
        });

        this.backToListBtn.addEventListener('click', () => this.showGameList());
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.clearSearchBtn.classList.toggle('hidden', !this.searchTerm);
            this.applyFilters();
        });
        
        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchTerm = '';
            this.clearSearchBtn.classList.add('hidden');
            this.applyFilters();
        });
        
        // Category filters
        this.categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.setCategoryFilter(category);
            });
        });
        
        // Sort functionality
        this.sortSelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFilters();
        });
        
        // Reset filters
        this.resetFiltersBtn.addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Favorite toggle in game view
        this.toggleFavoriteBtn.addEventListener('click', () => {
            if (this.currentGame) {
                this.toggleGameFavorite(this.currentGame.id);
            }
        });
        
        // Back to top button
        this.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Show/hide back to top button on scroll
        window.addEventListener('scroll', () => {
            this.toggleBackToTopButton();
        });
    }

    async loadGames() {
        try {
            const response = await fetch('games.json');
            if (!response.ok) throw new Error('Failed to load games');
            this.games = await response.json();
            
            // Fix URLs for GitHub raw content
            this.games.forEach(game => {
                game.url = decodeURIComponent(game.url);
            });
        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Failed to load games. Please try again later.');
        }
    }

    loadFavorites() {
        const savedFavorites = localStorage.getItem('gamePortalFavorites');
        if (savedFavorites) {
            this.favorites = new Set(JSON.parse(savedFavorites));
        }
    }

    saveFavorites() {
        localStorage.setItem('gamePortalFavorites', JSON.stringify([...this.favorites]));
    }

    toggleGameFavorite(gameId) {
        if (this.favorites.has(gameId)) {
            this.favorites.delete(gameId);
        } else {
            this.favorites.add(gameId);
        }
        
        this.saveFavorites();
        this.updateFavoriteIcons();
        this.updateCounters();
        
        // Update the current game view if open
        if (this.currentGame && this.currentGame.id === gameId) {
            this.updateGameViewFavoriteIcon();
        }
        
        // Re-apply filters if we're in favorites view
        if (this.currentFilter === 'favorites') {
            this.applyFilters();
        }
    }

    updateFavoriteIcons() {
        document.querySelectorAll('.game-card').forEach(card => {
            const gameId = parseInt(card.dataset.gameId);
            const favoriteIcon = card.querySelector('.favorite-icon i');
            if (favoriteIcon) {
                if (this.favorites.has(gameId)) {
                    favoriteIcon.className = 'fas fa-star';
                    favoriteIcon.closest('.favorite-icon').classList.add('active');
                } else {
                    favoriteIcon.className = 'far fa-star';
                    favoriteIcon.closest('.favorite-icon').classList.remove('active');
                }
            }
        });
    }

    updateGameViewFavoriteIcon() {
        if (this.currentGame) {
            const icon = this.toggleFavoriteBtn.querySelector('i');
            if (this.favorites.has(this.currentGame.id)) {
                icon.className = 'fas fa-star';
            } else {
                icon.className = 'far fa-star';
            }
        }
    }

    setCategoryFilter(category) {
        this.currentFilter = category;
        
        // Update active state of category buttons
        this.categoryFilters.forEach(filter => {
            if (filter.dataset.category === category) {
                filter.classList.add('active');
            } else {
                filter.classList.remove('active');
            }
        });
        
        this.applyFilters();
    }

    applyFilters() {
        // Start with all games
        let filtered = [...this.games];
        
        // Apply category filter
        if (this.currentFilter === 'favorites') {
            filtered = filtered.filter(game => this.favorites.has(game.id));
        } else if (this.currentFilter !== 'all') {
            filtered = filtered.filter(game => 
                game.category.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(game => 
                game.title.toLowerCase().includes(this.searchTerm) ||
                game.description.toLowerCase().includes(this.searchTerm) ||
                game.category.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'name-asc':
                    return a.title.localeCompare(b.title);
                case 'name-desc':
                    return b.title.localeCompare(a.title);
                case 'newest':
                    return b.id - a.id;
                case 'oldest':
                    return a.id - b.id;
                default:
                    return 0;
            }
        });
        
        this.filteredGames = filtered;
        this.renderFilteredGames();
    }

    renderFilteredGames() {
        if (this.filteredGames.length === 0) {
            this.gameList.classList.add('hidden');
            this.noResults.classList.remove('hidden');
        } else {
            this.gameList.classList.remove('hidden');
            this.noResults.classList.add('hidden');
            this.renderGames();
        }
        
        this.updateCounters();
    }

    renderGames() {
        if (this.filteredGames.length === 0) return;
        
        this.gameList.innerHTML = this.filteredGames.map(game => `
            <div class="game-card" data-game-id="${game.id}">
                <div class="favorite-icon ${this.favorites.has(game.id) ? 'active' : ''}">
                    <i class="${this.favorites.has(game.id) ? 'fas' : 'far'} fa-star"></i>
                </div>
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

    resetFilters() {
        this.searchInput.value = '';
        this.searchTerm = '';
        this.clearSearchBtn.classList.add('hidden');
        this.setCategoryFilter('all');
        this.sortSelect.value = 'name-asc';
        this.sortBy = 'name-asc';
        this.applyFilters();
    }

    updateCounters() {
        this.gameCount.textContent = this.filteredGames.length;
        this.favoriteCount.textContent = this.favorites.size;
    }

    toggleBackToTopButton() {
        if (window.scrollY > 300) {
            this.backToTopBtn.classList.add('visible');
        } else {
            this.backToTopBtn.classList.remove('visible');
        }
    }

    async playGame(game) {
        console.log('Loading game:', game.title, 'from:', game.url);
        
        this.currentGame = game;
        
        // Update game info
        this.gameTitle.textContent = game.title;
        this.gameCategory.textContent = game.category;
        this.gameControls.textContent = "Click to play • Use arrow keys or mouse";
        
        // Update favorite icon in game view
        this.updateGameViewFavoriteIcon();
        
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
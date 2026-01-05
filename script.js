class GamePortal {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.currentGame = null;
        this.init();
    }

    async init() {
        await this.loadGames();
        this.setupEventListeners();
        this.render();
    }

    async loadGames() {
        try {
            const response = await fetch('games.json');
            this.games = await response.json();
            
            // Fix URLs - decode them properly
            this.games = this.games.map(game => ({
                ...game,
                url: decodeURIComponent(game.url),
                image: game.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect fill="%233498db" width="300" height="200"/><text fill="white" font-family="Arial" font-size="20" x="150" y="100" text-anchor="middle">' + encodeURIComponent(game.title) + '</text></svg>'
            }));
            
            this.filteredGames = [...this.games];
            this.updateFooter(`${this.games.length} games available`);
        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Failed to load games');
        }
    }

    setupEventListeners() {
        // Search input with debounce
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', this.debounce(() => {
            this.filterGames(searchInput.value);
        }, 300));

        // Back button
        document.getElementById('backToList').addEventListener('click', () => {
            this.showGameList();
        });

        // Click handler for game cards using event delegation
        document.getElementById('gameList').addEventListener('click', (e) => {
            const gameCard = e.target.closest('.game-card');
            if (gameCard) {
                const gameId = parseInt(gameCard.dataset.id);
                const game = this.games.find(g => g.id === gameId);
                if (game) {
                    this.playGame(game);
                }
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    filterGames(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredGames = [...this.games];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredGames = this.games.filter(game =>
                game.title.toLowerCase().includes(term) ||
                game.description.toLowerCase().includes(term) ||
                game.category.toLowerCase().includes(term)
            );
        }
        this.renderGames();
    }

    render() {
        this.renderGames();
    }

    renderGames() {
        const gameList = document.getElementById('gameList');
        
        if (this.filteredGames.length === 0) {
            gameList.innerHTML = `
                <div class="loading">
                    <i class="fas fa-search"></i>
                    <p>No games found. Try a different search.</p>
                </div>
            `;
            return;
        }

        gameList.innerHTML = this.filteredGames.map(game => `
            <div class="game-card" data-id="${game.id}">
                <img src="${game.image}" alt="${game.title}" class="game-image" loading="lazy">
                <div class="game-content">
                    <span class="game-category">${game.category}</span>
                    <h3>${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                </div>
            </div>
        `).join('');
    }

    playGame(game) {
        console.log('Loading game:', game);
        this.currentGame = game;
        
        // Update UI
        document.getElementById('gameTitle').textContent = game.title;
        document.getElementById('gameList').classList.add('hidden');
        document.getElementById('gameFrameContainer').classList.remove('hidden');
        
        // Try to load the game with multiple approaches
        this.loadGameWithFallback(game.url);
    }

    async loadGameWithFallback(url) {
        const iframe = document.getElementById('gameFrame');
        
        try {
            // Try direct load first
            iframe.src = url;
            
            // Set a timeout to check if iframe loaded
            setTimeout(() => {
                // If iframe hasn't loaded content, try proxy
                if (!iframe.contentWindow || iframe.contentWindow.document.body.children.length === 0) {
                    console.log('Direct load failed, trying proxy...');
                    this.loadWithProxy(url);
                }
            }, 2000);
            
        } catch (error) {
            console.error('Error loading game:', error);
            this.loadWithProxy(url);
        }
    }

    loadWithProxy(url) {
        const iframe = document.getElementById('gameFrame');
        // Use a CORS proxy for GitHub raw content
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        fetch(proxyUrl)
            .then(response => response.json())
            .then(data => {
                if (data.contents) {
                    // Create a blob URL with the HTML content
                    const blob = new Blob([data.contents], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;
                } else {
                    this.showGameLoadError(url);
                }
            })
            .catch(() => {
                this.showGameLoadError(url);
            });
    }

    showGameLoadError(url) {
        const iframe = document.getElementById('gameFrame');
        iframe.srcdoc = `
            <html>
                <head>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            margin: 0; 
                            background: #f0f0f0; 
                            text-align: center; 
                            padding: 20px;
                        }
                        .error-container {
                            max-width: 500px;
                        }
                        .btn {
                            display: inline-block;
                            margin-top: 20px;
                            padding: 10px 20px;
                            background: #3498db;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h2>Game Loading Issue</h2>
                        <p>This game cannot be loaded directly in the iframe.</p>
                        <p>This is usually because GitHub blocks iframe embedding for raw files.</p>
                        <a href="${url}" target="_blank" class="btn">
                            Click here to open game in new tab
                        </a>
                    </div>
                </body>
            </html>
        `;
    }

    showGameList() {
        // Stop any running game by removing iframe src
        const iframe = document.getElementById('gameFrame');
        iframe.src = '';
        
        // Switch views
        document.getElementById('gameList').classList.remove('hidden');
        document.getElementById('gameFrameContainer').classList.add('hidden');
        this.currentGame = null;
    }

    updateFooter(text) {
        document.getElementById('footerText').textContent = text;
    }

    showError(message) {
        const gameList = document.getElementById('gameList');
        gameList.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    new GamePortal();
});
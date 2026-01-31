// ============================================
// MONAD SUMO BATTLE - MAIN APPLICATION
// ============================================

// Application state
const AppState = {
    currentScreen: 'landing',
    currentGameId: null,
    gameInstance: null,
    mockMode: true, // Mock mode aktif - gerçek blockchain olmadan test edebilirsiniz
    players: [],
    localPlayerId: null,
    inviteParams: null, // Store invite parameters from URL
    autoJoin: false // Auto-join if coming from invite link
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Parse URL parameters for invite links
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenId}-screen`).classList.add('active');
    AppState.currentScreen = screenId;
}

function showLoading(show = true, text = 'Yükleniyor...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = text;
    overlay.classList.toggle('active', show);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function updateStats() {
    // Mock stats for now
    document.getElementById('active-games').textContent = Math.floor(Math.random() * 10) + 1;
    document.getElementById('total-prize').textContent = `${(Math.random() * 100).toFixed(2)} MONAD`;
    document.getElementById('online-players').textContent = Math.floor(Math.random() * 200) + 50;
}

// ============================================
// LANDING SCREEN
// ============================================

async function initLanding() {
    // Check for invite parameters
    const urlParams = getUrlParams();
    if (urlParams.game) {
        AppState.inviteParams = {
            gameId: urlParams.game,
            host: urlParams.host
        };
        AppState.autoJoin = urlParams.join === 'true';

        // Track invite if host is specified
        if (urlParams.host) {
            trackInvite(urlParams.game, urlParams.host);
        }
    }

    updateStats();
    setInterval(updateStats, 5000);

    // Connect wallet button
    document.getElementById('connect-wallet-btn').addEventListener('click', async () => {
        showLoading(true, 'Cüzdan bağlanıyor...');

        if (AppState.mockMode) {
            // Mock wallet connection
            setTimeout(() => {
                const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
                AppState.localPlayerId = mockAddress;
                document.getElementById('wallet-status').textContent = `Bağlı: ${formatAddress(mockAddress)}`;
                document.getElementById('connect-wallet-btn').textContent = '✓ Cüzdan Bağlı';
                document.getElementById('connect-wallet-btn').disabled = true;
                showLoading(false);
                showToast('Cüzdan başarıyla bağlandı!', 'success');

                // Go to lobby
                setTimeout(() => initLobby(), 1000);
            }, 1500);
        } else {
            // Real wallet connection
            const result = await blockchain.connectWallet();
            showLoading(false);

            if (result.success) {
                AppState.localPlayerId = result.address;
                document.getElementById('wallet-status').textContent = `Bağlı: ${formatAddress(result.address)}`;
                document.getElementById('connect-wallet-btn').textContent = '✓ Cüzdan Bağlı';
                document.getElementById('connect-wallet-btn').disabled = true;
                showToast('Cüzdan başarıyla bağlandı!', 'success');

                // Go to lobby
                setTimeout(() => {
                    initLobby();
                    // Auto-join if coming from invite link
                    if (AppState.autoJoin) {
                        setTimeout(() => {
                            document.getElementById('join-game-btn').click();
                        }, 500);
                    }
                }, 1000);
            } else {
                showToast(`Hata: ${result.error}`, 'error');
            }
        }
    });
}

// ============================================
// LOBBY SCREEN
// ============================================

async function initLobby() {
    showScreen('lobby');

    // Initialize game ID (use invite game ID if available)
    AppState.currentGameId = AppState.inviteParams ? AppState.inviteParams.gameId : 1;
    document.getElementById('current-game-id').textContent = AppState.currentGameId;

    // Show invite info if coming from invite link
    if (AppState.inviteParams) {
        showToast(`Oyun #${AppState.currentGameId} davetine katıldınız!`, 'success');
    }

    // Join game button
    document.getElementById('join-game-btn').addEventListener('click', async () => {
        const betAmount = parseFloat(document.getElementById('bet-amount').value);

        if (betAmount <= 0) {
            showToast('Geçerli bir bahis miktarı girin', 'error');
            return;
        }

        showLoading(true, 'Oyuna katılıyor...');

        if (AppState.mockMode) {
            // Mock join
            setTimeout(() => {
                joinGameSuccess(betAmount);
            }, 1500);
        } else {
            // Real blockchain join
            const result = await blockchain.joinGame(AppState.currentGameId, betAmount);
            showLoading(false);

            if (result.success) {
                joinGameSuccess(betAmount);
            } else {
                showToast(`Hata: ${result.error}`, 'error');
            }
        }
    });

    // Start mock player joining simulation
    if (AppState.mockMode) {
        simulatePlayersJoining();
    }
}

function joinGameSuccess(betAmount) {
    showLoading(false);
    showToast('Oyuna katıldınız!', 'success');
    document.getElementById('join-game-btn').disabled = true;
    document.getElementById('bet-amount').disabled = true;

    // Add local player to list
    addPlayerToLobby(AppState.localPlayerId, true);
}

function addPlayerToLobby(address, isLocal = false) {
    const container = document.getElementById('players-container');

    // Check if already added
    if (container.querySelector(`[data-address="${address}"]`)) return;

    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    playerItem.setAttribute('data-address', address);

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.textContent = '🥋';

    const addressText = document.createElement('div');
    addressText.className = 'player-address';
    addressText.textContent = isLocal ? 'Siz' : formatAddress(address);

    playerItem.appendChild(avatar);
    playerItem.appendChild(addressText);
    container.appendChild(playerItem);

    // Update counter
    const playerCount = container.children.length;
    document.getElementById('player-count').textContent = playerCount;

    // Update prize pool
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    const prizePool = (playerCount * betAmount * 0.95).toFixed(3); // 5% fee
    document.getElementById('lobby-prize-pool').textContent = `${prizePool} MONAD`;

    // Check if ready to start
    if (playerCount >= 20) {
        document.getElementById('lobby-status').textContent = 'Oyun başlıyor...';
        setTimeout(() => startGame(), 2000);
    } else {
        document.getElementById('lobby-status').textContent = `${20 - playerCount} oyuncu daha bekleniyor...`;
    }
}

function simulatePlayersJoining() {
    let count = 1; // Start at 1 (local player already joined)
    const interval = setInterval(() => {
        if (count >= 20) {
            clearInterval(interval);
            return;
        }

        const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
        addPlayerToLobby(mockAddress);
        count++;
    }, 800);
}

// ============================================
// GAME SCREEN
// ============================================

function startGame() {
    showScreen('game');
    showLoading(true, 'Oyun yükleniyor...');

    // Prepare player data
    const container = document.getElementById('players-container');
    AppState.players = Array.from(container.children).map(item => ({
        id: item.getAttribute('data-address'),
        address: item.getAttribute('data-address')
    }));

    // Initialize game
    setTimeout(() => {
        initGame();
        showLoading(false);
    }, 1500);
}

function initGame() {
    // Create game instance
    AppState.gameInstance = new SumoGame('game-container');
    AppState.gameInstance.init(AppState.players, AppState.localPlayerId);

    // Set up game callbacks
    AppState.gameInstance.on('onPlayerEliminated', (data) => {
        addEliminationFeed(data.address);
        updateRemainingPlayers();
    });

    AppState.gameInstance.on('onGameEnd', async (data) => {
        await handleGameEnd(data);
    });

    // Initialize UI
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    const prizePool = (AppState.players.length * betAmount * 0.95).toFixed(3);
    document.getElementById('game-prize').textContent = `${prizePool} MONAD`;
    document.getElementById('remaining-players').textContent = AppState.players.length;

    // Start timer
    startGameTimer();
}

function addEliminationFeed(address) {
    const feed = document.getElementById('elimination-feed');
    const item = document.createElement('div');
    item.className = 'elimination-item';
    item.textContent = `💀 ${formatAddress(address)} elendi!`;

    feed.insertBefore(item, feed.firstChild);

    // Remove old items
    if (feed.children.length > 10) {
        feed.lastChild.remove();
    }
}

function updateRemainingPlayers() {
    const alive = Array.from(AppState.gameInstance.players.values()).filter(p => p.isAlive).length;
    document.getElementById('remaining-players').textContent = alive;
}

let gameTimerInterval;
function startGameTimer() {
    let timeLeft = GAME_CONFIG.gameTime;

    gameTimerInterval = setInterval(() => {
        timeLeft--;

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('game-timer').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(gameTimerInterval);
            // Time's up - closest to center wins
            // This would be handled by game logic
        }
    }, 1000);
}

async function handleGameEnd(data) {
    clearInterval(gameTimerInterval);

    // Show winner screen
    setTimeout(() => {
        showWinnerScreen(data.winnerAddress);
    }, 2000);

    // Declare winner on blockchain (if not mock mode)
    if (!AppState.mockMode && data.winnerAddress === AppState.localPlayerId) {
        try {
            await blockchain.declareWinner(AppState.currentGameId, data.winnerAddress);
        } catch (error) {
            console.error('Error declaring winner:', error);
        }
    }
}

// ============================================
// WINNER SCREEN
// ============================================

function showWinnerScreen(winnerAddress) {
    showScreen('winner');

    const isLocalWinner = winnerAddress === AppState.localPlayerId;
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    const prizeAmount = (AppState.players.length * betAmount * 0.95).toFixed(3);

    if (isLocalWinner) {
        document.getElementById('winner-title').textContent = '🎉 Kazandınız! 🎉';
        createConfetti();
    } else {
        document.getElementById('winner-title').textContent = 'Oyun Bitti';
    }

    document.getElementById('winner-address').textContent = formatAddress(winnerAddress);
    document.getElementById('winner-prize').textContent = `${prizeAmount} MONAD`;

    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', () => {
        location.reload();
    });

    // View transaction button
    document.getElementById('view-transaction-btn').addEventListener('click', () => {
        if (!AppState.mockMode) {
            window.open(blockchain.getTxUrl('mock-tx-hash'), '_blank');
        } else {
            showToast('Mock modda işlem yok', 'info');
        }
    });
}

function createConfetti() {
    const confetti = document.querySelector('.confetti');
    const colors = ['#00f0ff', '#ff00ff', '#ffff00', '#00ff88'];

    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.style.position = 'absolute';
        piece.style.width = '10px';
        piece.style.height = '10px';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = Math.random() * 100 + '%';
        piece.style.top = '-10px';
        piece.style.opacity = Math.random();
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;

        confetti.appendChild(piece);

        // Animate
        const duration = 2000 + Math.random() * 2000;
        const delay = Math.random() * 1000;

        setTimeout(() => {
            piece.style.transition = `top ${duration}ms linear, transform ${duration}ms linear`;
            piece.style.top = '100%';
            piece.style.transform = `rotate(${Math.random() * 720}deg)`;

            setTimeout(() => piece.remove(), duration);
        }, delay);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initLanding();
});

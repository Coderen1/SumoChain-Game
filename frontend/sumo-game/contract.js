// ============================================
// MONAD SUMO BATTLE - CONTRACT INTEGRATION
// ============================================

// Contract configuration
const CONTRACT_CONFIG = {
    // TODO: Replace with your deployed contract address after deployment
    // Deploy contract using Remix IDE: https://remix.ethereum.org/
    // Then paste the address here (keep quotes): '0x1234567890abcdef...'
    address: '0x0000000000000000000000000000000000000000', // ⚠️ BURAYA CONTRACT ADRESINIZI YAPIŞTIRIN

    // Monad Testnet configuration
    chainId: 41454, // Monad Testnet
    chainName: 'Monad Testnet',
    rpcUrl: 'https://testnet.monad.xyz',
    blockExplorer: 'https://explorer.testnet.monad.xyz',
    nativeCurrency: {
        name: 'Monad',
        symbol: 'MONAD',
        decimals: 18
    }
};

// Contract ABI (simplified - add full ABI after deployment)
const CONTRACT_ABI = [
    "function createGame(uint256 _betAmount, uint256 _maxPlayers) external returns (uint256)",
    "function joinGame(uint256 _gameId) external payable",
    "function startGame(uint256 _gameId) external",
    "function declareWinner(uint256 _gameId, address _winner) external",
    "function cancelGame(uint256 _gameId, string memory _reason) external",
    "function getGameInfo(uint256 _gameId) external view returns (uint256, uint256, uint256, uint256, uint256, uint8, address)",
    "function getGamePlayers(uint256 _gameId) external view returns (address[])",
    "function hasPlayerJoined(uint256 _gameId, address _player) external view returns (bool)",
    "event GameCreated(uint256 indexed gameId, uint256 betAmount, uint256 maxPlayers)",
    "event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 playerCount)",
    "event GameStarted(uint256 indexed gameId, uint256 playerCount)",
    "event WinnerDeclared(uint256 indexed gameId, address indexed winner, uint256 prizeAmount)"
];

// ============================================
// BLOCKCHAIN MANAGER
// ============================================

class BlockchainManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
    }

    // Connect wallet
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask veya uyumlu bir cüzdan bulunamadı');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.userAddress = accounts[0];

            // Create provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();

            // Check if on correct network
            const network = await this.provider.getNetwork();
            if (network.chainId !== CONTRACT_CONFIG.chainId) {
                await this.switchNetwork();
            }

            // Initialize contract
            this.contract = new ethers.Contract(
                CONTRACT_CONFIG.address,
                CONTRACT_ABI,
                this.signer
            );

            this.isConnected = true;

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.userAddress = accounts[0];
                    window.location.reload();
                }
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            return {
                success: true,
                address: this.userAddress
            };

        } catch (error) {
            console.error('Wallet connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Switch to Monad network
    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}` }],
            });
        } catch (switchError) {
            // Network not added, try to add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}`,
                            chainName: CONTRACT_CONFIG.chainName,
                            nativeCurrency: CONTRACT_CONFIG.nativeCurrency,
                            rpcUrls: [CONTRACT_CONFIG.rpcUrl],
                            blockExplorerUrls: [CONTRACT_CONFIG.blockExplorer]
                        }],
                    });
                } catch (addError) {
                    throw new Error('Monad ağı eklenemedi');
                }
            } else {
                throw switchError;
            }
        }
    }

    // Disconnect wallet
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
    }

    // Get balance
    async getBalance() {
        if (!this.provider || !this.userAddress) return '0';

        try {
            const balance = await this.provider.getBalance(this.userAddress);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }

    // Create a new game
    async createGame(betAmount, maxPlayers = 20) {
        if (!this.contract) throw new Error('Contract not initialized');

        try {
            const betAmountWei = ethers.utils.parseEther(betAmount.toString());
            const tx = await this.contract.createGame(betAmountWei, maxPlayers);
            const receipt = await tx.wait();

            // Extract game ID from event
            const event = receipt.events.find(e => e.event === 'GameCreated');
            const gameId = event.args.gameId.toNumber();

            return {
                success: true,
                gameId,
                txHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error creating game:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Join a game
    async joinGame(gameId, betAmount) {
        if (!this.contract) throw new Error('Contract not initialized');

        try {
            const betAmountWei = ethers.utils.parseEther(betAmount.toString());
            const tx = await this.contract.joinGame(gameId, {
                value: betAmountWei
            });
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error joining game:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get game info
    async getGameInfo(gameId) {
        if (!this.contract) throw new Error('Contract not initialized');

        try {
            const info = await this.contract.getGameInfo(gameId);

            return {
                gameId: info[0].toNumber(),
                betAmount: ethers.utils.formatEther(info[1]),
                maxPlayers: info[2].toNumber(),
                currentPlayers: info[3].toNumber(),
                prizePool: ethers.utils.formatEther(info[4]),
                status: info[5], // 0: Waiting, 1: InProgress, 2: Completed, 3: Cancelled
                winner: info[6]
            };
        } catch (error) {
            console.error('Error getting game info:', error);
            return null;
        }
    }

    // Get game players
    async getGamePlayers(gameId) {
        if (!this.contract) throw new Error('Contract not initialized');

        try {
            const players = await this.contract.getGamePlayers(gameId);
            return players;
        } catch (error) {
            console.error('Error getting players:', error);
            return [];
        }
    }

    // Check if player joined
    async hasPlayerJoined(gameId, playerAddress) {
        if (!this.contract) throw new Error('Contract not initialized');

        try {
            return await this.contract.hasPlayerJoined(gameId, playerAddress);
        } catch (error) {
            console.error('Error checking player:', error);
            return false;
        }
    }

    // Declare winner (only game server)
    async declareWinner(gameId, winnerAddress) {
        if (!this.contract) throw new Error('Contract not initialized');

        try {
            const tx = await this.contract.declareWinner(gameId, winnerAddress);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error declaring winner:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Listen to contract events
    listenToEvents(gameId, callbacks) {
        if (!this.contract) return;

        // Player joined event
        const playerJoinedFilter = this.contract.filters.PlayerJoined(gameId);
        this.contract.on(playerJoinedFilter, (gameId, player, playerCount) => {
            if (callbacks.onPlayerJoined) {
                callbacks.onPlayerJoined({
                    gameId: gameId.toNumber(),
                    player,
                    playerCount: playerCount.toNumber()
                });
            }
        });

        // Game started event
        const gameStartedFilter = this.contract.filters.GameStarted(gameId);
        this.contract.on(gameStartedFilter, (gameId, playerCount) => {
            if (callbacks.onGameStarted) {
                callbacks.onGameStarted({
                    gameId: gameId.toNumber(),
                    playerCount: playerCount.toNumber()
                });
            }
        });

        // Winner declared event
        const winnerDeclaredFilter = this.contract.filters.WinnerDeclared(gameId);
        this.contract.on(winnerDeclaredFilter, (gameId, winner, prizeAmount) => {
            if (callbacks.onWinnerDeclared) {
                callbacks.onWinnerDeclared({
                    gameId: gameId.toNumber(),
                    winner,
                    prizeAmount: ethers.utils.formatEther(prizeAmount)
                });
            }
        });
    }

    // Stop listening to events
    removeAllListeners() {
        if (this.contract) {
            this.contract.removeAllListeners();
        }
    }

    // Format address for display
    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    // Get transaction URL
    getTxUrl(txHash) {
        return `${CONTRACT_CONFIG.blockExplorer}/tx/${txHash}`;
    }
}

// Export singleton instance
const blockchain = new BlockchainManager();

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SumoBattle
 * @dev Battle Royale Sumo Game with betting and prize pool mechanics
 * @notice Players bet tokens to join games, winner takes the entire prize pool
 */
contract SumoBattle {
    
    // ============ State Variables ============
    
    address public owner;
    address public gameServer; // Authorized server that can declare winners
    uint256 public gameCounter;
    uint256 public platformFeePercent = 5; // 5% platform fee
    uint256 public totalFeesCollected;
    
    // ============ Structs ============
    
    enum GameStatus {
        Waiting,      // Waiting for players
        InProgress,   // Game is running
        Completed,    // Game finished, winner declared
        Cancelled     // Game cancelled, refunds issued
    }
    
    struct Game {
        uint256 gameId;
        uint256 betAmount;
        uint256 maxPlayers;
        uint256 prizePool;
        uint256 startTime;
        uint256 endTime;
        address[] players;
        address winner;
        GameStatus status;
        mapping(address => bool) hasJoined;
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerActiveGame; // Track which game a player is in
    
    // ============ Events ============
    
    event GameCreated(uint256 indexed gameId, uint256 betAmount, uint256 maxPlayers);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 playerCount);
    event GameStarted(uint256 indexed gameId, uint256 playerCount);
    event WinnerDeclared(uint256 indexed gameId, address indexed winner, uint256 prizeAmount);
    event GameCancelled(uint256 indexed gameId, string reason);
    event RefundIssued(uint256 indexed gameId, address indexed player, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeePercent);
    event GameServerUpdated(address indexed newServer);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyGameServer() {
        require(msg.sender == gameServer || msg.sender == owner, "Only game server can call this");
        _;
    }
    
    modifier gameExists(uint256 _gameId) {
        require(_gameId > 0 && _gameId <= gameCounter, "Game does not exist");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        gameServer = msg.sender; // Initially owner is also game server
    }
    
    // ============ Game Management Functions ============
    
    /**
     * @dev Create a new game session
     * @param _betAmount Amount each player must bet to join (in wei)
     * @param _maxPlayers Maximum number of players (default 20)
     */
    function createGame(uint256 _betAmount, uint256 _maxPlayers) external onlyGameServer returns (uint256) {
        require(_betAmount > 0, "Bet amount must be greater than 0");
        require(_maxPlayers >= 2 && _maxPlayers <= 50, "Max players must be between 2 and 50");
        
        gameCounter++;
        Game storage newGame = games[gameCounter];
        
        newGame.gameId = gameCounter;
        newGame.betAmount = _betAmount;
        newGame.maxPlayers = _maxPlayers;
        newGame.status = GameStatus.Waiting;
        newGame.startTime = 0;
        newGame.endTime = 0;
        
        emit GameCreated(gameCounter, _betAmount, _maxPlayers);
        
        return gameCounter;
    }
    
    /**
     * @dev Join an existing game by paying the bet amount
     * @param _gameId ID of the game to join
     */
    function joinGame(uint256 _gameId) external payable gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.Waiting, "Game is not accepting players");
        require(!game.hasJoined[msg.sender], "Already joined this game");
        require(game.players.length < game.maxPlayers, "Game is full");
        require(msg.value == game.betAmount, "Incorrect bet amount");
        require(playerActiveGame[msg.sender] == 0, "Already in another active game");
        
        // Add player to game
        game.players.push(msg.sender);
        game.hasJoined[msg.sender] = true;
        game.prizePool += msg.value;
        playerActiveGame[msg.sender] = _gameId;
        
        emit PlayerJoined(_gameId, msg.sender, game.players.length);
        
        // Auto-start game when max players reached
        if (game.players.length == game.maxPlayers) {
            _startGame(_gameId);
        }
    }
    
    /**
     * @dev Manually start a game (if not auto-started)
     * @param _gameId ID of the game to start
     */
    function startGame(uint256 _gameId) external onlyGameServer gameExists(_gameId) {
        _startGame(_gameId);
    }
    
    /**
     * @dev Internal function to start a game
     */
    function _startGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.Waiting, "Game already started or finished");
        require(game.players.length >= 2, "Need at least 2 players to start");
        
        game.status = GameStatus.InProgress;
        game.startTime = block.timestamp;
        
        emit GameStarted(_gameId, game.players.length);
    }
    
    /**
     * @dev Declare the winner and distribute prize pool
     * @param _gameId ID of the game
     * @param _winner Address of the winning player
     */
    function declareWinner(uint256 _gameId, address _winner) external onlyGameServer gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.InProgress, "Game is not in progress");
        require(game.hasJoined[_winner], "Winner must be a player in the game");
        
        game.status = GameStatus.Completed;
        game.winner = _winner;
        game.endTime = block.timestamp;
        
        // Calculate platform fee and prize
        uint256 platformFee = (game.prizePool * platformFeePercent) / 100;
        uint256 winnerPrize = game.prizePool - platformFee;
        
        totalFeesCollected += platformFee;
        
        // Clear player's active game status
        for (uint256 i = 0; i < game.players.length; i++) {
            playerActiveGame[game.players[i]] = 0;
        }
        
        // Transfer prize to winner
        (bool success, ) = payable(_winner).call{value: winnerPrize}("");
        require(success, "Prize transfer failed");
        
        emit WinnerDeclared(_gameId, _winner, winnerPrize);
    }
    
    /**
     * @dev Cancel a game and refund all players
     * @param _gameId ID of the game to cancel
     * @param _reason Reason for cancellation
     */
    function cancelGame(uint256 _gameId, string memory _reason) external onlyGameServer gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status != GameStatus.Completed, "Cannot cancel completed game");
        require(game.status != GameStatus.Cancelled, "Game already cancelled");
        
        game.status = GameStatus.Cancelled;
        game.endTime = block.timestamp;
        
        // Refund all players
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            playerActiveGame[player] = 0;
            
            (bool success, ) = payable(player).call{value: game.betAmount}("");
            require(success, "Refund failed");
            
            emit RefundIssued(_gameId, player, game.betAmount);
        }
        
        emit GameCancelled(_gameId, _reason);
    }
    
    /**
     * @dev Emergency refund for stuck games (only owner, after timeout)
     * @param _gameId ID of the game
     */
    function emergencyRefund(uint256 _gameId) external onlyOwner gameExists(_gameId) {
        Game storage game = games[_gameId];
        
        require(game.status == GameStatus.Waiting || game.status == GameStatus.InProgress, "Invalid game state");
        require(block.timestamp > game.startTime + 1 hours || game.startTime == 0, "Game not timed out yet");
        
        game.status = GameStatus.Cancelled;
        game.endTime = block.timestamp;
        
        // Refund all players
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            playerActiveGame[player] = 0;
            
            (bool success, ) = payable(player).call{value: game.betAmount}("");
            require(success, "Emergency refund failed");
            
            emit RefundIssued(_gameId, player, game.betAmount);
        }
        
        emit GameCancelled(_gameId, "Emergency refund");
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get game details
     */
    function getGameInfo(uint256 _gameId) external view gameExists(_gameId) returns (
        uint256 gameId,
        uint256 betAmount,
        uint256 maxPlayers,
        uint256 currentPlayers,
        uint256 prizePool,
        GameStatus status,
        address winner
    ) {
        Game storage game = games[_gameId];
        return (
            game.gameId,
            game.betAmount,
            game.maxPlayers,
            game.players.length,
            game.prizePool,
            game.status,
            game.winner
        );
    }
    
    /**
     * @dev Get all players in a game
     */
    function getGamePlayers(uint256 _gameId) external view gameExists(_gameId) returns (address[] memory) {
        return games[_gameId].players;
    }
    
    /**
     * @dev Check if a player has joined a specific game
     */
    function hasPlayerJoined(uint256 _gameId, address _player) external view gameExists(_gameId) returns (bool) {
        return games[_gameId].hasJoined[_player];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update the game server address
     */
    function setGameServer(address _newServer) external onlyOwner {
        require(_newServer != address(0), "Invalid server address");
        gameServer = _newServer;
        emit GameServerUpdated(_newServer);
    }
    
    /**
     * @dev Update platform fee percentage
     */
    function setPlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(_newFeePercent);
    }
    
    /**
     * @dev Withdraw collected platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");
        
        totalFeesCollected = 0;
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Fee withdrawal failed");
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner address");
        owner = _newOwner;
    }
    
    // ============ Fallback ============
    
    receive() external payable {
        revert("Direct payments not accepted");
    }
}

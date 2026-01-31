# Monad Sumo Battle Royale 🥋

**QR-Accessible Blockchain Battle Royale Game on Monad**

Monad Sumo Battle Royale is a high-performance multiplayer game built for the Monad blockchain. Players scan a QR code, bet with MONAD tokens, and compete in a sumo-style battle royale where the last player standing wins the entire prize pool!

## 🎮 Game Features

- **QR Code Access**: Players scan a QR code to instantly join the game
- **Blockchain Betting**: Bet MONAD tokens from your wallet to enter
- **20-Player Battle Royale**: Compete against 19 other players in real-time
- **Sumo Combat**: Push opponents out of the arena to eliminate them
- **Winner Takes All**: Last player standing wins 95% of the prize pool (5% platform fee)
- **Real-time Physics**: Powered by Phaser 3 and Matter.js physics engine
- **Cyberpunk Aesthetics**: Modern, neon-themed UI with smooth animations

## 🎯 How to Play

1. **Scan QR Code** - Use your phone to scan the game QR code
2. **Connect Wallet** - Connect your Monad-compatible wallet (MetaMask)
3. **Place Bet** - Enter your bet amount and join the game
4. **Wait for Players** - Game starts when 20 players join
5. **Battle** - Use WASD or arrow keys to move, SPACE to dash
6. **Push Opponents** - Collide with other players to push them
7. **Win** - Be the last player in the arena to win the prize pool!

## 📂 Project Structure

```
Monad-StreamPay/
├── contracts/
│   ├── StreamPay.sol          # Original streaming payment contract
│   └── SumoBattle.sol          # Battle royale game contract
├── frontend/
│   ├── index.html              # Original streaming app
│   └── sumo-game/              # Battle royale game
│       ├── index.html          # Main game interface
│       ├── styles.css          # Cyberpunk styling
│       ├── contract.js         # Blockchain integration
│       ├── game.js             # Phaser 3 game engine
│       ├── app.js              # Application controller
│       ├── invite-utils.js     # NEW: Invite & QR utilities
│       ├── invite.html         # NEW: Invite landing page
│       ├── host-dashboard.html # NEW: Host control panel
│       └── qr-generator.html   # NEW: Enhanced QR generator
└── README.md
```

## 🛠️ Tech Stack

### Smart Contract
- **Solidity 0.8.20** - Smart contract language
- **Game State Management** - Waiting, InProgress, Completed, Cancelled
- **Secure Payouts** - Winner verification and prize distribution
- **Emergency Refunds** - Safety mechanism for stuck games

### Frontend
- **Phaser 3** - Game engine with Matter.js physics
- **Ethers.js** - Blockchain interaction
- **Vanilla HTML/CSS/JS** - No build tools required
- **Responsive Design** - Works on desktop and mobile

### Blockchain
- **Monad Testnet** - High-performance EVM-compatible chain
- **Native MONAD Tokens** - For betting and prizes

## 🚀 Quick Start

### 1. Deploy Smart Contract

```bash
# Install dependencies (if using Hardhat/Foundry)
npm install

# Deploy to Monad Testnet
# Update CONTRACT_CONFIG.address in contract.js with deployed address
```

### 2. Run Frontend Locally

```bash
# No build required! Just open in browser
open frontend/sumo-game/index.html

# Or use a local server
npx http-server frontend/sumo-game -p 8080
```

### 3. Generate QR Code

```bash
# Open QR generator
open frontend/sumo-game/qr-generator.html

# Enter your deployed game URL
# Download and share the QR code!
```

## 📱 QR Code Invitation System

### Features

The game now includes a comprehensive invitation system:

- **🎯 Host Dashboard** - Create games and manage invites
- **📱 QR Code Generator** - Create customizable QR codes
- **🔗 Shareable Links** - Direct invite links with tracking
- **📊 Analytics** - Track invite usage and player joins
- **🌐 Social Sharing** - Share on Twitter, Facebook, Telegram, WhatsApp

### How to Invite Players

#### Option 1: Host Dashboard (Recommended)

```bash
# Open the host dashboard
open frontend/sumo-game/host-dashboard.html
```

1. **Create a Game**
   - Set bet amount (default: 0.01 MONAD)
   - Choose max players (10, 20, 30, or 50)
   - Set game duration
   - Click "Oyun Oluştur"

2. **Share the Invite**
   - QR code is automatically generated
   - Copy invite link or download QR code
   - Share on social media or send directly

3. **Track Players**
   - See players joining in real-time
   - View statistics (invites sent, players joined, prize pool)
   - Monitor game status

#### Option 2: QR Generator

```bash
# Open QR generator
open frontend/sumo-game/qr-generator.html
```

1. Enter game ID (optional)
2. Add your wallet address for tracking (optional)
3. Customize QR code colors
4. Generate and download
5. Share via social media or copy link

#### Option 3: Direct Invite Link

Share this format:
```
https://your-domain.com/sumo-game/invite.html?game=1&host=0xYourAddress
```

Players who click the link will:
- See game information
- View current players and prize pool
- Join with one click

### Invite Link Parameters

- `game` - Game ID (required)
- `host` - Host wallet address (optional, for tracking)
- `join` - Auto-join flag (optional, set to `true`)

Example:
```
invite.html?game=123&host=0xABC...&join=true
```

## 🎮 Game Controls

- **Movement**: `W` `A` `S` `D` or Arrow Keys `↑` `←` `↓` `→`
- **Dash**: `SPACE` (2-second cooldown)
- **Objective**: Push other players out of the circular arena

## 🔧 Configuration

### Mock Mode (Testing)
Set `AppState.mockMode = true` in `app.js` to test without deploying contract:
- Simulates wallet connection
- Auto-generates bot players
- No real blockchain transactions

### Production Mode
Set `AppState.mockMode = false` and update `contract.js`:
```javascript
const CONTRACT_CONFIG = {
    address: 'YOUR_DEPLOYED_CONTRACT_ADDRESS',
    chainId: 41454, // Monad Testnet
    rpcUrl: 'https://testnet.monad.xyz'
};
```

## 🎨 Game Mechanics

### Arena
- **Shape**: Circular platform (sumo ring style)
- **Radius**: 300px (scales with screen size)
- **Boundaries**: Players eliminated when fully outside

### Combat
- **Collision**: Players bounce off each other
- **Push Force**: Based on velocity and angle of impact
- **Dash Ability**: Quick burst of speed with cooldown
- **Elimination**: Instant when outside arena boundary

### Win Conditions
- **Primary**: Last player remaining in arena
- **Timeout**: If time runs out, closest to center wins (5 min)

## 💰 Prize Pool

- **Entry Fee**: Configurable (default 0.01 MONAD)
- **Prize Pool**: Sum of all bets
- **Platform Fee**: 5% (configurable in contract)
- **Winner Payout**: 95% of prize pool
- **Distribution**: Automatic via smart contract

## 🔐 Security Features

- **Reentrancy Guards**: Prevents exploit attacks
- **Access Control**: Only authorized server can declare winners
- **Emergency Refunds**: Owner can refund if game fails
- **Time Limits**: Games expire after 1 hour
- **Player Verification**: Winner must be registered player

## 📱 Mobile Support

- Touch controls (virtual joystick) - Coming soon
- Responsive UI for all screen sizes
- Mobile wallet support (MetaMask mobile, WalletConnect)

## 🎯 Roadmap

- [ ] Deploy to Monad Mainnet
- [ ] Add dedicated game server for multiplayer sync
- [ ] Implement WebRTC/WebSocket for real-time multiplayer
- [ ] Add more game modes (2v2, Team Battle, etc.)
- [ ] Tournament system with brackets
- [ ] Leaderboards and player stats
- [ ] NFT character skins
- [ ] Mobile app (React Native)

## 🐛 Known Issues

- **Multiplayer**: Currently uses mock multiplayer (bots)
- **Network Sync**: Real-time position sync needs dedicated server
- **Mobile Controls**: Touch controls not yet implemented

## 📄 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ for Monad Blitz Hackathon**

*Push your way to victory! 🥋*

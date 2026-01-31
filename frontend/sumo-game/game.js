// ============================================
// MONAD SUMO BATTLE - PHASER 3 GAME ENGINE
// ============================================

// Game configuration
const GAME_CONFIG = {
    arenaRadius: 300,
    playerRadius: 20,
    playerSpeed: 200,
    dashSpeed: 500,
    dashCooldown: 2000,
    pushForce: 400,
    maxPlayers: 20,
    gameTime: 300, // 5 minutes in seconds
    colors: [
        0xff0055, 0x00f0ff, 0xff00ff, 0x00ff88, 0xffaa00,
        0x5555ff, 0xff5555, 0x55ff55, 0xffff55, 0xff55ff,
        0x55ffff, 0xffa500, 0x8b00ff, 0x00ff00, 0xff1493,
        0x00ced1, 0xff4500, 0x9370db, 0x32cd32, 0xff69b4
    ]
};

// ============================================
// SUMO GAME CLASS
// ============================================

class SumoGame {
    constructor(containerId) {
        this.containerId = containerId;
        this.game = null;
        this.scene = null;
        this.players = new Map();
        this.localPlayerId = null;
        this.isGameRunning = false;
        this.callbacks = {};
    }

    // Initialize Phaser game
    init(playerData, localPlayerId) {
        this.localPlayerId = localPlayerId;

        const config = {
            type: Phaser.AUTO,
            parent: this.containerId,
            width: 800,
            height: 600,
            backgroundColor: '#0a0a0f',
            physics: {
                default: 'matter',
                matter: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: {
                preload: () => this.preload(),
                create: () => this.create(playerData),
                update: () => this.update()
            }
        };

        this.game = new Phaser.Game(config);
    }

    preload() {
        // No assets needed for MVP - using shapes
    }

    create(playerData) {
        this.scene = this.game.scene.scenes[0];
        const { width, height } = this.scene.cameras.main;

        // Create arena
        this.createArena(width / 2, height / 2);

        // Create players
        playerData.forEach((player, index) => {
            this.createPlayer(player.id, player.address, index);
        });

        // Setup controls for local player
        this.setupControls();

        // Setup camera
        this.scene.cameras.main.setZoom(1);

        this.isGameRunning = true;
    }

    createArena(x, y) {
        const graphics = this.scene.add.graphics();

        // Arena platform
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillCircle(x, y, GAME_CONFIG.arenaRadius);

        // Arena border
        graphics.lineStyle(4, 0x00f0ff, 1);
        graphics.strokeCircle(x, y, GAME_CONFIG.arenaRadius);

        // Danger zone (outer ring)
        graphics.lineStyle(2, 0xff0055, 0.5);
        graphics.strokeCircle(x, y, GAME_CONFIG.arenaRadius - 30);

        // Center circle
        graphics.lineStyle(2, 0x00f0ff, 0.3);
        graphics.strokeCircle(x, y, 50);

        // Grid lines
        graphics.lineStyle(1, 0x00f0ff, 0.1);
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const x1 = x + Math.cos(angle) * 50;
            const y1 = y + Math.sin(angle) * 50;
            const x2 = x + Math.cos(angle) * GAME_CONFIG.arenaRadius;
            const y2 = y + Math.sin(angle) * GAME_CONFIG.arenaRadius;
            graphics.lineBetween(x1, y1, x2, y2);
        }

        this.arenaCenter = { x, y };
    }

    createPlayer(playerId, address, index) {
        const { width, height } = this.scene.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Position players in a circle around the arena
        const angle = (Math.PI * 2 * index) / GAME_CONFIG.maxPlayers;
        const spawnRadius = GAME_CONFIG.arenaRadius - 80;
        const x = centerX + Math.cos(angle) * spawnRadius;
        const y = centerY + Math.sin(angle) * spawnRadius;

        // Create player body
        const color = GAME_CONFIG.colors[index % GAME_CONFIG.colors.length];
        const body = this.scene.matter.add.circle(x, y, GAME_CONFIG.playerRadius, {
            restitution: 0.8,
            friction: 0.1,
            frictionAir: 0.05,
            mass: 1
        });

        // Create player sprite
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, GAME_CONFIG.playerRadius);
        graphics.lineStyle(3, 0xffffff, 1);
        graphics.strokeCircle(0, 0, GAME_CONFIG.playerRadius);

        // Add direction indicator
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(GAME_CONFIG.playerRadius * 0.6, 0, 5);

        graphics.generateTexture(`player_${playerId}`, GAME_CONFIG.playerRadius * 2, GAME_CONFIG.playerRadius * 2);
        graphics.destroy();

        const sprite = this.scene.add.sprite(x, y, `player_${playerId}`);
        sprite.setData('body', body);

        // Create name label
        const shortAddress = this.formatAddress(address);
        const nameText = this.scene.add.text(x, y - GAME_CONFIG.playerRadius - 15, shortAddress, {
            fontSize: '12px',
            fontFamily: 'Inter',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Highlight local player
        if (playerId === this.localPlayerId) {
            const highlight = this.scene.add.circle(x, y, GAME_CONFIG.playerRadius + 10, 0x00f0ff, 0);
            highlight.setStrokeStyle(2, 0x00f0ff, 1);
            sprite.setData('highlight', highlight);
        }

        this.players.set(playerId, {
            id: playerId,
            address,
            body,
            sprite,
            nameText,
            color,
            isAlive: true,
            lastDash: 0
        });
    }

    setupControls() {
        const cursors = this.scene.input.keyboard.createCursorKeys();
        const wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            dash: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.controls = { cursors, wasd };
    }

    update() {
        if (!this.isGameRunning) return;

        // Update all players
        this.players.forEach((player) => {
            this.updatePlayer(player);
        });

        // Check for eliminations
        this.checkEliminations();
    }

    updatePlayer(player) {
        if (!player.isAlive) return;

        const { body, sprite, nameText } = player;
        const position = body.position;

        // Update sprite position
        sprite.setPosition(position.x, position.y);
        nameText.setPosition(position.x, position.y - GAME_CONFIG.playerRadius - 15);

        // Update highlight if local player
        if (player.id === this.localPlayerId) {
            const highlight = sprite.getData('highlight');
            if (highlight) {
                highlight.setPosition(position.x, position.y);
            }

            // Handle local player controls
            this.handlePlayerInput(player);
        }

        // Update sprite rotation based on velocity
        const velocity = body.velocity;
        if (velocity.x !== 0 || velocity.y !== 0) {
            sprite.rotation = Math.atan2(velocity.y, velocity.x);
        }
    }

    handlePlayerInput(player) {
        const { cursors, wasd } = this.controls;
        const { body } = player;

        let velocityX = 0;
        let velocityY = 0;

        // Movement
        if (cursors.left.isDown || wasd.left.isDown) {
            velocityX = -GAME_CONFIG.playerSpeed;
        } else if (cursors.right.isDown || wasd.right.isDown) {
            velocityX = GAME_CONFIG.playerSpeed;
        }

        if (cursors.up.isDown || wasd.up.isDown) {
            velocityY = -GAME_CONFIG.playerSpeed;
        } else if (cursors.down.isDown || wasd.down.isDown) {
            velocityY = GAME_CONFIG.playerSpeed;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            const factor = 1 / Math.sqrt(2);
            velocityX *= factor;
            velocityY *= factor;
        }

        // Apply movement
        if (velocityX !== 0 || velocityY !== 0) {
            this.scene.matter.body.setVelocity(body, {
                x: velocityX / 60,
                y: velocityY / 60
            });
        }

        // Dash ability
        if (wasd.dash.isDown) {
            const now = Date.now();
            if (now - player.lastDash > GAME_CONFIG.dashCooldown) {
                this.performDash(player);
                player.lastDash = now;
            }
        }

        // Broadcast position to other players (in real multiplayer)
        if (this.callbacks.onPositionUpdate) {
            this.callbacks.onPositionUpdate({
                playerId: player.id,
                x: body.position.x,
                y: body.position.y,
                rotation: player.sprite.rotation
            });
        }
    }

    performDash(player) {
        const { body, sprite } = player;
        const angle = sprite.rotation;

        // Apply dash force
        const force = {
            x: Math.cos(angle) * GAME_CONFIG.dashSpeed / 60,
            y: Math.sin(angle) * GAME_CONFIG.dashSpeed / 60
        };

        this.scene.matter.body.setVelocity(body, force);

        // Visual feedback
        const dashEffect = this.scene.add.circle(
            body.position.x,
            body.position.y,
            GAME_CONFIG.playerRadius,
            player.color,
            0.5
        );

        this.scene.tweens.add({
            targets: dashEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => dashEffect.destroy()
        });
    }

    checkEliminations() {
        this.players.forEach((player) => {
            if (!player.isAlive) return;

            const { body } = player;
            const dx = body.position.x - this.arenaCenter.x;
            const dy = body.position.y - this.arenaCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if player is outside arena
            if (distance > GAME_CONFIG.arenaRadius) {
                this.eliminatePlayer(player.id);
            }
        });
    }

    eliminatePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player || !player.isAlive) return;

        player.isAlive = false;

        // Visual feedback
        this.scene.tweens.add({
            targets: [player.sprite, player.nameText],
            alpha: 0,
            scale: 0,
            duration: 500,
            onComplete: () => {
                player.sprite.destroy();
                player.nameText.destroy();
                if (player.sprite.getData('highlight')) {
                    player.sprite.getData('highlight').destroy();
                }
            }
        });

        // Notify game
        if (this.callbacks.onPlayerEliminated) {
            this.callbacks.onPlayerEliminated({
                playerId: player.id,
                address: player.address
            });
        }

        // Check for winner
        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
        if (alivePlayers.length === 1) {
            this.declareWinner(alivePlayers[0]);
        }
    }

    declareWinner(player) {
        this.isGameRunning = false;

        if (this.callbacks.onGameEnd) {
            this.callbacks.onGameEnd({
                winnerId: player.id,
                winnerAddress: player.address
            });
        }
    }

    // Update remote player position (for multiplayer)
    updateRemotePlayer(playerId, x, y, rotation) {
        const player = this.players.get(playerId);
        if (!player || playerId === this.localPlayerId) return;

        // Smooth interpolation
        this.scene.tweens.add({
            targets: player.body.position,
            x,
            y,
            duration: 50,
            ease: 'Linear'
        });

        player.sprite.rotation = rotation;
    }

    // Set callbacks
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    // Destroy game
    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
        this.players.clear();
        this.isGameRunning = false;
    }

    // Helper: Format address
    formatAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}

// ============================================
// MOCK MULTIPLAYER (for testing without server)
// ============================================

class MockMultiplayer {
    constructor() {
        this.players = [];
        this.callbacks = {};
    }

    // Simulate other players
    addBots(count) {
        for (let i = 0; i < count; i++) {
            this.players.push({
                id: `bot_${i}`,
                address: `0x${Math.random().toString(16).substring(2, 42)}`
            });
        }
    }

    getPlayers() {
        return this.players;
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }
}

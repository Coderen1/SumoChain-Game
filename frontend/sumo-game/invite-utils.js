// ============================================
// INVITE UTILITIES - MONAD SUMO BATTLE
// ============================================

/**
 * Generate an invite link for a game
 * @param {string} gameId - The game ID
 * @param {string} hostAddress - Optional host wallet address
 * @returns {string} The complete invite URL
 */
function generateInviteLink(gameId, hostAddress = null) {
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const inviteUrl = `${baseUrl}invite.html?game=${gameId}`;

    if (hostAddress) {
        return `${inviteUrl}&host=${hostAddress}`;
    }

    return inviteUrl;
}

/**
 * Generate a QR code for an invite URL
 * @param {string} url - The URL to encode
 * @param {object} options - QR code options
 * @returns {Promise} Promise that resolves when QR code is generated
 */
async function generateQRCode(url, options = {}) {
    const defaults = {
        width: 400,
        margin: 2,
        color: {
            dark: options.darkColor || '#0a0a0f',
            light: options.lightColor || '#ffffff'
        },
        errorCorrectionLevel: 'H'
    };

    const settings = { ...defaults, ...options };

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');

        QRCode.toCanvas(canvas, url, settings, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve(canvas);
            }
        });
    });
}

/**
 * Download QR code as PNG image
 * @param {HTMLCanvasElement} canvas - The canvas containing the QR code
 * @param {string} filename - The filename for download
 */
function downloadQRCode(canvas, filename = 'monad-sumo-invite.png') {
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
}

/**
 * Share invite link to social media
 * @param {string} platform - Social media platform (twitter, facebook, telegram, whatsapp)
 * @param {string} url - The invite URL
 * @param {string} message - Optional custom message
 */
function shareToSocial(platform, url, message = '') {
    const defaultMessage = '🥋 Monad Sumo Battle Royale\'e katıl! Son kalan kazanır! 💰';
    const text = message || defaultMessage;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    };

    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    } else {
        console.error('Unsupported platform:', platform);
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Show a temporary notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#00f0ff' : type === 'error' ? '#ff0066' : '#ffaa00'};
        color: #0a0a0f;
        border-radius: 10px;
        font-weight: bold;
        box-shadow: 0 4px 20px rgba(0, 240, 255, 0.4);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Parse URL parameters
 * @returns {object} Object containing URL parameters
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};

    for (const [key, value] of params) {
        result[key] = value;
    }

    return result;
}

/**
 * Track invite usage (mock implementation)
 * @param {string} gameId - Game ID
 * @param {string} inviterId - Inviter's address
 */
function trackInvite(gameId, inviterId) {
    const key = `invite_${gameId}_${inviterId}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (count + 1).toString());

    console.log(`Invite tracked: Game ${gameId}, Inviter ${inviterId}, Count: ${count + 1}`);
}

/**
 * Get invite statistics
 * @param {string} gameId - Game ID
 * @param {string} inviterId - Inviter's address
 * @returns {number} Number of invites used
 */
function getInviteStats(gameId, inviterId) {
    const key = `invite_${gameId}_${inviterId}`;
    return parseInt(localStorage.getItem(key) || '0');
}

/**
 * Mock function to get game info
 * In production, this would fetch from blockchain
 * @param {string} gameId - Game ID
 * @returns {Promise<object>} Game information
 */
async function getGameInfo(gameId) {
    // Mock implementation
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: gameId,
                status: 'waiting',
                playerCount: Math.floor(Math.random() * 15),
                maxPlayers: 20,
                prizePool: (Math.random() * 2).toFixed(3),
                betAmount: 0.01,
                host: '0x' + Math.random().toString(16).substring(2, 42),
                createdAt: Date.now() - Math.random() * 3600000
            });
        }, 500);
    });
}

/**
 * Format time ago
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time string
 */
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds} saniye önce`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika önce`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
    return `${Math.floor(seconds / 86400)} gün önce`;
}

/**
 * Validate game ID format
 * @param {string} gameId - Game ID to validate
 * @returns {boolean} Whether the game ID is valid
 */
function isValidGameId(gameId) {
    return gameId && /^\d+$/.test(gameId);
}

/**
 * Create a shareable game card image
 * @param {object} gameInfo - Game information
 * @returns {Promise<string>} Data URL of the generated image
 */
async function createGameCard(gameInfo) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);

    // Title
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🥋 MONAD SUMO BATTLE', 400, 80);

    // Game info
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px Arial';
    ctx.fillText(`Game #${gameInfo.id}`, 400, 140);

    ctx.font = '28px Arial';
    ctx.fillText(`Prize Pool: ${gameInfo.prizePool} MONAD`, 400, 200);
    ctx.fillText(`Players: ${gameInfo.playerCount}/${gameInfo.maxPlayers}`, 400, 250);

    // Call to action
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('Scan QR Code to Join!', 400, 330);

    return canvas.toDataURL('image/png');
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateInviteLink,
        generateQRCode,
        downloadQRCode,
        shareToSocial,
        copyToClipboard,
        showNotification,
        getUrlParams,
        trackInvite,
        getInviteStats,
        getGameInfo,
        formatTimeAgo,
        isValidGameId,
        createGameCard
    };
}

# 🚀 Monad Sumo Battle - Deployment Rehberi

## Hızlı Başlangıç (5 Dakikada Deploy)

### 1. Smart Contract Deploy Et

#### Remix IDE ile (En Kolay)
1. [Remix IDE](https://remix.ethereum.org/) aç
2. `contracts/SumoBattle.sol` dosyasını Remix'e kopyala
3. Solidity Compiler → Version `0.8.20` seç → Compile
4. Deploy & Run:
   - Environment: **Injected Provider - MetaMask**
   - MetaMask'ta **Monad Testnet** seç
   - Network eklemek için:
     ```
     Network Name: Monad Testnet
     RPC URL: https://testnet.monad.xyz
     Chain ID: 41454
     Currency Symbol: MONAD
     Block Explorer: https://explorer.testnet.monad.xyz
     ```
5. **Deploy** butonuna tıkla
6. ✅ Contract address'ini kopyala (örn: `0x1234...5678`)

### 2. Frontend Config Güncelle

`frontend/sumo-game/contract.js` dosyasını aç ve güncelle:

```javascript
const CONTRACT_CONFIG = {
    address: 'BURAYA_CONTRACT_ADRESINIZI_YAPIŞTIRIN', // Adım 1'den
    chainId: 41454,
    rpcUrl: 'https://testnet.monad.xyz',
    blockExplorer: 'https://explorer.testnet.monad.xyz'
};
```

`frontend/sumo-game/app.js` dosyasını aç ve mock mode'u kapat:

```javascript
const AppState = {
    // ...
    mockMode: false, // true'ydu, false yap
    // ...
};
```

### 3. Vercel'e Deploy

#### A) Vercel CLI ile (Hızlı)
```bash
# Vercel CLI kur (ilk defa yapıyorsan)
npm install -g vercel

# Proje klasöründe
cd Monad-StreamPay

# Deploy et
vercel

# Production deploy
vercel --prod
```

#### B) GitHub üzerinden (Otomatik)
1. Projeyi GitHub'a push et
2. [Vercel Dashboard](https://vercel.com) → **New Project**
3. GitHub repo'nu seç
4. **Deploy** tıkla
5. ✅ Otomatik build olur

#### C) Vercel Dashboard ile (Manuel)
1. [Vercel Dashboard](https://vercel.com) → **Add New** → **Project**
2. Proje klasörünü sürükle-bırak
3. **Deploy** tıkla

### 4. QR Kod Oluştur

Deploy edildikten sonra:

```bash
# Vercel URL'nizi alın (örn: https://your-project.vercel.app)

# QR generator sayfasına git
https://your-project.vercel.app/sumo-game/qr-generator.html
```

Ya da:

1. Vercel'den aldığınız URL'yi `frontend/sumo-game/qr-generator.html` sayfasında gir
2. QR kodu oluştur
3. İndir ve paylaş!

---

## 📱 Kullanım Senaryosu

### Event/Demo İçin Adımlar

1. **Hazırlık (Siz)**
   ```bash
   # Contract deploy edildi ✅
   # Vercel'e deploy edildi ✅
   # QR kod oluşturuldu ✅
   ```

2. **Oyun Başlatma**
   - Oyun ID: Otomatik artar (1, 2, 3...)
   - Bahis miktarı: `frontend/sumo-game/index.html`'de default 0.01 MONAD

3. **Oyuncular Katılıyor**
   - QR kodu taratın
   - MetaMask bağlansın
   - Bahis yapsın ve oyuna katılsın
   - 20 kişi dolunca otomatik başlar

4. **Oyun**
   - Herkes kendi ekranında oynar
   - Fizik her tarayıcıda bağımsız (multiplayer değil ama sorun değil)
   - Son kalan kazanır

5. **Kazanan**
   - Smart contract'a yazılır
   - Ödül otomatik gönderilir

---

## 🎮 Oyun Ayarları

### Bahis Miktarını Değiştir
`frontend/sumo-game/index.html` - Satır ~120:
```html
<input type="number" id="bet-amount" value="0.01" step="0.01" min="0.001">
```

### Oyuncu Sayısını Değiştir
`frontend/sumo-game/app.js` - Satır ~235:
```javascript
if (playerCount >= 20) { // 20'yi değiştir (örn: 10)
```

`frontend/sumo-game/game.js` - Satır ~13:
```javascript
maxPlayers: 20, // Bunu da değiştir
```

### Oyun Süresini Değiştir
`frontend/sumo-game/game.js` - Satır ~14:
```javascript
gameTime: 300, // 300 saniye = 5 dakika
```

---

## 🔧 Troubleshooting

### Problem: "No wallet found"
**Çözüm:** Oyuncuların MetaMask yüklü olması gerekiyor
- Chrome: https://metamask.io/download/
- Monad Testnet eklenmeli

### Problem: "Incorrect network"
**Çözüm:** MetaMask'ta Monad Testnet'e geçilmeli
```javascript
// Otomatik network değiştirme için contract.js'de:
await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0xa1ce' }] // 41454 hex
});
```

### Problem: "Insufficient funds"
**Çözüm:** Test MONAD tokeni gerekli
- Monad Testnet Faucet kullanın
- Ya da bahis miktarını azaltın

### Problem: Vercel deployment failed
**Çözüm:** 
```bash
# vercel.json doğru konumda mı kontrol et
ls -la vercel.json

# Tekrar dene
vercel --prod --force
```

---

## 💰 Maliyet

- ✅ **Vercel:** Ücretsiz (Hobby plan yeterli)
- ✅ **Smart Contract Deploy:** ~$0.50 gas fee (Monad testnet)
- ✅ **Test Tokenleri:** Ücretsiz (faucet'ten)
- ✅ **Toplam:** ~$0 (test için)

---

## 🎯 Tek Oyun İçin Özel Notlar

Sizin durumunuzda (sadece 1 oyun, demo amaçlı):

1. **Server gerekmiyor** ✅
2. **Her oyuncu kendi ekranında oynar** ✅
3. **Kazanan blockchain'e yazılır** ✅
4. **Vercel ücretsiz plan yeterli** ✅

### Basitleştirilmiş Akış:
```
QR Kod → Cüzdan Bağla → Bahis Yap → 20 Kişi Dol → Oyun Başla → Kazan!
```

**Multiplayer senkronizasyonu yok ama problem değil çünkü:**
- Her oyuncu kendi fizik simülasyonunda oynar
- Kazanan random/manuel olarak belirlenebilir
- Ya da en uzun süre ayakta kalanı host belirler

---

## 📞 Destek

Sorun olursa:
1. Browser console'u kontrol et (F12)
2. MetaMask'ta doğru network'te olduğundan emin ol
3. Contract address doğru mu kontrol et

---

**Hazır! Artık deploy edebilirsiniz 🚀**

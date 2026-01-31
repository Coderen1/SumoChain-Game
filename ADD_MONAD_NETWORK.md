# 🔗 MetaMask'a Monad Testnet Ekleme

## Otomatik Ekleme (Önerilen)

1. MetaMask'ı aç
2. Tarayıcı console'unu aç (F12)
3. Console sekmesinde şu kodu yapıştır ve Enter'a bas:

```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0xa1ce',
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MONAD',
      decimals: 18
    },
    rpcUrls: ['https://testnet.monad.xyz'],
    blockExplorerUrls: ['https://explorer.testnet.monad.xyz']
  }]
});
```

4. MetaMask popup açılır → **Approve** tıkla
5. ✅ Monad Testnet eklendi!

---

## Manuel Ekleme

MetaMask'ta:

1. **Network seçici**'ye tıkla (üstte, örn: "Ethereum Mainnet")
2. **Add Network** veya **Add a network manually** tıkla
3. Şu bilgileri gir:

```
Network Name: Monad Testnet
New RPC URL: https://testnet.monad.xyz
Chain ID: 41454
Currency Symbol: MONAD
Block Explorer URL: https://explorer.testnet.monad.xyz
```

4. **Save** tıkla
5. ✅ Monad Testnet eklendi!

---

## Test Token Al (Faucet)

Deploy için MONAD token gerekli:

1. Monad Testnet Faucet'e git (Monad Discord'undan bulabilirsiniz)
2. Cüzdan adresinizi yapıştır
3. Test token'ları alın (genelde birkaç dakika içinde gelir)

---

**Sonraki Adım:** Contract deploy etme (Remix IDE)

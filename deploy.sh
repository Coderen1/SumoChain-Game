#!/bin/bash

# 🚀 Monad Sumo Battle - Hızlı Deploy Script

echo "🎮 Monad Sumo Battle - Vercel Deploy"
echo "===================================="
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null
then
    echo "⚠️  Vercel CLI bulunamadı. Yükleniyor..."
    npm install -g vercel
fi

echo "📦 Dosyalar kontrol ediliyor..."

# Check if contract address is set
if grep -q "0x0000000000000000000000000000000000000000" frontend/sumo-game/contract.js; then
    echo ""
    echo "⚠️  UYARI: Contract address henüz ayarlanmamış!"
    echo "   1. Smart contract'ı deploy edin (Remix IDE)"
    echo "   2. frontend/sumo-game/contract.js dosyasında CONTRACT_CONFIG.address'i güncelleyin"
    echo "   3. frontend/sumo-game/app.js dosyasında mockMode: false yapın"
    echo ""
    read -p "Yine de devam etmek istiyor musunuz? (mock mode ile test) [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        echo "❌ Deploy iptal edildi."
        exit 1
    fi
fi

echo ""
echo "🚀 Vercel'e deploy ediliyor..."
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deploy tamamlandı!"
echo ""
echo "📱 Şimdi ne yapmalısınız:"
echo "   1. Vercel'den aldığınız URL'yi kopyalayın"
echo "   2. /sumo-game/qr-generator.html sayfasına gidin"
echo "   3. QR kod oluşturun ve paylaşın!"
echo ""
echo "🎯 Oyun URL'niz: https://your-project.vercel.app/sumo-game/index.html"
echo ""

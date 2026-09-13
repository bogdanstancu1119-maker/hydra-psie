#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# HYDRA PSIE — INSTALARE TERMUX (Android)
# ============================================================

set -e

echo "🧠 Hydra PSIE — Termux Install"
echo "=============================="

# Update
pkg update -y && pkg upgrade -y

# Install essentials
pkg install -y nodejs-lts git python

# Clone dacă nu există
if [ ! -d "$HOME/hydra-psie" ]; then
  echo "📥 Clone repo..."
  git clone https://github.com/bogdanstancu1119-maker/hydra-psie.git "$HOME/hydra-psie"
fi

cd "$HOME/hydra-psie"

# Install deps
if [ -f package.json ]; then
  npm install || true
fi

echo ""
echo "✅ Instalare completă!"
echo ""
echo "Pornire agent Hydra:"
echo "  cd ~/hydra-psie"
echo "  python3 -m http.server 8080"
echo ""
echo "Acces: http://localhost:8080"
echo ""
echo "Pentru rulare în background:"
echo "  termux-wake-lock"
echo "  nohup python3 -m http.server 8080 &"

#!/bin/bash
# ============================================================
# HYDRA PSIE — BOOTSTRAP
# ============================================================

set -e

echo "🧠 Hydra PSIE — Bootstrap"
echo "========================"

# Detect OS
OS="$(uname -s)"
echo "OS: $OS"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js not found. Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version)
echo "Node: $NODE_VERSION"

# Check Python (pentru server local)
if command -v python3 &> /dev/null; then
  echo "Python3: $(python3 --version)"
fi

# Install deps (dacă există package.json)
if [ -f "package.json" ]; then
  echo "📦 Installing dependencies..."
  if command -v pnpm &> /dev/null; then
    pnpm install
  elif command -v npm &> /dev/null; then
    npm install
  fi
fi

echo ""
echo "✅ Bootstrap complet!"
echo ""
echo "Pentru rulare locală:"
echo "  python3 -m http.server 8000"
echo "  sau"
echo "  npx serve ."
echo ""
echo "Deschide: http://localhost:8000"

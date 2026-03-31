#!/bin/bash
set -e

# Download Diamond binary for Linux x86_64
if [ ! -f bin/diamond ]; then
  echo "[build] Downloading Diamond binary..."
  mkdir -p bin
  curl -sL https://github.com/bbuchfink/diamond/releases/download/v2.1.11/diamond-linux64.tar.gz | tar xz -C bin
  chmod +x bin/diamond
  echo "[build] Diamond binary ready"
fi

# Build the curated toxin database if it doesn't exist
if [ ! -f data/diamond/curated_toxins.dmnd ]; then
  echo "[build] Building Diamond database..."
  npx tsx scripts/build-diamond-db.ts
  echo "[build] Diamond database ready"
fi

# Run the standard Next.js build
next build

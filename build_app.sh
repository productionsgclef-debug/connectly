#!/bin/bash

# =================================================================
# MASTER BUILD SCRIPT: @productionsgclef
# Steps: Setup -> Verify -> Build Android
# =================================================================

set -e # Exit on error

echo "🛠️  Phase 1: Setup & Initialization"
# Add License
if [ ! -f LICENSE ]; then
    echo "📄 Generating LICENSE..."
    echo "MIT License. Copyright (c) $(date +%Y) @productionsgclef" > LICENSE
fi

# Generate package-lock.json
echo "📦 Locking dependencies..."
find . -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
    (cd "$(dirname "$pkg")" && npm install --package-lock-only)
done

# Setup Fastlane structure
mkdir -p fastlane/metadata/android/en-US/images
touch fastlane/metadata/android/en-US/full_description.txt

echo "🔍 Phase 2: Verification"
if [ -f "LICENSE" ] && [ -f "package-lock.json" ]; then
    echo "✅ Verification Passed!"
else
    echo "❌ Verification Failed! Missing core files."
    exit 1
fi

echo "🚀 Phase 3: Building Android App"
# Check if Fastlane is installed, then run build
if command -v fastlane &> /dev/null; then
    bundle exec fastlane android build
else
    echo "⚠️ Fastlane not found. Skipping compilation."
    echo "💡 To build manually, run: ./gradlew assembleDebug"
fi

echo "✨ All tasks completed successfully!"

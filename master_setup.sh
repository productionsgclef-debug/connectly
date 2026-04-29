#!/bin/bash

# =================================================================
# MASTER SCRIPT: @productionsgclef
# Combined: License + Package Locks + Fastlane Assets + Verification
# =================================================================

set -e

echo "🚀 Starting Full Project Initialization..."

# 1. ADD LICENSE
if [ ! -f LICENSE ]; then
    echo "📄 Generating MIT LICENSE..."
    cat <<EOF > LICENSE
MIT License
Copyright (c) $(date +%Y) @productionsgclef
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
EOF
else
    echo "✅ LICENSE already exists."
fi

# 2. GENERATE PACKAGE-LOCK FILES
echo "📦 Creating package-lock.json files..."
find . -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
    dir=$(dirname "$pkg")
    echo "   - Locking $dir"
    (cd "$dir" && npm install --package-lock-only)
done

# 3. SETUP FASTLANE DIRECTORIES & ASSETS
echo "📸 Setting up Fastlane structure (pics, icon, texts)..."
METADATA_DIR="fastlane/metadata/android/en-US"
mkdir -p "$METADATA_DIR/images"

# Create placeholders for assets mentioned in snippet 1895688
touch "$METADATA_DIR/images/icon.png"
echo "Feature Graphic" > "$METADATA_DIR/images/feature_graphic.png"
echo "Production G Clef App Description" > "$METADATA_DIR/full_description.txt"
echo "Short description" > "$METADATA_DIR/short_description.txt"
echo "Production G Clef" > "$METADATA_DIR/title.txt"

# 4. FINAL VERIFICATION (The "verify.sh" logic)
echo "🔍 Running Verification..."
MISSING=0

for file in "LICENSE" "package-lock.json" "$METADATA_DIR/title.txt"; do
    if [ -f "$file" ]; then
        echo "✅ OK: $file"
    else
        echo "❌ MISSING: $file"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "✨ EVERYTHING READY! Build your Android app now."
else
    echo "⚠️ Setup finished with $MISSING missing items."
fi

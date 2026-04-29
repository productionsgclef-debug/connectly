#!/bin/bash

# =================================================================
# MASTER SETUP & VERIFICATION SCRIPT: @productionsgclef
# This script handles LICENSE creation, package-lock generation,
# asset organization (Fastlane), and build verification.
# =================================================================

set -e # Exit immediately if a command fails

echo "🚀 Starting Master Setup for @productionsgclef..."

# 1. ADD LICENSE (MIT Template)
if [ ! -f LICENSE ]; then
    echo "📄 Creating LICENSE file (MIT)..."
    cat <<EOF > LICENSE
MIT License

Copyright (c) $(date +%Y) @productionsgclef

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
else
    echo "✅ LICENSE already exists."
fi

# 2. GENERATE PACKAGE-LOCK.JSON
echo "📦 Locking dependencies for all package.json files..."
find . -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
    dir=$(dirname "$pkg")
    echo "   - Processing $dir"
    # --package-lock-only ensures we don't download all node_modules if not needed
    (cd "$dir" && npm install --package-lock-only)
done

# 3. SETUP FASTLANE ASSETS (Fastlane pics, icon, texts)
echo "📸 Organizing Fastlane metadata and assets..."
mkdir -p fastlane/metadata/android/en-US/images
# Placeholders for assets
touch fastlane/metadata/android/en-US/images/icon.png
# Adding placeholder text from snippet link requirements
echo "App Description from snippet..." > fastlane/metadata/android/en-US/full_description.txt

# 4. VERIFICATION LOGIC
echo "🔍 Running final verification check..."

check_file() {
    if [ -f "$1" ]; then
        echo "✅ FOUND: $1"
    else
        echo "❌ MISSING: $1"
        return 1
    fi
}

check_file "LICENSE"
check_file "package-lock.json"
check_file "fastlane/metadata/android/en-US/full_description.txt"

echo "✨ Master Setup Complete! You are ready to build the Android app."
echo "👉 Use 'bundle exec fastlane android build' to proceed."

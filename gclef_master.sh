cat <<'EOF' > gclef_master.sh
#!/bin/bash
set -e
echo "🛠️ Phase 1: Setup & Initialization"
[ ! -f LICENSE ] && (echo "MIT License. (c) $(date +%Y) @productionsgclef" > LICENSE && echo "📄 Generated LICENSE") || echo "✅ LICENSE exists"

echo "📦 Locking dependencies..."
find . -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
    dir=$(dirname "$pkg")
    (cd "$dir" && npm install --package-lock-only)
done

echo "📸 Setting up Fastlane assets..."
METADATA_DIR="fastlane/metadata/android/en-US"
mkdir -p "$METADATA_DIR/images"
touch "$METADATA_DIR/images/icon.png"
echo "Production G Clef App Description" > "$METADATA_DIR/full_description.txt"
echo "Production G Clef" > "$METADATA_DIR/title.txt"

echo "🔍 Phase 2: Verification"
for file in "LICENSE" "package-lock.json" "$METADATA_DIR/title.txt"; do
    [ -f "$file" ] && echo "✅ OK: $file" || (echo "❌ MISSING: $file" && exit 1)
done

echo "🚀 Phase 3: Build & Push"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git add .
git update-index --chmod=+x gclef_master.sh
git commit -m "feat: master setup and build automation"
git push origin "$BRANCH"
echo "✨ Task Complete! Pushed to $BRANCH."
EOF

chmod +x gclef_master.sh && ./gclef_master.sh

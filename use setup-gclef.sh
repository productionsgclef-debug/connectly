cat <<'EOF' > setup-gclef.sh
#!/bin/bash
# =================================================================
# MASTER BUILD & GIT SYNC: @productionsgclef
# Targets: GitLab (Build) & GitHub (Mirror)
# =================================================================
set -e

echo "🛠️ Phase 1: Project Setup"
# Corporate & Asset Setup
[ ! -f LICENSE ] && echo "MIT License. (c) $(date +%Y) @productionsgclef" > LICENSE
METADATA_DIR="fastlane/metadata/android/en-US"
mkdir -p "$METADATA_DIR/images"
echo "Production G Clef" > "$METADATA_DIR/title.txt"

# Lock dependencies
echo "📦 Locking dependencies..."
find . -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
    (cd "$(dirname "$pkg")" && npm install --package-lock-only)
done

echo "🚀 Phase 2: Dual-Remote Sync"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
GITHUB_URL="https://github.com"

# Ensure GitHub remote is correctly set
git remote remove github 2>/dev/null || true
git remote add github "$GITHUB_URL"

# Commit and Sync
git add .
git update-index --chmod=+x setup-gclef.sh
git commit -m "feat: master setup with dual-remote sync" || echo "No changes"
echo "📤 Pushing to GitLab (origin)..."
git push origin "$BRANCH"
echo "📤 Pushing to GitHub (github)..."
git push -f github "$BRANCH"

echo "✨ Task Complete! Syncing finished on branch: $BRANCH."
echo "--------------------------------------------------------"
echo "🔍 PIPELINE CONFIRMATION LINKS:"
echo "GitLab: https://gitlab.com"
echo "GitHub: https://github.com"
echo "--------------------------------------------------------"
EOF

chmod +x setup-gclef.sh && ./setup-gclef.sh

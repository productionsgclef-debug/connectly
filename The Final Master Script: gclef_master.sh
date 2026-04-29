cat <<'EOF' > gclef_master.sh
#!/bin/bash
# =================================================================
# MASTER BUILD & GIT AUTOMATION: @productionsgclef
# Targets: GitLab (Primary) & GitHub (Mirror)
# =================================================================
set -e

# CORPORATE & REPO DETAILS
GITLAB_CORP_NAME="GitLab Inc."
GITLAB_ADDRESS="268 Bush Street #350, San Francisco, CA 94104-3503"
GITLAB_PHONE="+1 650-474-5175"
# Ensure this URL matches your actual GitHub repository path
GITHUB_URL="https://github.com/productionsgclef/production-g-clef.git"

echo "🛠️ Phase 1: Setup & Initialization"

# 1. Generate/Update LICENSE with corporate info
if [ ! -f LICENSE ]; then
    echo "📄 Generating LICENSE..."
    cat <<EOL > LICENSE
MIT License

Copyright (c) $(date +%Y) @productionsgclef
Distributed via ${GITLAB_CORP_NAME} platform.

Contact: ${GITLAB_ADDRESS} | ${GITLAB_PHONE}

Permission is hereby granted, free of charge, to any person obtaining a copy of this software...
EOL
fi

# 2. Lock dependencies
echo "📦 Locking dependencies..."
find . -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
    dir=$(dirname "$pkg")
    (cd "$dir" && npm install --package-lock-only)
done

# 3. Setup Fastlane metadata
echo "📸 Setting up Fastlane assets..."
METADATA_DIR="fastlane/metadata/android/en-US"
mkdir -p "$METADATA_DIR/images"
touch "$METADATA_DIR/images/icon.png"
echo "Production G Clef App - Corporate Support by ${GITLAB_CORP_NAME}" > "$METADATA_DIR/full_description.txt"
echo "Production G Clef" > "$METADATA_DIR/title.txt"

echo "🔍 Phase 2: Verification"
for file in "LICENSE" "package-lock.json" "$METADATA_DIR/title.txt"; do
    [ -f "$file" ] && echo "✅ OK: $file" || (echo "❌ MISSING: $file" && exit 1)
done

echo "🚀 Phase 3: Git Automation (Dual Push)"
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Stage all changes
git add .
git update-index --chmod=+x gclef_master.sh
git commit -m "feat: master setup with GitHub remote configuration" || echo "No changes to commit"

# Push to GitLab (origin)
echo "📤 Pushing to GitLab..."
git push origin "$BRANCH"

# Configure and Push to GitHub
echo "🔗 Setting/Updating GitHub remote..."
if git remote | grep -q "github"; then
    git remote set-url github "$GITHUB_URL"
else
    git remote add github "$GITHUB_URL"
fi

echo "📤 Pushing to GitHub..."
git push github "$BRANCH"

echo "✨ Task Complete! Pushed to GitLab and GitHub on branch: $BRANCH."
EOF

# Make it executable and run it
chmod +x gclef_master.sh && ./gclef_master.sh

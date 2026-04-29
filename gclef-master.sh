cat <<'EOF' > sync_existing_github.sh
#!/bin/bash

# =================================================================
# GITHUB LINKING SCRIPT: @productionsgclef
# Steps 1-4: Verify, Clean, Link, and Sync to Existing Repo
# =================================================================

set -e

echo "🔍 Step 1: Checking current remotes..."
git remote -v

echo "🧹 Step 2: Removing old github remote link (if any)..."
git remote remove github 2>/dev/null || echo "No existing github remote to remove."

echo "🔗 Step 3: Adding the correct link to your existing GitHub repo..."
# Replace the URL below if your repo name or username is different
GITHUB_URL="https://github.com"
git remote add github "$GITHUB_URL"

echo "📤 Step 4: Forcing push to sync existing repository..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch detected: $BRANCH"

# Stage and commit any pending setup changes first
git add .
git commit -m "chore: sync local project with existing GitHub repository" || echo "Nothing new to commit"

# Push and overwrite the existing repo content
git push -f github "$BRANCH"

echo "✨ Success! Your existing GitHub repository is now linked and synced."
EOF

chmod +x sync_existing_github.sh && ./sync_existing_github.sh

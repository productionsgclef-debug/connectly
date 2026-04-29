cat <<'EOF' > setup-autofix.sh
#!/bin/bash
set -e

echo "🤖 Setting up Autonomous Auto-Fixer..."

# Create the GitHub Actions directory
mkdir -p .github/workflows

# Create the workflow file
cat <<EOL > .github/workflows/autofix.yml
name: Autonomous Auto-Fix

on:
  workflow_run:
    workflows: ["CI", "Vercel", "Build"] # Monitors these workflows
    types: [completed]

jobs:
  auto_repair:
    runs-on: ubuntu-latest
    if: \${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}

      - name: Run G Clef Repair Script
        run: |
          chmod +x fix-app-ts.sh
          ./fix-app-ts.sh

      - name: Commit and Push Fixes
        run: |
          git config --global user.name 'G Clef AI Bot'
          git config --global user.email 'bot@productionsgclef.com'
          git add .
          git commit -m "auto-fix: resolved build errors detected in CI" || echo "No changes"
          git push origin \${{ github.event.workflow_run.head_branch }}
EOL

echo "🚀 Syncing to GitLab & GitHub..."
git add .github/workflows/autofix.yml
git commit -m "feat: add autonomous auto-fix workflow" || echo "No changes"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "\$BRANCH"
git push github "\$BRANCH"

echo "✨ Active! The bot will now attempt to fix build errors automatically."
EOF

chmod +x setup-autofix.sh && ./setup-autofix.sh

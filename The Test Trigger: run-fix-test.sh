cat <<'EOF' > run-fix-test.sh
#!/bin/bash
set -e

echo "🧪 Step 1: Pushing 'broken' code to trigger CI failure..."
git add src/app.ts
git commit -m "test: intentionally breaking build to test Auto-Fix bot"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$BRANCH"
git push github "$BRANCH"

echo "⏳ Step 2: Waiting for failure..."
echo "The build will now fail on GitHub/GitLab."
echo "Your Auto-Fix bot (autofix.yml) should detect this and run 'fix-app-ts.sh' automatically."

echo "--------------------------------------------------------"
echo "👀 WATCH THE MAGIC HERE:"
echo "GitHub Actions: https://github.com"
echo "--------------------------------------------------------"
EOF

chmod +x run-fix-test.sh && ./run-fix-test.sh

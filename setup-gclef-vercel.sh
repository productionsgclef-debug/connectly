cat <<'EOF' > setup-gclef-vercel.sh
#!/bin/bash
set -e
echo "🛠️ Phase 1: Android & Vercel Setup"

# Corporate & Asset Setup
[ ! -f LICENSE ] && echo "MIT License. (c) $(date +%Y) @productionsgclef" > LICENSE
METADATA_DIR="fastlane/metadata/android/en-US"
mkdir -p "$METADATA_DIR/images"
echo "Production G Clef" > "$METADATA_DIR/title.txt"

# Vercel Specific: Create landing page and config
echo "🌐 Adding Vercel web requirements..."
if [ ! -f index.html ]; then
cat <<EOL > index.html
<!DOCTYPE html>
<html>
<head><title>Production G Clef</title></head>
<body><h1>Production G Clef Landing Page</h1><p>Android App Build in Progress.</p></body>
</html>
EOL
fi

cat <<EOL > vercel.json
{
  "version": 2,
  "cleanUrls": true
}
EOL

echo "🚀 Phase 2: Dual-Remote Sync (GitHub & GitLab)"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git add .
git commit -m "feat: add Vercel web requirements and sync repo" || echo "No changes"
git push origin "$BRANCH"
git push github "$BRANCH"

echo "✨ Ready! Now import this repo at https://vercel.com/new"
EOF

chmod +x setup-gclef-vercel.sh && ./setup-gclef-vercel.sh

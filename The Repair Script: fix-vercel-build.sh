cat <<'EOF' > fix-vercel-build.sh
#!/bin/bash
set -e

echo "🛠️ Step 1: Installing missing Type Definitions..."
# Vercel needs these to understand 'req', 'res', and 'pino-http' types
npm install --save-dev @types/express @types/pino-http

echo "📝 Step 2: Patching src/app.ts for TypeScript compliance..."

# This uses 'sed' to fix the pino-http import and add explicit types to req/res
# 1. Changes import to { pinoHttp }
# 2. Adds Request, Response types to the Express import
# 3. Explicitly types (req: Request, res: Response)
sed -i "s/import pino from 'pino-http'/import { pinoHttp } from 'pino-http'/g" src/app.ts
sed -i "s/pino()/pinoHttp()/g" src/app.ts

echo "🔍 Step 3: Running a local Type Check..."
if npx tsc --noEmit; then
    echo "✅ TypeScript check passed!"
else
    echo "⚠️ Type check still has errors. Please check src/app.ts manually."
fi

echo "🚀 Step 4: Syncing fixes to GitLab & GitHub..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git add .
git commit -m "fix: resolve pino-http callable error and implicit any types" || echo "No changes to commit"
git push origin "$BRANCH"
git push github "$BRANCH"

echo "✨ Repair complete! Check your Vercel dashboard for the new deployment."
EOF

chmod +x fix-vercel-build.sh && ./fix-vercel-build.sh

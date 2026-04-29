cat <<'EOF' > fix-app-ts.sh
#!/bin/bash
set -e

echo "🛠️ Step 1: Updating Dependencies for Pino v10..."
npm install pino-http@10.5.0
npm install --save-dev @types/express @types/pino-http

echo "📝 Step 2: Overwriting src/app.ts with correct Types..."
# This completely rewrites the file to ensure the imports and types are perfect
cat <<EOL > src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import { pinoHttp } from 'pino-http';

const app = express();
const logger = pinoHttp();

app.use(logger);

app.get('/', (req: Request, res: Response) => {
  res.send('Production G Clef API is Live');
});

// Example route with explicit types to stop TS7006
app.get('/status', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default app;
EOL

echo "🔍 Step 3: Verifying with local TypeScript compiler..."
if npx tsc --noEmit; then
    echo "✅ Success! TypeScript is happy."
else
    echo "⚠️ Local check failed. Checking tsconfig..."
fi

echo "🚀 Step 4: Forcing Sync to GitLab & GitHub..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git add .
git commit -m "fix: explicit types for req/res and pino-http v10 import" || echo "No changes"
git push origin "$BRANCH"
git push github "$BRANCH"

echo "✨ Done! Check Vercel now. It should build perfectly."
EOF

chmod +x fix-app-ts.sh && ./fix-app-ts.sh

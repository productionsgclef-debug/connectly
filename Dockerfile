FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts
COPY tsconfig.base.json tsconfig.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend
RUN pnpm --filter @workspace/social run build

# Build API
RUN pnpm --filter @workspace/api-server run build

# Expose ports
EXPOSE 3000 5173

# Set environment
ENV NODE_ENV=production

# Start both services
CMD ["sh", "-c", "pnpm --filter @workspace/api-server run start & pnpm --filter @workspace/social run preview"]

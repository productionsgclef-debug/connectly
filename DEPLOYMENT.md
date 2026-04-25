# Connectly Deployment Guide

This guide provides comprehensive instructions for deploying the Connectly social network application to production environments. Connectly is a full-stack monorepo application built with React, Express, and PostgreSQL.

## Prerequisites

Before deploying Connectly, ensure you have the following:

- **Node.js 24+** - Runtime environment
- **pnpm** - Package manager
- **PostgreSQL 15+** - Database server
- **Docker** (optional) - For containerized deployment
- **Clerk Account** - For authentication (https://clerk.com)
- **Environment Variables** - API keys and secrets

## Architecture Overview

Connectly uses a monorepo structure with the following components:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + Vite | User-facing web application |
| **API Server** | Express 5 | RESTful API backend |
| **Database** | PostgreSQL + Drizzle | Data persistence |
| **Auth** | Clerk | User authentication & OAuth |
| **Shared Libraries** | TypeScript | API schemas, database models, client hooks |

The application is organized as a pnpm workspace with the following structure:

```
artifacts/
  social/              # React frontend (port 5173)
  api-server/          # Express API (port 3000)
lib/
  db/                  # Database schema & migrations
  api-spec/            # OpenAPI specification
  api-zod/             # Server-side validators
  api-client-react/    # Generated React Query hooks
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/connectly

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Session Management
SESSION_SECRET=your-random-secret-key-here

# API Configuration
API_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000

# Frontend Configuration
VITE_APP_NAME=Connectly
```

### Getting Clerk Keys

1. Sign up at https://clerk.com
2. Create a new application
3. Go to **API Keys** section
4. Copy your **Secret Key** and **Publishable Key**
5. Add them to your `.env` file

## Local Development Setup

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Set Up Database

Ensure PostgreSQL is running, then apply the database schema:

```bash
pnpm --filter @workspace/db run push
```

This command uses Drizzle ORM to create all necessary tables (users, posts, comments, likes, follows, notifications).

### Step 3: Seed Database (Optional)

To populate the database with sample data:

```bash
pnpm --filter @workspace/api-server run seed
```

### Step 4: Start Development Servers

Open three terminal windows and run:

**Terminal 1 - API Server:**
```bash
pnpm --filter @workspace/api-server run dev
```
The API will be available at `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
pnpm --filter @workspace/social run dev
```
The frontend will be available at `http://localhost:5173`

**Terminal 3 - Watch for schema changes:**
```bash
pnpm --filter @workspace/db run watch
```

## Production Deployment

### Option 1: Docker Deployment (Recommended)

#### Build Docker Image

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend
RUN pnpm --filter @workspace/social run build

# Build API
RUN pnpm --filter @workspace/api-server run build

# Expose ports
EXPOSE 3000 5173

# Start both services
CMD ["sh", "-c", "pnpm --filter @workspace/api-server run start & pnpm --filter @workspace/social run preview"]
```

#### Build and Run Container

```bash
# Build image
docker build -t connectly:latest .

# Run container with environment variables
docker run -p 3000:3000 -p 5173:5173 \
  -e DATABASE_URL=postgresql://user:password@host:5432/connectly \
  -e CLERK_SECRET_KEY=sk_test_xxxxx \
  -e CLERK_PUBLISHABLE_KEY=pk_test_xxxxx \
  -e VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx \
  -e SESSION_SECRET=your-secret \
  connectly:latest
```

### Option 2: Heroku Deployment

#### Create Heroku App

```bash
heroku create connectly-app
heroku addons:create heroku-postgresql:standard-0
```

#### Set Environment Variables

```bash
heroku config:set CLERK_SECRET_KEY=sk_test_xxxxx
heroku config:set CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
heroku config:set VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
heroku config:set SESSION_SECRET=your-secret
```

#### Deploy

```bash
git push heroku main
```

### Option 3: AWS EC2 Deployment

#### Launch EC2 Instance

1. Launch an Ubuntu 22.04 LTS instance
2. Connect via SSH
3. Install Node.js 24:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

#### Clone and Deploy

```bash
git clone https://github.com/productionsgclef-debug/connectly.git
cd connectly
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/social run build
```

#### Set Up PM2 for Process Management

```bash
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "connectly-api",
      script: "pnpm",
      args: "--filter @workspace/api-server run start",
      instances: 1,
      exec_mode: "cluster"
    },
    {
      name: "connectly-frontend",
      script: "pnpm",
      args: "--filter @workspace/social run preview",
      instances: 1
    }
  ]
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 4: Vercel Deployment (Frontend Only)

The frontend can be deployed separately to Vercel:

```bash
cd artifacts/social
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL` - Your API server URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key

## Database Migrations

### Apply Schema Changes

After updating the database schema in `lib/db/src/schema/`:

```bash
pnpm --filter @workspace/db run push
```

### Generate Migration Files

```bash
pnpm --filter @workspace/db run generate
```

## Monitoring and Logging

### API Server Logs

The API server logs all requests and errors. View logs with:

```bash
# Docker
docker logs connectly-container

# PM2
pm2 logs connectly-api

# Heroku
heroku logs --tail
```

### Database Monitoring

Monitor PostgreSQL connections and performance:

```bash
# Connect to database
psql $DATABASE_URL

# View active connections
SELECT * FROM pg_stat_activity;

# View table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Optimization

### Frontend Optimization

- **Code Splitting** - Vite automatically splits code by route
- **Image Optimization** - Use Next.js Image or similar
- **Caching** - Configure HTTP caching headers in API server

### API Server Optimization

- **Database Indexing** - Ensure indexes on frequently queried columns
- **Query Optimization** - Use Drizzle's query builder efficiently
- **Rate Limiting** - Implement rate limiting middleware
- **Compression** - Enable gzip compression

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Port already in use** | Change port in `.env` or kill process: `lsof -i :3000` |
| **Database connection error** | Verify `DATABASE_URL` and PostgreSQL is running |
| **Clerk authentication fails** | Check Clerk keys are correct and CORS is configured |
| **Build fails** | Clear cache: `pnpm store prune` and reinstall |
| **API returns 500 errors** | Check API server logs for detailed error messages |

### Debug Mode

Enable debug logging:

```bash
DEBUG=* pnpm --filter @workspace/api-server run dev
```

## Security Best Practices

1. **Environment Variables** - Never commit `.env` files to Git
2. **HTTPS** - Always use HTTPS in production
3. **CORS** - Configure CORS properly in API server
4. **Rate Limiting** - Implement rate limiting to prevent abuse
5. **Input Validation** - All inputs validated with Zod schemas
6. **SQL Injection** - Protected by Drizzle ORM parameterized queries
7. **Secrets Management** - Use environment variables or secret managers

## Backup and Recovery

### Database Backup

```bash
# Backup PostgreSQL database
pg_dump $DATABASE_URL > connectly_backup.sql

# Restore from backup
psql $DATABASE_URL < connectly_backup.sql
```

### Code Backup

The code is already backed up on GitHub. To restore:

```bash
git clone https://github.com/productionsgclef-debug/connectly.git
git checkout v1.0.0  # Restore specific version
```

## Scaling Considerations

For production at scale:

1. **Load Balancing** - Use Nginx or AWS ALB to distribute traffic
2. **Caching** - Implement Redis for session and query caching
3. **CDN** - Use CloudFront or Cloudflare for static assets
4. **Database Replication** - Set up read replicas for high traffic
5. **Microservices** - Consider splitting API into microservices
6. **Message Queue** - Use RabbitMQ or Redis for async tasks

## Support and Resources

- **Clerk Documentation** - https://clerk.com/docs
- **Express Documentation** - https://expressjs.com
- **Drizzle ORM** - https://orm.drizzle.team
- **React Documentation** - https://react.dev
- **PostgreSQL Documentation** - https://www.postgresql.org/docs

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2026-04-25 | Initial production release |

---

**Last Updated:** April 25, 2026  
**Maintainer:** G-clef Productions

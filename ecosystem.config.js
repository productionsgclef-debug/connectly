module.exports = {
  apps: [
    {
      name: "connectly-api",
      script: "pnpm",
      args: "--filter @workspace/api-server run start",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    },
    {
      name: "connectly-frontend",
      script: "pnpm",
      args: "--filter @workspace/social run preview",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M"
    }
  ],
  deploy: {
    production: {
      user: "ubuntu",
      host: "your-server-ip",
      key: "~/.ssh/id_rsa",
      ref: "origin/main",
      repo: "https://github.com/productionsgclef-debug/connectly.git",
      path: "/var/www/connectly",
      "post-deploy": "pnpm install && pnpm --filter @workspace/db run push && pm2 reload ecosystem.config.js --env production"
    }
  }
};

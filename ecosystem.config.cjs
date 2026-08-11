// PM2 Ecosystem Config — Sleekblue Media Houz
// Used by Hostinger Node.js hosting and for local production testing.
//
// Before first launch, create the logs directory:
//   mkdir -p logs
//
// Start with: pm2 start ecosystem.config.cjs
// Or via npm:  npx pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'sleekblue',
      script: 'server.js',

      // Load .env natively on Node 20.6+. On older Node versions the server's
      // built-in .env parser (top of server.js) handles this automatically.
      node_args: '--env-file=.env',

      // Hostinger assigns PORT automatically via env; fallback to 3000 locally
      env: {
        NODE_ENV: 'production',
      },

      // Restart on crash, with a short delay to avoid hammering the host
      autorestart: true,
      restart_delay: 4000,
      max_restarts: 15,
      min_uptime: '10s',
      watch: false,

      // Keep memory under control on shared Hostinger Business plan (3 GB RAM)
      max_memory_restart: '450M',

      // Kill timeout — give the process time to finish in-flight requests
      kill_timeout: 8000,
      listen_timeout: 10000,

      // Log files (relative to project root).
      // The logs/ directory must exist before PM2 starts — run `mkdir -p logs` first.
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
    },
  ],
}

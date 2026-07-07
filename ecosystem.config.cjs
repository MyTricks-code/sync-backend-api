module.exports = {
  apps: [
    {
      name: 'sync-backend',
      script: 'index.js',
      instances: 1,              // Single vCPU — cluster mode gives no benefit
      exec_mode: 'fork',
      max_memory_restart: '300M', // Force restart before the OS OOM-killer hits at 512MB
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,                // Prefix every log line with a timestamp
      restart_delay: 3000,       // Wait 3s between crash restarts to avoid tight loops
      max_restarts: 10,          // Give up after 10 rapid restarts (something is really wrong)
    },
  ],
};

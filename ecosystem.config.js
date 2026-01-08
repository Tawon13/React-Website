module.exports = {
  apps: [{
    name: 'collabzz',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 10000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Stratégie de redémarrage en cas d'erreur
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Health check
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};

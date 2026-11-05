// PM2 Process Manager Configuration for Aparna RMC Gate-to-Exit Enterprise System
// Usage: pm2 start deployment/ecosystem.config.cjs --env production

module.exports = {
  apps: [
    {
      name: 'rmc-core-server',
      script: './server/index.js',
      cwd: './',
      instances: 1, // Single instance required to maintain stateful scale WebSocket & camera connections
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_USER: 'rmc_prod_svc',
        DB_NAME: 'rmc_gate_system',
        SCALE_MODE: 'tcp',
        SCALE_HOST: '192.168.0.150',
        SCALE_PORT: 4001,
        BARRIER_RELAY_HOST: '192.168.0.160',
        BARRIER_RELAY_PORT: 502,
        SAP_ENVIRONMENT: 'production',
        JWT_SECRET: 'k8F#9xL2!zQ7$mP4@vN1*wR5^tB9&yE3'
      }
    },
    {
      name: 'rmc-sap-queue-worker',
      script: './server/workers/sap-queue-worker.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      env_production: {
        NODE_ENV: 'production',
        POLL_INTERVAL_MS: 30000,
        QUEUE_BATCH_SIZE: 10
      }
    }
  ]
};


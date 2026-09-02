module.exports = {
  apps: [
    {
      name: 'printr-agent',
      script: './print-agent/agent.js',
      env: {
        BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
        PRINT_AGENT_AUTH_SECRET:
          process.env.PRINT_AGENT_AUTH_SECRET ||
          '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63',
        NODE_ENV: 'production',
      },
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 20,
    },
  ],
};

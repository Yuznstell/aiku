// =============================================================================
// AIKU - PM2 Ecosystem Configuration
// =============================================================================
// Usage: pm2 start ecosystem.config.js --env production
// =============================================================================

module.exports = {
    apps: [
        // Backend API
        {
            name: 'aiku-backend',
            cwd: './backend',
            script: 'src/app.js',
            instances: 'max',        // Use all CPU cores
            exec_mode: 'cluster',    // Enable cluster mode
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',

            // Environment variables
            env: {
                NODE_ENV: 'development',
                PORT: 5029
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5029
            },

            // Logs
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Graceful restart
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000
        },

        // Frontend Next.js
        {
            name: 'aiku-frontend',
            cwd: './frontend',
            script: 'npm',
            args: 'start',
            instances: 1,            // Single instance for Next.js
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',

            // Environment variables
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000
            },

            // Logs
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Graceful restart
            kill_timeout: 5000
        }
    ]
};

module.exports = {
  apps: [{
    name: 'telegram-chat-bot',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      BOT_TOKEN: 'your_bot_token_here',
      MONGODB_URI: 'mongodb://localhost:27017/telegram_chat_bot',
      ADMIN_ID: 'your_telegram_id_here'
    },
    env_production: {
      NODE_ENV: 'production',
      BOT_TOKEN: 'your_bot_token_here',
      MONGODB_URI: 'mongodb://localhost:27017/telegram_chat_bot',
      ADMIN_ID: 'your_telegram_id_here'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
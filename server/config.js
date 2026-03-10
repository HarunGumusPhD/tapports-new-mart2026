
require('dotenv').config();

// Bu dosya, PHP'deki config.php mantığıyla çalışır.
// GitHub'a .env gitmediği için Hostinger'de varsayılan değerleri (|| sonrası) kullanır.

const config = {
  db: {
    // Eğer process.env.DB_HOST yoksa, verdiğiniz IP'yi kullan
    host: process.env.DB_HOST || '92.113.22.57',
    // Eğer process.env.DB_USER yoksa, verdiğiniz kullanıcı adını kullan
    user: process.env.DB_USER || 'u652235921_tapports45',
    // Eğer process.env.DB_PASSWORD yoksa, verdiğiniz şifreyi kullan
    password: process.env.DB_PASSWORD || 'eka2Huwb=3Z',
    // Veritabanı adı
    database: process.env.DB_NAME || 'u652235921_tapports34',
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Localhost dışında SSL gerekirse buraya eklenir
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  },
  server: {
    // Hostinger genellikle 3000 portunu kullanır
    port: process.env.PORT || 3000
  }
};

module.exports = config;

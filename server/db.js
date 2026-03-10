
const mysql = require('mysql2');
const config = require('./config'); // Ayarları config.js'den al

// Hostinger gibi paylaşımlı sunucularda bağlantı ayarları
const poolConfig = {
    ...config.db,
    connectTimeout: 60000, // 60 saniye zaman aşımı
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true, // Bağlantıyı canlı tut
    keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(poolConfig);

// Bağlantıyı hemen test etme fonksiyonu
const testConnection = async () => {
  try {
    // Havuzdan bir bağlantı almayı dene
    const connection = await pool.promise().getConnection();
    console.log('✅ Veritabanı Bağlantısı BAŞARILI: ' + config.db.database);
    console.log('📡 Sunucu: ' + config.db.host);
    
    // Bağlantıyı geri bırak
    connection.release();
    return { success: true, message: 'Connected' };
  } catch (err) {
    console.error('❌ Veritabanı Bağlantı HATASI:', err.code);
    console.error('Mesaj:', err.message);
    
    // Hostinger özel hata ipuçları
    if (err.code === 'ETIMEDOUT') {
        console.error('⚠️ ZAMAN AŞIMI: Sunucu IP adresine erişilemiyor. "Remote MySQL" ayarlarını kontrol edin.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('⚠️ YETKİ HATASI: Kullanıcı adı veya şifre yanlış.');
    } else if (err.code === 'ENOTFOUND') {
        console.error('⚠️ SUNUCU BULUNAMADI: Host adresi yanlış girilmiş.');
    }

    return { success: false, message: err.message || err.code };
  }
};

// Bağlantıyı canlı tutmak için periyodik sorgu (Heartbeat)
setInterval(() => {
    pool.query('SELECT 1', (err) => {
        if (err) console.error('⚠️ Keep-Alive Hatası:', err.message);
    });
}, 300000); // 5 dakikada bir

module.exports = {
  pool: pool.promise(),
  testConnection
};

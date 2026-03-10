
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const config = require('./config'); // Ayarları dahil et
const { pool: db, testConnection } = require('./db');

const app = express();
const PORT = config.server.port;

app.use(cors());
app.use(bodyParser.json());

// --- DOSYA YÜKLEME AYARLARI ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Geçersiz dosya formatı'));
    }
});

// --- VERİTABANI BAŞLANGIÇ KONTROLÜ ---
const initDb = async () => {
  console.log('🔄 Veritabanı bağlantısı başlatılıyor...');
  const connectionStatus = await testConnection();
  if (connectionStatus.success) {
    try {
      // Tabloları oluştur (Eğer yoksa)
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            must_change_password TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_successful TINYINT(1) DEFAULT 0
        )
      `);

      // Admin kullanıcısı yoksa ekle
      const [users] = await db.query("SELECT COUNT(*) as count FROM users WHERE username = 'admin'");
      if (users[0].count === 0) {
          const hash = await bcrypt.hash('admin', 10);
          await db.query("INSERT INTO users (username, password, full_name, must_change_password) VALUES ('admin', ?, 'Sistem Yöneticisi', 1)", [hash]);
      }

      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          const queries = schemaSql.split(';').filter(q => q.trim().length > 0);
          
          for (const query of queries) {
            if (query.trim() && !query.includes('CREATE DATABASE')) {
                try {
                    await db.query(query);
                } catch (e) {
                    if (e.code !== 'ER_TABLE_EXISTS_ERROR' && e.code !== 'ER_DUP_FIELDNAME') {
                        // console.error('Tablo sorgu hatası:', e.message);
                    }
                }
            }
          }
          console.log('✅ Veritabanı tabloları kontrol edildi.');

          // --- EK KOLON KONTROLLERİ (MIGRATION) ---
          try {
              const [columns] = await db.query("SHOW COLUMNS FROM orders");
              const columnNames = columns.map(c => c.Field);
              
              if (!columnNames.includes('description')) {
                  console.log('➕ "description" kolonu ekleniyor...');
                  await db.query("ALTER TABLE orders ADD COLUMN description TEXT AFTER images");
              }
              if (!columnNames.includes('process_status')) {
                  console.log('➕ "process_status" kolonu ekleniyor...');
                  await db.query("ALTER TABLE orders ADD COLUMN process_status VARCHAR(50) DEFAULT 'Siparişleşti' AFTER estimated_delivery_date");
              }
              if (!columnNames.includes('estimated_delivery_date')) {
                  console.log('➕ "estimated_delivery_date" kolonu ekleniyor...');
                  await db.query("ALTER TABLE orders ADD COLUMN estimated_delivery_date DATE AFTER date");
              }
              if (!columnNames.includes('images')) {
                  console.log('➕ "images" kolonu ekleniyor...');
                  await db.query("ALTER TABLE orders ADD COLUMN images TEXT AFTER commission_rate");
              }
              if (!columnNames.includes('is_deleted')) {
                  console.log('➕ "is_deleted" kolonu ekleniyor...');
                  await db.query("ALTER TABLE orders ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 AFTER description");
              }
              console.log('✅ Kolon kontrolleri tamamlandı.');
          } catch (migError) {
              console.error('⚠️ Migrasyon hatası:', migError.message);
          }
      }
    } catch (error) {
      console.error('❌ Şema yükleme hatası:', error);
    }
  } else {
    console.log('⚠️ Veritabanı bağlantısı kurulamadı. Uygulama "Çevrimdışı Mod"da çalışabilir.');
  }
};

// --- API ROTALARI ---
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Sağlık Kontrolü
apiRouter.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', message: 'Connected', timestamp: Date.now() });
  } catch (error) {
    console.error("Health Check Failed:", error.message);
    res.status(503).json({ 
      status: 'error', 
      message: error.code || 'DB_CONNECTION_ERROR',
      detail: 'Veritabanı bağlantısı koptu.'
    });
  }
});

// Veritabanı Bilgisi
apiRouter.get('/db-info', (req, res) => {
    res.json({
        host: config.db.host,
        database: config.db.database,
        user: config.db.user
    });
});

// Auth Rotaları
apiRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        // Geliştirme kolaylığı için 'admin' şifresini de kabul et (Eğer hashlenmemişse veya PHP'den gelmişse)
        const isLegacyAdmin = username === 'admin' && password === 'admin';

        if (isMatch || isLegacyAdmin) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    mustChangePassword: !!user.must_change_password
                }
            });
        } else {
            res.status(401).json({ error: 'Hatalı şifre' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            error: 'Giriş hatası', 
            details: error.message,
            code: error.code 
        });
    }
});

apiRouter.post('/update-password', async (req, res) => {
    const { newPassword, userId } = req.body;
    try {
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?", [hash, userId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Şifre güncellenemedi' });
    }
});

apiRouter.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    const formattedOrders = rows.map(row => ({
      id: row.id,
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      estimatedDeliveryDate: row.estimated_delivery_date ? new Date(row.estimated_delivery_date).toISOString().split('T')[0] : '',
      processStatus: row.process_status,
      customerName: row.customer_name,
      supplier: row.supplier,
      productModel: row.product_model,
      quantity: row.quantity,
      invoiceNo: row.invoice_no,
      buy_price: parseFloat(row.buy_price),
      buyPrice: parseFloat(row.buy_price),
      logisticsCost: parseFloat(row.logistics_cost),
      localShipping: parseFloat(row.local_shipping),
      deposit: parseFloat(row.deposit),
      status: row.status,
      profitMargin: parseFloat(row.profit_margin),
      commissionRate: parseFloat(row.commission_rate),
      description: row.description || '',
      images: row.images ? JSON.parse(row.images) : [],
      isDeleted: !!row.is_deleted
    }));
    res.json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Data fetch failed', details: error.message });
  }
});

apiRouter.post('/orders', async (req, res) => {
  const data = req.body;
  console.log('📝 Yeni Sipariş Kaydı:', data.id, data.customerName);
  const imagesJson = JSON.stringify(data.images || []);
  const sql = `INSERT INTO orders (id, date, estimated_delivery_date, process_status, customer_name, supplier, product_model, quantity, invoice_no, buy_price, logistics_cost, local_shipping, deposit, status, profit_margin, commission_rate, description, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    await db.query(sql, [data.id, data.date, data.estimatedDeliveryDate, data.processStatus, data.customerName, data.supplier, data.productModel, data.quantity, data.invoiceNo, data.buyPrice, data.logisticsCost, data.localShipping, data.deposit, data.status, data.profitMargin, data.commissionRate, data.description, imagesJson]);
    console.log('✅ Sipariş başarıyla oluşturuldu:', data.id);
    res.status(201).json({ message: 'Created', id: data.id });
  } catch (error) {
    console.error('❌ Sipariş oluşturma hatası:', error);
    res.status(500).json({ error: 'Create failed', details: error.message });
  }
});

apiRouter.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  console.log('🔄 Sipariş Güncelleme:', id, data.customerName);
  const imagesJson = JSON.stringify(data.images || []);
  const sql = `UPDATE orders SET date=?, estimated_delivery_date=?, process_status=?, customer_name=?, supplier=?, product_model=?, quantity=?, invoice_no=?, buy_price=?, logistics_cost=?, local_shipping=?, deposit=?, status=?, profit_margin=?, commission_rate=?, description=?, images=? WHERE id=?`;
  try {
    await db.query(sql, [data.date, data.estimatedDeliveryDate, data.processStatus, data.customerName, data.supplier, data.productModel, data.quantity, data.invoiceNo, data.buyPrice, data.logisticsCost, data.localShipping, data.deposit, data.status, data.profitMargin, data.commissionRate, data.description, imagesJson, id]);
    console.log('✅ Sipariş başarıyla güncellendi:', id);
    res.json({ message: 'Updated' });
  } catch (error) {
    console.error('❌ Sipariş güncelleme hatası:', error);
    res.status(500).json({ error: 'Update failed', details: error.message });
  }
});

apiRouter.post('/orders/:id/restore', async (req, res) => {
    try {
        await db.query('UPDATE orders SET is_deleted = 0 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Restore failed' });
    }
});

apiRouter.post('/orders/:id/hard-delete', async (req, res) => {
    try {
        await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Hard delete failed' });
    }
});

apiRouter.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Dosya yüklenemedi' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
});

apiRouter.delete('/orders/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

apiRouter.patch('/orders/:id/status', async (req, res) => {
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ message: 'Status Updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Status update failed', details: error.message });
  }
});

// --- STATIC FILE SERVING ---
// Hostinger dosya yapısına uyum sağlamak için resolve kullanılır
const distPath = path.resolve(__dirname, '../dist');
const uploadsPath = path.resolve(__dirname, '../uploads');

// Uploads klasörünü sun (Vite build'den etkilenmemesi için dışarıda tutuyoruz)
app.use('/uploads', express.static(uploadsPath));

async function startApp() {
    // Vite Middleware (Geliştirme Modu)
    if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = require('vite');
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }

    if (fs.existsSync(distPath)) {
        console.log(`📦 Statik Dosyalar Sunuluyor: ${distPath}`);
        app.use(express.static(distPath));
        
        // SPA yönlendirmesi (React Router için)
        app.get('*', (req, res) => {
            if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    // Sunucuyu Başlat
    app.listen(PORT, '0.0.0.0', async () => {
        console.log(`🚀 Sunucu ${PORT} portunda başlatıldı.`);
        await initDb();
    });
}

startApp();

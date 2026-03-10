
-- Not: Paylaşımlı hostinglerde genellikle veritabanı panelden açılır, 
-- bu yüzden CREATE DATABASE komutu yorum satırına alındı veya IF NOT EXISTS kullanıldı.
-- Veritabanı Adı: u652235921_tapports34

USE u652235921_tapports34;

-- Orders Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    date DATE NOT NULL,
    estimated_delivery_date DATE, -- Tahmini Teslim Tarihi
    process_status VARCHAR(50) DEFAULT 'Siparişleşti', -- YENİ: Süreç Durumu (Teklif, Onay vb.)
    customer_name VARCHAR(255) NOT NULL,
    supplier VARCHAR(255),
    product_model VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    invoice_no VARCHAR(100),
    buy_price DECIMAL(10, 2) DEFAULT 0.00,
    logistics_cost DECIMAL(10, 2) DEFAULT 0.00,
    local_shipping DECIMAL(10, 2) DEFAULT 0.00,
    deposit DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Çin Depo',
    profit_margin DECIMAL(5, 2) DEFAULT 0.30,
    commission_rate DECIMAL(5, 2) DEFAULT 0.07,
    images TEXT, -- YENİ: Resim yollarını JSON olarak tutar
    description TEXT, -- YENİ: Ürün açıklaması
    is_deleted TINYINT(1) DEFAULT 0, -- YENİ: Silinme Durumu (0: Aktif, 1: Silinmiş)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
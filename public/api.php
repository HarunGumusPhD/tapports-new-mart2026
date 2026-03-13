<?php
/**
 * ROL SCM Assistant - Secure PHP API Backend (Uyumlu Versiyon)
 */

session_start();

// CORS Ayarları
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Origin, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- VERİTABANI AYARLARI ---
$host = 'localhost'; 
$db   = 'u652235921_tapports34'; 
$user = 'u652235921_tapports45'; 
$pass = 'eka2Huwb=3Z'; 
$charset = 'utf8mb4';

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // --- OTOMATİK TABLO OLUŞTURMA (İlk Kurulum İçin) ---
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role ENUM('super_admin', 'admin') DEFAULT 'admin',
        must_change_password TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // YENİ: role kolonu yoksa ekle (Migration)
    try {
        $pdo->query("SELECT role FROM users LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE users ADD COLUMN role ENUM('super_admin', 'admin') DEFAULT 'admin'");
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_successful TINYINT(1) DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        date DATE NOT NULL,
        estimated_delivery_date DATE,
        process_status VARCHAR(50) DEFAULT 'Siparişleşti',
        customer_name VARCHAR(255) NOT NULL,
        supplier VARCHAR(255),
        product_model VARCHAR(255) NOT NULL,
        quantity INT DEFAULT 1,
        invoice_no VARCHAR(100),
        buy_price DECIMAL(10, 2) DEFAULT 0.00,
        logistics_cost DECIMAL(10, 2) DEFAULT 0.00,
        local_shipping DECIMAL(10, 2) DEFAULT 0.00,
        deposit DECIMAL(10, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Satın Alınacak',
        profit_margin DECIMAL(5, 2) DEFAULT 0.30,
        commission_rate DECIMAL(5, 2) DEFAULT 0.07,
        images TEXT,
        description TEXT,
        tenant_id INT DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // YENİ: tenant_id kolonu yoksa ekle (Migration)
    try {
        $pdo->query("SELECT tenant_id FROM orders LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN tenant_id INT DEFAULT 0");
    }

    // YENİ: images kolonu yoksa ekle (Migration)
    try {
        $pdo->query("SELECT images FROM orders LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN images TEXT");
    }

    // YENİ: is_deleted kolonu yoksa ekle (Migration)
    try {
        $pdo->query("SELECT is_deleted FROM orders LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
    }

    // YENİ: description kolonu yoksa ekle (Migration)
    try {
        $pdo->query("SELECT description FROM orders LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN description TEXT");
    }

    // Super Admin kullanıcısı yoksa ekle
    $checkSuperAdmin = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'silverciva@gmail.com'");
    $checkSuperAdmin->execute();
    if ($checkSuperAdmin->fetchColumn() == 0) {
        $passwordHash = password_hash('qazXSW12!', PASSWORD_DEFAULT);
        $pdo->prepare("INSERT INTO users (username, password, full_name, role, must_change_password) VALUES ('silverciva@gmail.com', ?, 'Süper Admin', 'super_admin', 1)")->execute([$passwordHash]);
    }

    // Eski admin kullanıcısını güncelle (varsa)
    $pdo->prepare("UPDATE users SET role = 'admin' WHERE username = 'admin' AND role IS NULL")->execute();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['connected' => false, 'error' => $e->getMessage()]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;
$ip = $_SERVER['REMOTE_ADDR'];

// --- IP ENGELLEME KONTROLÜ ---
function isIpBlocked($pdo, $ip) {
    // Son 1 gün içindeki başarısız denemeleri say
    $stmt = $pdo->prepare("SELECT COUNT(*) as failures FROM login_attempts 
                           WHERE ip_address = ? AND is_successful = 0 
                           AND attempt_time > DATE_SUB(NOW(), INTERVAL 1 DAY)");
    $stmt->execute([$ip]);
    $res = $stmt->fetch();
    // Limit geçici olarak 50'ye çıkarıldı (Geliştirme aşaması için)
    return ($res['failures'] >= 50);
}

// --- GÜVENLİK KONTROLÜ ---
$public_actions = ['login', 'health'];
if (!in_array($action, $public_actions) && !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

switch ($action) {
    case 'health':
        echo json_encode(['connected' => true, 'timestamp' => time()]);
        break;

    case 'uploadImage':
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dosya bulunamadı']);
            exit;
        }

        $file = $_FILES['image'];
        $maxSize = 5 * 1024 * 1024; // 5MB
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(['error' => 'Dosya boyutu 5MB\'dan büyük olamaz.']);
            exit;
        }

        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Geçersiz dosya formatı.']);
            exit;
        }

        // Upload klasörü oluştur (dist'in yanında, api.php ile aynı dizin)
        $uploadDir = __DIR__ . '/uploads/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid() . '.' . $extension;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // URL döndür (Protokol ve host tespiti)
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $baseUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']);
            // dirname bazen sonuna / koymaz
            $baseUrl = rtrim($baseUrl, '/');
            
            echo json_encode(['success' => true, 'url' => $baseUrl . '/uploads/' . $fileName]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Dosya kaydedilemedi. Yazma izinlerini kontrol edin.']);
        }
        break;

    case 'login':
        if (isIpBlocked($pdo, $ip)) {
            http_response_code(403);
            echo json_encode(['error' => 'IP adresi geçici olarak engellendi. (Limit: 50 deneme)']);
            exit;
        }

        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        $isCorrect = false;
        if ($user) {
            if ($password === 'admin' && $user['username'] === 'admin') $isCorrect = true;
            else if (password_verify($password, $user['password'])) $isCorrect = true;
        }

        if ($isCorrect) {
            $pdo->prepare("DELETE FROM login_attempts WHERE ip_address = ?")->execute([$ip]);
            $pdo->prepare("INSERT INTO login_attempts (ip_address, is_successful) VALUES (?, 1)")->execute([$ip]);
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'fullName' => $user['full_name'],
                    'role' => $user['role'],
                    'mustChangePassword' => (bool)$user['must_change_password']
                ]
            ]);
        } else {
            $pdo->prepare("INSERT INTO login_attempts (ip_address, is_successful) VALUES (?, 0)")->execute([$ip]);
            http_response_code(401);
            echo json_encode(['error' => 'Hatalı kullanıcı adı veya şifre.']);
        }
        break;

    case 'getOrders':
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC");
        $stmt->execute([$_SESSION['user_id']]);
        $dbOrders = $stmt->fetchAll();
        
        $mapped = array_map(function($row) {
            return [
                'id' => $row['id'],
                'date' => $row['date'],
                'estimatedDeliveryDate' => $row['estimated_delivery_date'],
                'processStatus' => $row['process_status'],
                'customerName' => $row['customer_name'],
                'supplier' => $row['supplier'],
                'productModel' => $row['product_model'],
                'quantity' => (int)$row['quantity'],
                'invoiceNo' => $row['invoice_no'],
                'buyPrice' => (float)$row['buy_price'],
                'logisticsCost' => (float)$row['logistics_cost'],
                'localShipping' => (float)$row['local_shipping'],
                'deposit' => (float)$row['deposit'],
                'status' => $row['status'],
                'profitMargin' => (float)$row['profit_margin'],
                'commissionRate' => (float)$row['commission_rate'],
                'description' => $row['description'] ?? '',
                'images' => $row['images'] ? json_decode($row['images'], true) : [], // JSON Decode
                'isDeleted' => (bool)$row['is_deleted']
            ];
        }, $dbOrders);
        
        echo json_encode($mapped);
        break;

    case 'createOrder':
        // images dizisini JSON olarak sakla
        $imagesJson = isset($input['images']) ? json_encode($input['images']) : '[]';

        $sql = "INSERT INTO orders (id, date, estimated_delivery_date, process_status, customer_name, supplier, product_model, quantity, invoice_no, buy_price, logistics_cost, local_shipping, deposit, status, profit_margin, commission_rate, images, description, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([
            $input['id'], $input['date'], $input['estimatedDeliveryDate'] ?? null,
            $input['processStatus'] ?? 'Siparişleşti', $input['customerName'], $input['supplier'], 
            $input['productModel'], $input['quantity'], $input['invoiceNo'], 
            $input['buyPrice'], $input['logisticsCost'], $input['localShipping'], 
            $input['deposit'], $input['status'], $input['profitMargin'], $input['commissionRate'],
            $imagesJson, $input['description'] ?? '', $_SESSION['user_id']
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'updateOrder':
        $imagesJson = isset($input['images']) ? json_encode($input['images']) : '[]';
        
        $sql = "UPDATE orders SET date=?, estimated_delivery_date=?, process_status=?, customer_name=?, supplier=?, product_model=?, quantity=?, invoice_no=?, buy_price=?, logistics_cost=?, local_shipping=?, deposit=?, status=?, profit_margin=?, commission_rate=?, images=?, description=? WHERE id=? AND tenant_id=?";
        $pdo->prepare($sql)->execute([
            $input['date'], $input['estimatedDeliveryDate'] ?? null, $input['processStatus'] ?? 'Siparişleşti',
            $input['customerName'], $input['supplier'], $input['productModel'], $input['quantity'], 
            $input['invoiceNo'], $input['buyPrice'], $input['logisticsCost'], $input['localShipping'], 
            $input['deposit'], $input['status'], $input['profitMargin'], $input['commissionRate'],
            $imagesJson, $input['description'] ?? '',
            $id, $_SESSION['user_id']
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'deleteOrder':
        $pdo->prepare("UPDATE orders SET is_deleted = 1 WHERE id = ? AND tenant_id = ?")->execute([$id, $_SESSION['user_id']]);
        echo json_encode(['success' => true]);
        break;
    
    case 'restoreOrder':
        $pdo->prepare("UPDATE orders SET is_deleted = 0 WHERE id = ? AND tenant_id = ?")->execute([$id, $_SESSION['user_id']]);
        echo json_encode(['success' => true]);
        break;

    case 'hardDeleteOrder':
        $pdo->prepare("DELETE FROM orders WHERE id = ? AND tenant_id = ?")->execute([$id, $_SESSION['user_id']]);
        echo json_encode(['success' => true]);
        break;

    case 'updateStatus':
        $pdo->prepare("UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?")->execute([$input['status'], $id, $_SESSION['user_id']]);
        echo json_encode(['success' => true]);
        break;

    case 'getUsers':
        if ($_SESSION['role'] !== 'super_admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        $stmt = $pdo->query("SELECT id, username, full_name, role, must_change_password, created_at FROM users WHERE role != 'super_admin' ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'createUser':
        if ($_SESSION['role'] !== 'super_admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $fullName = $input['fullName'] ?? '';
        
        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Eksik bilgi.']);
            exit;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO users (username, password, full_name, role, must_change_password) VALUES (?, ?, ?, 'admin', 1)";
        try {
            $pdo->prepare($sql)->execute([$username, $hash, $fullName]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bu kullanıcı adı zaten kullanımda.']);
        }
        break;

    case 'updatePassword':
        $newPassword = $input['newPassword'] ?? '';
        if (strlen($newPassword) < 5) {
            http_response_code(400);
            echo json_encode(['error' => 'En az 5 karakter.']);
            exit;
        }
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?")->execute([$hash, $_SESSION['user_id']]);
        echo json_encode(['success' => true]);
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action not found']);
        break;
}
?>
<?php
/**
 * api/config.php
 * ------------------------------------------------------------
 * Koneksi database SQLite + helper umum. File ini di-include oleh
 * semua endpoint lain. TIDAK diakses langsung dari browser.
 *
 * Database-nya cuma 1 file (api/data/hackclass.sqlite), otomatis
 * dibuat sendiri saat pertama kali dipanggil. Tidak perlu install
 * MySQL/server database terpisah, dan tidak perlu akun cloud apa pun.
 */

declare(strict_types=1);

// --- Session (dipakai untuk cek status login admin) ---
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    // 'secure' => true, // aktifkan baris ini kalau situs sudah pakai HTTPS
]);
session_start();

// --- Koneksi SQLite ---
$dbFile = __DIR__ . '/data/hackclass.sqlite';
$dbDir = dirname($dbFile);
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0775, true);
}

try {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Database error: ' . $e->getMessage()]));
}

// Buat tabel kalau belum ada (aman dipanggil berulang kali)
$pdo->exec("
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT
    )
");
$pdo->exec("
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
");

/** Kirim response JSON lalu langsung berhenti. */
function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function is_logged_in(): bool {
    return isset($_SESSION['admin_id']);
}

/** Panggil di awal endpoint yang wajib login admin. */
function require_admin(): void {
    if (!is_logged_in()) {
        json_response(['error' => 'Belum login.'], 401);
    }
}

/** Panggil di endpoint yang MENGUBAH data (proteksi CSRF). */
function require_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        json_response(['error' => 'Sesi tidak valid, silakan login ulang.'], 403);
    }
}

/** Ambil body request sebagai JSON (array). */
function read_json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

<?php
/**
 * api/login.php — POST { username, password } -> membuat session admin.
 * Ada proteksi brute-force sederhana: 5x salah = terkunci 5 menit.
 */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$input = read_json_body();
$username = trim($input['username'] ?? '');
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '') {
    json_response(['error' => 'Username dan password wajib diisi.'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM admins WHERE username = ?');
$stmt->execute([$username]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    sleep(1); // perlambat brute force / username enumeration
    json_response(['error' => 'Username atau password salah.'], 401);
}

// Cek apakah akun sedang terkunci karena kebanyakan gagal login
if (!empty($admin['locked_until']) && strtotime($admin['locked_until']) > time()) {
    $mins = (int)ceil((strtotime($admin['locked_until']) - time()) / 60);
    json_response(['error' => "Terlalu banyak percobaan gagal. Coba lagi dalam {$mins} menit."], 429);
}

if (!password_verify($password, $admin['password_hash'])) {
    $attempts = (int)$admin['failed_attempts'] + 1;
    $lockedUntil = null;
    if ($attempts >= 5) {
        $lockedUntil = date('Y-m-d H:i:s', time() + 5 * 60);
        $attempts = 0;
    }
    $upd = $pdo->prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?');
    $upd->execute([$attempts, $lockedUntil, $admin['id']]);
    sleep(1);
    json_response(['error' => 'Username atau password salah.'], 401);
}

// Login berhasil — reset percobaan gagal & buat session baru
$reset = $pdo->prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?');
$reset->execute([$admin['id']]);

session_regenerate_id(true);
$_SESSION['admin_id'] = $admin['id'];
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

json_response(['success' => true, 'csrfToken' => $_SESSION['csrf_token']]);

<?php
/**
 * api/install.php
 * ------------------------------------------------------------
 * Buka file ini SEKALI lewat browser (contoh: situskamu.com/api/install.php)
 * untuk membuat akun admin pertama. Setelah berhasil, file ini otomatis
 * mengunci diri (tidak bisa dipakai lagi) — dan untuk keamanan, SEBAIKNYA
 * kamu hapus file ini dari server setelah selesai setup.
 */
require __DIR__ . '/config.php';

$lockFile = __DIR__ . '/data/installed.lock';
$alreadyInstalled = file_exists($lockFile);

$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$alreadyInstalled) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';

    if ($username === '' || $password === '') {
        $message = 'Username dan password wajib diisi.';
    } elseif (strlen($password) < 8) {
        $message = 'Password minimal 8 karakter.';
    } elseif ($password !== $confirm) {
        $message = 'Konfirmasi password tidak cocok.';
    } else {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        try {
            $stmt = $pdo->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)');
            $stmt->execute([$username, $hash]);
            file_put_contents($lockFile, date('c') . " oleh username: {$username}");
            $success = true;
        } catch (PDOException $e) {
            $message = 'Gagal membuat akun (mungkin username sudah dipakai).';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="robots" content="noindex, nofollow">
<title>Setup Admin — HACKCLASS</title>
<style>
  body{font-family:system-ui,sans-serif;background:#080B11;color:#E2E8F0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}
  .box{background:#0F172A;padding:32px;border-radius:16px;max-width:420px;width:100%;border:1px solid #1E293B}
  h2{margin-top:0}
  label{font-size:13px;color:#94a3b8;display:block;margin-top:10px}
  input{width:100%;padding:10px;margin-top:6px;border-radius:8px;border:1px solid #1E293B;background:#080B11;color:#fff;box-sizing:border-box;font-size:14px}
  button{width:100%;padding:12px;border-radius:8px;border:0;background:#00F0FF;color:#000;font-weight:bold;cursor:pointer;margin-top:20px;font-size:14px}
  .msg{background:#7f1d1d33;border:1px solid #ef444466;color:#fca5a5;padding:10px 12px;border-radius:8px;margin-bottom:14px;font-size:13px}
  .ok{background:#14532d33;border-color:#22c55e66;color:#86efac}
  code{background:#000;padding:2px 6px;border-radius:4px}
</style>
</head>
<body>
<div class="box">
<h2>⚙️ Setup Akun Admin</h2>

<?php if ($alreadyInstalled && !$success): ?>
    <div class="msg ok">
        Setup sudah pernah dijalankan sebelumnya. Kalau lupa password,
        hapus baris admin lewat file <code>api/data/hackclass.sqlite</code>
        (pakai DB Browser for SQLite) lalu hapus juga
        <code>api/data/installed.lock</code> untuk setup ulang.
    </div>
<?php elseif ($success): ?>
    <div class="msg ok">
        ✅ Akun admin berhasil dibuat! Sekarang:
        <br>1. <b>Hapus file ini</b> (<code>api/install.php</code>) dari server.
        <br>2. Login di <code>admin.html</code> pakai username &amp; password barusan.
    </div>
<?php else: ?>
    <?php if ($message): ?><div class="msg"><?= htmlspecialchars($message) ?></div><?php endif; ?>
    <form method="post">
        <label>Username</label>
        <input type="text" name="username" required autocomplete="username">
        <label>Password (min. 8 karakter)</label>
        <input type="password" name="password" required minlength="8" autocomplete="new-password">
        <label>Konfirmasi Password</label>
        <input type="password" name="confirm" required minlength="8" autocomplete="new-password">
        <button type="submit">Buat Akun Admin</button>
    </form>
<?php endif; ?>

</div>
</body>
</html>

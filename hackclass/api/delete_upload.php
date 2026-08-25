<?php
/**
 * api/delete_upload.php — POST { path: "uploads/xxxx.jpg" }, admin-only.
 * Best-effort: hapus file fisik di server saat foto/anggota dihapus dari
 * panel admin, supaya folder /uploads tidak menumpuk file sampah.
 * Kalau gagal hapus file, tidak masalah — data di database tetap terhapus.
 */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}
require_admin();
require_csrf();

$input = read_json_body();
$path = $input['path'] ?? '';

// Hanya izinkan hapus file di dalam folder uploads/, cegah path traversal
if (!is_string($path) || !preg_match('#^uploads/[a-f0-9]+\.(jpg|png|webp)$#', $path)) {
    json_response(['success' => false, 'reason' => 'Path tidak valid, dilewati.']);
}

$fullPath = __DIR__ . '/../' . $path;
if (is_file($fullPath)) {
    @unlink($fullPath);
}

json_response(['success' => true]);

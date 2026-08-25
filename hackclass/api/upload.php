<?php
/**
 * api/upload.php — POST multipart form (field "photo"), admin-only.
 * Menyimpan file ASLI ke folder /uploads (bukan base64 di database),
 * balikin path relatifnya untuk disimpan di appState.
 */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}
require_admin();
require_csrf();

if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    json_response(['error' => 'Upload gagal atau file tidak ditemukan.'], 400);
}

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $_FILES['photo']['tmp_name']);
finfo_close($finfo);

if (!isset($allowed[$mime])) {
    json_response(['error' => 'Format file harus JPG, PNG, atau WEBP.'], 400);
}

$maxBytes = 5 * 1024 * 1024; // 5MB
if ($_FILES['photo']['size'] > $maxBytes) {
    json_response(['error' => 'Ukuran file maksimal 5MB.'], 400);
}

$uploadDir = __DIR__ . '/../uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$filename = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
$destination = $uploadDir . '/' . $filename;

if (!move_uploaded_file($_FILES['photo']['tmp_name'], $destination)) {
    json_response(['error' => 'Gagal menyimpan file di server. Cek folder /uploads bisa ditulis (permission).'], 500);
}

json_response(['url' => 'uploads/' . $filename]);

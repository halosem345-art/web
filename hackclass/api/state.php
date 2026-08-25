<?php
/**
 * api/state.php
 * GET  -> boleh siapa saja, balikin data situs (appState) apa adanya.
 * POST -> HARUS login admin + token CSRF valid, menimpa seluruh data.
 */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT value FROM settings WHERE key = ?');
    $stmt->execute(['appState']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    header('Cache-Control: no-store');
    echo $row ? $row['value'] : 'null';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();
    require_csrf();

    $raw = file_get_contents('php://input');
    json_decode($raw);
    if (json_last_error() !== JSON_ERROR_NONE) {
        json_response(['error' => 'JSON tidak valid.'], 400);
    }
    if (strlen($raw) > 8 * 1024 * 1024) { // batas wajar 8MB per simpan
        json_response(['error' => 'Data terlalu besar.'], 413);
    }

    $check = $pdo->prepare('SELECT COUNT(*) FROM settings WHERE key = "appState"');
    $check->execute();

    if ((int)$check->fetchColumn() > 0) {
        $stmt = $pdo->prepare('UPDATE settings SET value = ? WHERE key = "appState"');
    } else {
        $stmt = $pdo->prepare('INSERT INTO settings (key, value) VALUES ("appState", ?)');
    }
    $stmt->execute([$raw]);

    json_response(['success' => true]);
    exit;
}

json_response(['error' => 'Method not allowed'], 405);

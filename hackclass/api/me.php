<?php
/** api/me.php — GET -> { loggedIn: bool, csrfToken? } */
require __DIR__ . '/config.php';

if (is_logged_in()) {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    json_response(['loggedIn' => true, 'csrfToken' => $_SESSION['csrf_token']]);
} else {
    json_response(['loggedIn' => false]);
}

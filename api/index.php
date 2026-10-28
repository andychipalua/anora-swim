<?php
declare(strict_types=1);

require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/validate.php';
require __DIR__ . '/lib/handlers.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/', '/');
$stroke = (isset($_GET['stroke']) && is_string($_GET['stroke']) && $_GET['stroke'] !== '')
    ? $_GET['stroke']
    : null;

try {
    switch ($method . ' ' . $path) {
        case 'GET /api/health':
            db()->query('SELECT 1');
            send_json(['status' => 'ok']);

        case 'GET /api/strokes':
            list_strokes();

        case 'GET /api/events':
            list_events();

        case 'GET /api/records':
            list_records($stroke);

        case 'GET /api/videos':
            list_videos($stroke);

        case 'POST /api/events':
            require_write_key();
            create_event();

        case 'POST /api/records':
            require_write_key();
            create_record();

        case 'POST /api/videos':
            require_write_key();
            create_videos();

        default:
            send_json(['error' => 'Not found'], 404);
    }
} catch (Throwable $e) {
    error_log($e->getMessage());
    send_json(['error' => 'Server error'], 500);
}

<?php
// Database credentials
$db_host = "localhost";
$db_user = "root";
$db_password = "";
$db_name = "research_db";
$db_port = 3307;

// CORS headers — must be sent before any output
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS requests early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Create connection
$conn = new mysqli($db_host, $db_user, $db_password, $db_name, $db_port);

if ($conn->connect_error) {
    error_log("Database Connection Failed: " . $conn->connect_error);
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

$conn->set_charset("utf8mb4");

function dbError($message, $code = 500) {
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $message]);
    exit;
}

function dbSuccess($data = null, $message = "Success") {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => $message, "data" => $data]);
}
?>

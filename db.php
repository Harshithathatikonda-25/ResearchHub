<?php
/**
 * Database Connection File (db.php)
 * 
 * This file handles the MySQL connection for the ResearchHub application.
 * It uses MySQLi with error handling and supports both production and development.
 */

// Database credentials
$db_host = "localhost";      // MySQL Host
$db_user = "root";           // MySQL Username
$db_password = "";           // MySQL Password (empty for default XAMPP)
$db_name = "research_db";    // Database Name
$db_port = 3307;             // MySQL Port (XAMPP default is usually 3306; change to 3307 only if your XAMPP MySQL uses that port)

// Create connection using MySQLi
$conn = new mysqli($db_host, $db_user, $db_password, $db_name, $db_port);

// Check connection
if ($conn->connect_error) {
    // Log error (in production, don't expose to client)
    error_log("Database Connection Failed: " . $conn->connect_error);
    
    // Return JSON error response
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed. Please contact administrator."
    ]);
    exit;
}

// Set charset to UTF-8 for proper text encoding
$conn->set_charset("utf8mb4");

// Enable error reporting for development (comment out in production)
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

/**
 * Function to handle database errors gracefully
 * 
 * @param string $message - Error message to display
 * @param int $code - HTTP status code
 */
function dbError($message, $code = 500) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode([
        "status" => "error",
        "message" => $message
    ]);
    exit;
}

/**
 * Function to return success response
 * 
 * @param array $data - Data to return
 * @param string $message - Success message
 */
function dbSuccess($data = null, $message = "Success") {
    header('Content-Type: application/json');
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => $message,
        "data" => $data
    ]);
}

// Allow CORS for frontend requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

?>

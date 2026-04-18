<?php
/**
 * auth.php — Handles register and login
 * POST /api/auth.php  { action: "register", username, password }
 * POST /api/auth.php  { action: "login",    username, password }
 */

require_once '../db.php';

header("Content-Type: application/json");

// Create users table if it doesn't exist
$conn->query("
    CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$action   = isset($data['action'])   ? trim($data['action'])   : '';
$username = isset($data['username']) ? trim($data['username']) : '';
$password = isset($data['password']) ? $data['password']       : '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Username and password are required"]);
    exit;
}

if (strlen($username) < 3) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Username must be at least 3 characters"]);
    exit;
}

if (strlen($password) < 4) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Password must be at least 4 characters"]);
    exit;
}

// ── REGISTER ──────────────────────────────────────────────
if ($action === 'register') {
    // Check if username already taken
    $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Username already taken"]);
        $check->close();
        exit;
    }
    $check->close();

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $hash);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Account created", "username" => $username]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Registration failed"]);
    }
    $stmt->close();
}

// ── LOGIN ─────────────────────────────────────────────────
elseif ($action === 'login') {
    $stmt = $conn->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid username or password"]);
        exit;
    }

    echo json_encode([
        "status"   => "success",
        "message"  => "Login successful",
        "username" => $user['username'],
        "id"       => $user['id']
    ]);
}

else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Unknown action"]);
}

$conn->close();
?>

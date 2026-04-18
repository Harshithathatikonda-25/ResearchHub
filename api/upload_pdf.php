<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

if (!isset($_FILES['pdf']) || $_FILES['pdf']['error'] !== UPLOAD_ERR_OK) {
    $errCode = isset($_FILES['pdf']) ? $_FILES['pdf']['error'] : 'no file';
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Upload error code: " . $errCode]);
    exit;
}

$file = $_FILES['pdf'];

// Validate by extension only (fileinfo extension not required)
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($ext !== 'pdf') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Only PDF files are allowed"]);
    exit;
}

// Ensure uploads directory exists (relative to project root)
$uploadDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$safeName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', basename($file['name']));
$filename = time() . '_' . $safeName;
$destPath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save file to: " . $destPath]);
    exit;
}

echo json_encode([
    "status" => "success",
    "pdfPath" => "uploads/" . $filename
]);

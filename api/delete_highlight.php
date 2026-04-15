<?php
require_once "db.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$id = isset($data['id']) ? intval($data['id']) : 0;
$user_id = isset($data['user_id']) ? $conn->real_escape_string($data['user_id']) : '';

if (!$id || !$user_id) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM paper_highlights WHERE id = ? AND user_id = ?");
$stmt->bind_param("is", $id, $user_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "SQL Error"]);
}
$stmt->close();
$conn->close();
?>

<?php
require_once "db.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$paper_id = isset($data['paper_id']) ? intval($data['paper_id']) : 0;
$user_id = isset($data['user_id']) ? $conn->real_escape_string($data['user_id']) : '';
$selected_text = isset($data['selected_text']) ? $conn->real_escape_string($data['selected_text']) : '';
$color = isset($data['color']) ? $conn->real_escape_string($data['color']) : 'yellow';

if (!$paper_id || !$user_id || !$selected_text) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO paper_highlights (paper_id, user_id, selected_text, color) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isss", $paper_id, $user_id, $selected_text, $color);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "id" => $stmt->insert_id]);
} else {
    echo json_encode(["success" => false, "message" => "SQL Error"]);
}
$stmt->close();
$conn->close();
?>

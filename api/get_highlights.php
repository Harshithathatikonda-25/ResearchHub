<?php
require_once "db.php";
header("Content-Type: application/json");

$paper_id = isset($_GET['paper_id']) ? intval($_GET['paper_id']) : 0;
$user_id = isset($_GET['user_id']) ? $conn->real_escape_string($_GET['user_id']) : '';

if (!$paper_id || !$user_id) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, selected_text, color, created_at FROM paper_highlights WHERE paper_id = ? AND user_id = ? ORDER BY created_at ASC");
$stmt->bind_param("is", $paper_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();

$highlights = [];
while ($row = $result->fetch_assoc()) {
    $highlights[] = $row;
}

echo json_encode(["success" => true, "highlights" => $highlights]);
$stmt->close();
$conn->close();
?>

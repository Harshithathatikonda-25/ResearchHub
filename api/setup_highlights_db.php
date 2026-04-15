<?php
require_once "db.php";

$sql = "CREATE TABLE IF NOT EXISTS paper_highlights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paper_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    selected_text TEXT NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "Table paper_highlights created successfully or already exists.";
} else {
    echo "Error creating table: " . $conn->error;
}
$conn->close();
?>

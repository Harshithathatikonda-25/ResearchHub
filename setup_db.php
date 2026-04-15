<?php
$host = "127.0.0.1";
$user = "root";
$password = "";
$port = 3307;

$conn = new mysqli($host, $user, $password, "", $port);

if ($conn->connect_error) {
    die("<div style='color:red; font-family:sans-serif; padding: 2rem;'><strong>Connection Failed:</strong> " . $conn->connect_error . "</div>");
}

$htmlOutput = "<div style='font-family:sans-serif; padding: 2rem; background: #0f0f13; color: white; border-radius: 8px; max-width: 600px; margin: 2rem auto;'>";
$htmlOutput .= "<h2 style='color:#b070ff'>Database Setup</h2>";

$sql_db = "CREATE DATABASE IF NOT EXISTS research_db";
if ($conn->query($sql_db) === TRUE) {
    $htmlOutput .= "<p>✅ Database 'research_db' initialized successfully.</p>";
} else {
    $htmlOutput .= "<p style='color:red'>❌ Error creating database: " . $conn->error . "</p>";
}

$conn->select_db("research_db");

$sql_table = "CREATE TABLE IF NOT EXISTS papers (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    year INT(4) NOT NULL,
    domain VARCHAR(100) DEFAULT NULL,
    timeToRead VARCHAR(50) DEFAULT NULL,
    difficulty VARCHAR(50) DEFAULT NULL,
    shortSummary VARCHAR(200) DEFAULT NULL,
    detailedSummary TEXT DEFAULT NULL,
    keyPoints TEXT DEFAULT NULL,
    progress INT(3) DEFAULT 0,
    isFavorite BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Not Started',
    timestamp_ms BIGINT(20) DEFAULT 0,
    userOwner VARCHAR(50) DEFAULT 'admin',
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($sql_table) === TRUE) {
    $htmlOutput .= "<p>✅ Table 'papers' structured successfully.</p>";
} else {
    $htmlOutput .= "<p style='color:red'>❌ Error creating table: " . $conn->error . "</p>";
}

$htmlOutput .= "<br><a href='index.html' style='display:inline-block; padding: 10px 20px; background: #8a2be2; color: #fff; text-decoration: none; border-radius: 5px;'>Go to Dashboard &rarr;</a>";
$htmlOutput .= "</div>";

echo $htmlOutput;

$conn->close();
?>

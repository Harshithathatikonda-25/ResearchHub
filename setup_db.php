<?php
/**
 * Database Setup Script (setup_db.php)
 * 
 * Run this ONCE to initialize the ResearchHub database.
 * After running, you can upload papers and manage them.
 */

require_once 'db.php';  // Use centralized database connection

// Create the papers table
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
    pdfPath TEXT DEFAULT NULL,
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

$htmlOutput = "<div style='font-family:sans-serif; padding: 2rem; background: #0f0f13; color: white; border-radius: 8px; max-width: 600px; margin: 2rem auto;'>";
$htmlOutput .= "<h2 style='color:#b070ff'>🔧 ResearchHub Database Setup</h2>";

// Check if database is selected
if ($conn->select_db("research_db")) {
    $htmlOutput .= "<p style='color:#00d084;'>✅ Connected to database 'research_db'</p>";
} else {
    // If database doesn't exist, create it
    $create_db = "CREATE DATABASE IF NOT EXISTS research_db";
    if ($conn->query($create_db) === TRUE) {
        $htmlOutput .= "<p style='color:#00d084;'>✅ Database 'research_db' created</p>";
        $conn->select_db("research_db");
    } else {
        $htmlOutput .= "<p style='color:#ff6b6b;'>❌ Error creating database: " . $conn->error . "</p>";
    }
}

// Create papers table
if ($conn->query($sql_table) === TRUE) {
    $htmlOutput .= "<p style='color:#00d084;'>✅ Table 'papers' created/verified</p>";
} else {
    $htmlOutput .= "<p style='color:#ff6b6b;'>❌ Error creating table: " . $conn->error . "</p>";
}

$htmlOutput .= "<hr style='border:none; border-top:1px solid #444; margin: 1.5rem 0;'>";
$htmlOutput .= "<p><strong>Next Steps:</strong></p>";
$htmlOutput .= "<ul style='line-height:1.8;'>";
$htmlOutput .= "<li>Open <a href='index.html' style='color:#b070ff; text-decoration:none;'>/index.html</a> to access the dashboard</li>";
$htmlOutput .= "<li>Go to <a href='upload.html' style='color:#b070ff; text-decoration:none;'>/upload.html</a> to add papers</li>";
$htmlOutput .= "<li>View all papers at <a href='papers.html' style='color:#b070ff; text-decoration:none;'>/papers.html</a></li>";
$htmlOutput .= "</ul>";
$htmlOutput .= "<p style='color:#999; font-size:0.9rem; margin-top:1rem;'>Database setup completed! You can now upload and manage research papers.</p>";
$htmlOutput .= "</div>";

echo $htmlOutput;

$conn->close();
?>

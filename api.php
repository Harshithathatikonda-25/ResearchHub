<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "127.0.0.1";
$user = "root";
$password = "";
$port = 3307;
$dbname = "research_db";

$conn = new mysqli($host, $user, $password, $dbname, $port);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database Connection Failed"]);
    exit();
}

// Auto-migrate schema gracefully
try {
    $conn->query("ALTER TABLE papers ADD COLUMN tier VARCHAR(50) DEFAULT 'None'");
} catch (Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $owner = isset($_GET['user']) ? $conn->real_escape_string($_GET['user']) : 'admin';
    
    $sql = "SELECT * FROM papers WHERE userOwner = '$owner' ORDER BY timestamp_ms DESC";
    $result = $conn->query($sql);
    
    $papers = [];
    if($result) {
        while($row = $result->fetch_assoc()) {
            $row['progress'] = (int)$row['progress'];
            $row['isFavorite'] = (bool)$row['isFavorite'];
            $row['keyPoints'] = json_decode($row['keyPoints']);
            $row['id'] = (int)$row['id'];
            $papers[] = $row;
        }
    }
    echo json_encode($papers);
} 
elseif ($method === 'POST') {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents("php://input"), true);
    } else {
        $data = $_POST;
        if(isset($_POST['keyPoints'])) {
            $data['keyPoints'] = json_decode($_POST['keyPoints'], true);
        }
    }
    
    if(isset($data['action']) && $data['action'] === 'update') {
        $id = (int)$data['id'];
        $progress = (int)$data['progress'];
        $status = $conn->real_escape_string($data['status']);
        $isFav = isset($data['isFavorite']) ? ($data['isFavorite'] ? 1 : 0) : 0;
        
        $tierQuery = "";
        if(isset($data['tier'])) {
            $tier = $conn->real_escape_string($data['tier']);
            $tierQuery = ", tier='$tier'";
        }
        
        $sql = "UPDATE papers SET progress=$progress, status='$status', isFavorite=$isFav $tierQuery WHERE id=$id";
        if($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["error" => $conn->error]);
        }
    } 
    else {
        // Handle PDF Upload securely
        $pdfPath = 'NULL';
        if(isset($_FILES['pdfFile']) && $_FILES['pdfFile']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';
            $fileName = time() . '_' . preg_replace("/[^a-zA-Z0-9.-]/", "_", basename($_FILES['pdfFile']['name']));
            $uploadFile = $uploadDir . $fileName;
            if (move_uploaded_file($_FILES['pdfFile']['tmp_name'], $uploadFile)) {
                $pdfPath = "'" . $conn->real_escape_string($uploadFile) . "'";
            }
        }

        // INSERT New paper
        $title = isset($data['title']) ? $conn->real_escape_string($data['title']) : '';
        $author = isset($data['author']) ? $conn->real_escape_string($data['author']) : '';
        $year = isset($data['year']) ? (int)$data['year'] : 0;
        $domain = isset($data['domain']) ? $conn->real_escape_string($data['domain']) : '';
        $timeToRead = isset($data['timeToRead']) ? $conn->real_escape_string($data['timeToRead']) : '';
        $difficulty = isset($data['difficulty']) ? $conn->real_escape_string($data['difficulty']) : '';
        $shortSummary = isset($data['shortSummary']) ? $conn->real_escape_string($data['shortSummary']) : '';
        $detailedSummary = isset($data['detailedSummary']) ? $conn->real_escape_string($data['detailedSummary']) : '';
        $keyPoints = $conn->real_escape_string(json_encode($data['keyPoints'] ?? []));
        $timestamp = time() * 1000;
        $userOwner = isset($data['userOwner']) ? $conn->real_escape_string($data['userOwner']) : 'admin';
        
        $sql = "INSERT INTO papers (title, author, year, domain, timeToRead, difficulty, shortSummary, detailedSummary, keyPoints, timestamp_ms, userOwner, pdfPath) 
                VALUES ('$title', '$author', $year, '$domain', '$timeToRead', '$difficulty', '$shortSummary', '$detailedSummary', '$keyPoints', $timestamp, '$userOwner', $pdfPath)";
                
        if($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            echo json_encode(["error" => $conn->error]);
        }
    }
}

$conn->close();
?>

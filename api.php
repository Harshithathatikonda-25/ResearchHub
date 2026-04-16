<?php
/**
 * ResearchHub API (api.php)
 * 
 * Main API file handling all CRUD operations for research papers.
 * Uses prepared statements to prevent SQL injection.
 * 
 * Endpoints:
 * GET  /api.php?action=list&user={username}  - Get all papers for user
 * POST /api.php - Create new paper or update existing
 * DELETE /api.php?id={id} - Delete paper
 */

// Include database connection
require_once 'db.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    // ============================================
    // GET REQUEST - FETCH PAPERS
    // ============================================
    if ($method === 'GET') {
        $action = isset($_GET['action']) ? $_GET['action'] : 'list';
        $user = isset($_GET['user']) ? $_GET['user'] : 'admin';
        
        if ($action === 'list') {
            // Fetch all papers for a specific user
            $stmt = $conn->prepare("
                SELECT id, title, author, year, domain, timeToRead, difficulty, 
                       shortSummary, detailedSummary, keyPoints, progress, isFavorite, 
                       status, timestamp_ms, userOwner, pdfPath
                FROM papers 
                WHERE userOwner = ? 
                  AND title <> ''
                  AND author <> ''
                ORDER BY timestamp_ms DESC
            ");
            
            if (!$stmt) {
                dbError("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param("s", $user);
            
            if (!$stmt->execute()) {
                dbError("Execute failed: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $papers = [];
            
            while ($row = $result->fetch_assoc()) {
                // Convert types
                $row['id'] = (int)$row['id'];
                $row['progress'] = (int)$row['progress'];
                $row['isFavorite'] = (bool)$row['isFavorite'];
                $row['year'] = (int)$row['year'];
                
                // Parse JSON fields
                if (!empty($row['keyPoints'])) {
                    $row['keyPoints'] = json_decode($row['keyPoints']);
                } else {
                    $row['keyPoints'] = [];
                }
                
                $papers[] = $row;
            }
            
            $stmt->close();
            
            header('Content-Type: application/json');
            echo json_encode($papers);
            exit;
        }
    }
    
    // ============================================
    // POST REQUEST - CREATE OR UPDATE
    // ============================================
    elseif ($method === 'POST') {
        $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
        
        // Parse JSON input
        if (strpos($contentType, 'application/json') !== false) {
            $data = json_decode(file_get_contents("php://input"), true);
        } else {
            $data = $_POST;
        }
        
        // Check if this is an UPDATE or INSERT
        if (isset($data['action']) && $data['action'] === 'update') {
            // ============================================
            // UPDATE PAPER STATUS/PROGRESS
            // ============================================
            
            $id = isset($data['id']) ? (int)$data['id'] : null;
            $status = isset($data['status']) ? $data['status'] : null;
            $progress = isset($data['progress']) ? (int)$data['progress'] : 0;
            $isFavorite = isset($data['isFavorite']) ? (int)$data['isFavorite'] : 0;
            
            if (!$id) {
                dbError("Paper ID is required for update", 400);
            }
            
            $stmt = $conn->prepare("
                UPDATE papers 
                SET status = ?, progress = ?, isFavorite = ?
                WHERE id = ?
            ");
            
            if (!$stmt) {
                dbError("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param("siii", $status, $progress, $isFavorite, $id);
            
            if ($stmt->execute()) {
                dbSuccess(null, "Paper updated successfully");
            } else {
                dbError("Update failed: " . $stmt->error);
            }
            
            $stmt->close();
        }
        else {
            // ============================================
            // INSERT NEW PAPER
            // ============================================
            
            $title = isset($data['title']) ? $data['title'] : '';
            $author = isset($data['author']) ? $data['author'] : '';
            $year = isset($data['year']) ? (int)$data['year'] : 0;
            $domain = isset($data['domain']) ? $data['domain'] : '';
            $timeToRead = isset($data['timeToRead']) ? $data['timeToRead'] : '';
            $difficulty = isset($data['difficulty']) ? $data['difficulty'] : '';
            $shortSummary = isset($data['shortSummary']) ? $data['shortSummary'] : '';
            $detailedSummary = isset($data['detailedSummary']) ? $data['detailedSummary'] : '';
            $keyPoints = isset($data['keyPoints']) ? json_encode($data['keyPoints']) : json_encode([]);
            $status = isset($data['status']) ? $data['status'] : 'Not Started';
            $progress = isset($data['progress']) ? (int)$data['progress'] : 0;
            $userOwner = isset($data['userOwner']) ? $data['userOwner'] : 'admin';
            $timestamp_ms = time() * 1000;
            
            // Validate required fields
            if (empty($title) || empty($author)) {
                dbError("Title and Author are required", 400);
            }
            
            $stmt = $conn->prepare("
                INSERT INTO papers 
                (title, author, year, domain, timeToRead, difficulty, shortSummary, 
                 detailedSummary, keyPoints, status, progress, userOwner, timestamp_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            if (!$stmt) {
                dbError("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param(
                "ssissssssiii",
                $title, $author, $year, $domain, $timeToRead, $difficulty,
                $shortSummary, $detailedSummary, $keyPoints, $status, $progress, $userOwner, $timestamp_ms
            );
            
            if ($stmt->execute()) {
                $new_id = $stmt->insert_id;
                dbSuccess(
                    ["id" => $new_id],
                    "Paper uploaded successfully"
                );
            } else {
                dbError("Insert failed: " . $stmt->error);
            }
            
            $stmt->close();
        }
    }
    
    // ============================================
    // DELETE REQUEST - DELETE PAPER
    // ============================================
    elseif ($method === 'DELETE') {
        parse_str(file_get_contents("php://input"), $data);
        $id = isset($data['id']) ? (int)$data['id'] : null;
        $user = isset($data['user']) ? $data['user'] : null;
        
        if (!$id || !$user) {
            dbError("Paper ID and User are required", 400);
        }
        
        // Verify ownership before deletion
        $check_stmt = $conn->prepare("
            SELECT id FROM papers WHERE id = ? AND userOwner = ?
        ");
        $check_stmt->bind_param("is", $id, $user);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows === 0) {
            dbError("Paper not found or unauthorized", 403);
        }
        $check_stmt->close();
        
        // Delete the paper
        $stmt = $conn->prepare("DELETE FROM papers WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            dbSuccess(null, "Paper deleted successfully");
        } else {
            dbError("Delete failed: " . $stmt->error);
        }
        
        $stmt->close();
    }
    
    else {
        dbError("Method not allowed", 405);
    }

} catch (Exception $e) {
    dbError("Server error: " . $e->getMessage(), 500);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

?>

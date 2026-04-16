<?php
/**
 * Database Connection Test
 * Open this file in browser to verify database connectivity
 * URL: http://localhost:8000/test-db.php
 */

header('Content-Type: application/json');

$response = [
    "timestamp" => date('Y-m-d H:i:s'),
    "tests" => []
];

// Test 1: Check if db.php exists and can be included
$test1 = [
    "name" => "Database Config File",
    "status" => "pending"
];

if (file_exists('db.php')) {
    $test1["status"] = "passed";
    $test1["message"] = "db.php found";
    
    // Test 2: Try to include db.php
    ob_start();
    $include_result = include 'db.php';
    $output = ob_get_clean();
    
    if ($include_result !== false) {
        $response["tests"][] = $test1;
        
        // Test 2: Check database connection
        if (isset($conn)) {
            $test2 = [
                "name" => "MySQL Connection",
                "status" => "passed",
                "message" => "Connected to MySQL",
                "details" => [
                    "host" => ($db_host ?? 'localhost') . ':' . ($db_port ?? 3306),
                    "database" => $db_name ?? 'research_db',
                    "user" => $db_user ?? 'root',
                    "charset" => $conn->character_set_name()
                ]
            ];
            $response["tests"][] = $test2;
            
            // Test 3: Check if papers table exists
            $result = $conn->query("SHOW TABLES LIKE 'papers'");
            
            if ($result && $result->num_rows > 0) {
                $test3 = [
                    "name" => "Papers Table",
                    "status" => "passed",
                    "message" => "Papers table exists"
                ];
                
                // Check table structure
                $columns = $conn->query("DESCRIBE papers");
                $col_count = $columns->num_rows;
                
                $test3["details"] = [
                    "columns" => $col_count
                ];
                
                $response["tests"][] = $test3;
                
                // Test 4: Check paper count
                $paper_count = $conn->query("SELECT COUNT(*) as total FROM papers");
                $count_row = $paper_count->fetch_assoc();
                
                $test4 = [
                    "name" => "Paper Count",
                    "status" => "passed",
                    "message" => "Query successful",
                    "details" => [
                        "total_papers" => intval($count_row['total']),
                        "user" => "admin"
                    ]
                ];
                $response["tests"][] = $test4;
                
            } else {
                $test3 = [
                    "name" => "Papers Table",
                    "status" => "failed",
                    "message" => "Papers table does NOT exist",
                    "action" => "Run http://localhost:8000/setup_db.php"
                ];
                $response["tests"][] = $test3;
            }
            
            $response["overall_status"] = "✅ DATABASE CONNECTED";
            
        } else {
            $response["tests"][] = $test1;
            $response["overall_status"] = "❌ CONNECTION OBJECT NOT FOUND";
        }
    } else {
        $test1["status"] = "failed";
        $test1["message"] = "Failed to include db.php";
        $response["tests"][] = $test1;
        $response["overall_status"] = "❌ INCLUDE FAILED";
    }
} else {
    $test1["status"] = "failed";
    $test1["message"] = "db.php not found";
    $response["tests"][] = $test1;
    $response["overall_status"] = "❌ FILE NOT FOUND";
}

http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>

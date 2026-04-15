<?php
try {
    $conn = new mysqli("127.0.0.1", "root", "", "", 3306);
    echo "3306 SUCCESS\n";
} catch(Exception $e) {
    echo "3306 ERROR: ".$e->getMessage()."\n";
}

try {
    $conn = new mysqli("127.0.0.1", "root", "", "", 3307);
    echo "3307 SUCCESS\n";
} catch(Exception $e) {
    echo "3307 ERROR: ".$e->getMessage()."\n";
}
?>

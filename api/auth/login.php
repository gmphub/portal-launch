<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        exit;
    }
    
    $email = $data['email'];
    $password = $data['password'];
    
    // Database connection
    $db = new SQLite3('../../database/gmp_academy.db');
    
    // Create users table if not exists
    $db->exec('
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT "STUDENT",
            is_email_verified INTEGER DEFAULT 0,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    // Find user by email
    $stmt = $db->prepare('SELECT * FROM users WHERE email = :email');
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    $user = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }
    
    // Update last login
    $updateStmt = $db->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = :id');
    $updateStmt->bindValue(':id', $user['id'], SQLITE3_TEXT);
    $updateStmt->execute();
    
    // Generate token
    $token = bin2hex(random_bytes(32));
    
    // Store token in session table (create if not exists)
    $db->exec('
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ');
    
    // Clean old sessions
    $db->exec('DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP');
    
    // Insert new session (expires in 7 days)
    $sessionStmt = $db->prepare('
        INSERT INTO user_sessions (user_id, token, expires_at) 
        VALUES (:user_id, :token, datetime("now", "+7 days"))
    ');
    $sessionStmt->bindValue(':user_id', $user['id'], SQLITE3_TEXT);
    $sessionStmt->bindValue(':token', $token, SQLITE3_TEXT);
    $sessionStmt->execute();
    
    // Prepare user response (without password)
    $userResponse = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'is_email_verified' => $user['is_email_verified'],
        'last_login' => $user['last_login']
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => $userResponse
    ]);
    
} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
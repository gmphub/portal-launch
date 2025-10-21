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
    
    if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, email, and password are required']);
        exit;
    }
    
    $name = trim($data['name']);
    $email = trim($data['email']);
    $password = $data['password'];
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }
    
    // Validate password strength
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters long']);
        exit;
    }
    
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
            email_verification_token TEXT,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    // Create user_sessions table if not exists
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
    
    // Check if user already exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    $existingUser = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($existingUser) {
        http_response_code(409);
        echo json_encode(['error' => 'User with this email already exists']);
        exit;
    }
    
    // Generate user ID and verification token
    $userId = 'user_' . uniqid();
    $verificationToken = bin2hex(random_bytes(16));
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $db->prepare('
        INSERT INTO users (id, name, email, password, role, is_email_verified, email_verification_token) 
        VALUES (:id, :name, :email, :password, :role, 0, :verification_token)
    ');
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
    $stmt->bindValue(':role', 'STUDENT', SQLITE3_TEXT);
    $stmt->bindValue(':verification_token', $verificationToken, SQLITE3_TEXT);
    $stmt->execute();
    
    // Generate session token
    $sessionToken = bin2hex(random_bytes(32));
    
    // Insert session (expires in 7 days)
    $sessionStmt = $db->prepare('
        INSERT INTO user_sessions (user_id, token, expires_at) 
        VALUES (:user_id, :token, datetime("now", "+7 days"))
    ');
    $sessionStmt->bindValue(':user_id', $userId, SQLITE3_TEXT);
    $sessionStmt->bindValue(':token', $sessionToken, SQLITE3_TEXT);
    $sessionStmt->execute();
    
    // Send verification email (simplified - in production, use actual email service)
    $verificationLink = "https://your-domain.com/gmp-portal/verify-email.php?token=" . $verificationToken;
    
    // For demo purposes, we'll auto-verify the user
    // In production, you would send an actual email
    $updateStmt = $db->prepare('UPDATE users SET is_email_verified = 1 WHERE id = :id');
    $updateStmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $updateStmt->execute();
    
    // Prepare user response
    $userResponse = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => 'STUDENT',
        'is_email_verified' => 1,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful! Welcome to gmp Academy.',
        'token' => $sessionToken,
        'user' => $userResponse,
        'email_sent' => true, // Set to false if you want actual email verification
        'verification_note' => 'Email verification skipped for demo. In production, users would need to verify their email.'
    ]);
    
} catch (Exception $e) {
    error_log('Registration error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
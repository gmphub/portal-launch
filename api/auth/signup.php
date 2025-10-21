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
    
    // Validation
    if (empty($name) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'All fields are required']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters long']);
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    // Check if email already exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    $existingUser = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($existingUser) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        exit;
    }
    
    // Create new user
    $userId = 'user_' . uniqid();
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $db->prepare('
        INSERT INTO users (id, name, email, password, role) 
        VALUES (:id, :name, :email, :password, :role)
    ');
    
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
    $stmt->bindValue(':role', 'STUDENT', SQLITE3_TEXT);
    
    if ($stmt->execute()) {
        // Create sample courses for new user
        createSampleCourses($db, $userId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Account created successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create account']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function createSampleCourses($db, $userId) {
    // Create courses table
    $db->exec('
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            "order" INTEGER,
            is_published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ');
    
    // Create lessons table
    $db->exec('
        CREATE TABLE IF NOT EXISTS lessons (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            "order" INTEGER,
            course_id TEXT,
            is_published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
    ');
    
    // Create enrollments table
    $db->exec('
        CREATE TABLE IF NOT EXISTS enrollments (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            course_id TEXT,
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
            UNIQUE(user_id, course_id)
        )
    ');
    
    // Create sample courses
    $courses = [
        [
            'id' => 'course_1',
            'title' => 'GMP Fundamentals',
            'description' => 'Learn the basics of Good Manufacturing Practices',
            'order' => 1
        ],
        [
            'id' => 'course_2',
            'title' => 'Quality Systems',
            'description' => 'Understanding quality management systems in pharmaceutical manufacturing',
            'order' => 2
        ],
        [
            'id' => 'course_3',
            'title' => 'Documentation & Records',
            'description' => 'Proper documentation and record-keeping practices',
            'order' => 3
        ]
    ];
    
    foreach ($courses as $course) {
        $stmt = $db->prepare('
            INSERT OR IGNORE INTO courses (id, title, description, "order", is_published) 
            VALUES (:id, :title, :description, :order, 1)
        ');
        
        $stmt->bindValue(':id', $course['id'], SQLITE3_TEXT);
        $stmt->bindValue(':title', $course['title'], SQLITE3_TEXT);
        $stmt->bindValue(':description', $course['description'], SQLITE3_TEXT);
        $stmt->bindValue(':order', $course['order'], SQLITE3_INTEGER);
        $stmt->execute();
        
        // Enroll user in course
        $stmt = $db->prepare('
            INSERT OR IGNORE INTO enrollments (id, user_id, course_id) 
            VALUES (:id, :user_id, :course_id)
        ');
        
        $stmt->bindValue(':id', 'enroll_' . uniqid(), SQLITE3_TEXT);
        $stmt->bindValue(':user_id', $userId, SQLITE3_TEXT);
        $stmt->bindValue(':course_id', $course['id'], SQLITE3_TEXT);
        $stmt->execute();
    }
}
?>
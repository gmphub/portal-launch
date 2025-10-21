<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Simple token validation (in production, use JWT)
if (!isset($_GET['token']) || empty($_GET['token'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization required']);
    exit;
}

try {
    $token = $_GET['token'];
    
    // For demo purposes, we'll decode user info from token
    // In production, validate JWT token properly
    $userData = json_decode(base64_decode($token), true);
    
    if (!$userData || !isset($userData['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
    
    $userId = $userData['user_id'];
    
    // Database connection
    $db = new SQLite3('../database/gmp_academy.db');
    
    // Get user info
    $stmt = $db->prepare('SELECT id, name, email, role FROM users WHERE id = :id');
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $result = $stmt->execute();
    $user = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Get user's courses with progress
    $stmt = $db->prepare('
        SELECT 
            c.id, c.title, c.description, c."order",
            e.enrolled_at, e.completed_at,
            COUNT(l.id) as total_lessons,
            COUNT(p.id) as completed_lessons,
            ROUND((COUNT(p.id) * 100.0 / COUNT(l.id)), 2) as progress_percentage
        FROM courses c
        JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN lessons l ON c.id = l.course_id AND l.is_published = 1
        LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = :user_id AND p.is_completed = 1
        WHERE e.user_id = :user_id AND c.is_published = 1
        GROUP BY c.id, c.title, c.description, c."order", e.enrolled_at, e.completed_at
        ORDER BY c."order"
    ');
    
    $stmt->bindValue(':user_id', $userId, SQLITE3_TEXT);
    $result = $stmt->execute();
    $courses = [];
    
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $courses[] = $row;
    }
    
    // Get overall statistics
    $stmt = $db->prepare('
        SELECT 
            COUNT(DISTINCT c.id) as total_courses,
            COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN c.id END) as completed_courses,
            COUNT(DISTINCT l.id) as total_lessons,
            COUNT(DISTINCT CASE WHEN p.is_completed = 1 THEN l.id END) as completed_lessons,
            AVG(qs.percentage) as average_score
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN lessons l ON c.id = l.course_id AND l.is_published = 1
        LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = :user_id
        LEFT JOIN quiz_scores qs ON l.id = qs.lesson_id AND qs.user_id = :user_id
        WHERE e.user_id = :user_id AND c.is_published = 1
    ');
    
    $stmt->bindValue(':user_id', $userId, SQLITE3_TEXT);
    $result = $stmt->execute();
    $stats = $result->fetchArray(SQLITE3_ASSOC);
    
    // Get recent activity
    $stmt = $db->prepare('
        SELECT 
            p.updated_at,
            l.title as lesson_title,
            c.title as course_title,
            p.is_completed
        FROM progress p
        JOIN lessons l ON p.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE p.user_id = :user_id
        ORDER BY p.updated_at DESC
        LIMIT 5
    ');
    
    $stmt->bindValue(':user_id', $userId, SQLITE3_TEXT);
    $result = $stmt->execute();
    $recentActivity = [];
    
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $recentActivity[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'courses' => $courses,
        'stats' => [
            'totalCourses' => (int)$stats['total_courses'],
            'completedCourses' => (int)$stats['completed_courses'],
            'totalLessons' => (int)$stats['total_lessons'],
            'completedLessons' => (int)$stats['completed_lessons'],
            'averageScore' => $stats['average_score'] ? round($stats['average_score'], 2) : 0
        ],
        'recentActivity' => $recentActivity
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
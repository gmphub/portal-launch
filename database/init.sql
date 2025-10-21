-- Initialize GMP Academy Database
-- This will be executed when the database is first created

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'STUDENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER,
    is_published INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create lessons table
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
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    course_id TEXT,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    UNIQUE(user_id, course_id)
);

-- Create progress table
CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    lesson_id TEXT,
    is_completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    time_spent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id)
);

-- Create quiz_scores table
CREATE TABLE IF NOT EXISTS quiz_scores (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    lesson_id TEXT,
    score INTEGER,
    total_score INTEGER,
    percentage REAL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
);

-- Insert sample courses
INSERT OR IGNORE INTO courses (id, title, description, "order", is_published) VALUES
('course_1', 'GMP Fundamentals', 'Learn the basics of Good Manufacturing Practices', 1, 1),
('course_2', 'Quality Systems', 'Understanding quality management systems in pharmaceutical manufacturing', 2, 1),
('course_3', 'Documentation & Records', 'Proper documentation and record-keeping practices', 3, 1);

-- Insert sample lessons
INSERT OR IGNORE INTO lessons (id, title, content, "order", course_id, is_published) VALUES
('lesson_1', 'Introduction to GMP', 'Welcome to Good Manufacturing Practices. This lesson covers the fundamental principles of GMP in pharmaceutical manufacturing.', 1, 'course_1', 1),
('lesson_2', 'GMP Regulations', 'Understanding the regulatory framework and compliance requirements for GMP.', 2, 'course_1', 1),
('lesson_3', 'Quality Management', 'Learn about quality management systems and their importance in manufacturing.', 1, 'course_2', 1),
('lesson_4', 'Documentation Basics', 'Proper documentation practices and record-keeping requirements.', 1, 'course_3', 1);
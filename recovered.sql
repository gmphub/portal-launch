-- Schema (from visible CREATE TABLE statements)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'STUDENT',
    status TEXT DEFAULT 'ACTIVE',
    isEmailVerified INTEGER DEFAULT 0,
    phone TEXT,
    notes TEXT,
    level TEXT DEFAULT 'beginner',
    lastLogin TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE progress (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    lessonsCompleted INTEGER DEFAULT 0,
    totalLessons INTEGER DEFAULT 0,
    progressPercentage REAL DEFAULT 0,
    lastAccessed TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (courseId) REFERENCES courses(id)
);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    action TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE segments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    criteria TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificate_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    course TEXT,
    status TEXT DEFAULT 'draft',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificates (
    id TEXT PRIMARY KEY,
    userName TEXT NOT NULL,
    userEmail TEXT NOT NULL,
    course TEXT NOT NULL,
    templateId TEXT,
    issuedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (templateId) REFERENCES certificate_templates(id)
);

CREATE TABLE classes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    courseId TEXT,
    instructorId TEXT,
    schedule TEXT,
    maxStudents INTEGER,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id),
    FOREIGN KEY (instructorId) REFERENCES users(id)
);

CREATE TABLE products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0,
    category TEXT,
    level TEXT,
    duration INTEGER DEFAULT 0,
    lessonsCount INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enrollments (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    classId TEXT,
    courseId TEXT,
    enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (classId) REFERENCES classes(id),
    FOREIGN KEY (courseId) REFERENCES courses(id)
);

CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    userId TEXT,
    productId TEXT,
    amount REAL,
    status TEXT,
    paymentMethod TEXT,
    transactionId TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    userId TEXT,
    courseId TEXT,
    content TEXT,
    rating INTEGER,
    isApproved INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (courseId) REFERENCES courses(id)
);

-- Extracted data (users table)
INSERT INTO users (id, email, name, password, role, status, level, lastLogin, createdAt, updatedAt) 
VALUES ('demo-1761736480297', 'demo@gmp.com', 'Demo User', '$2a$12$zRGqKM7Ptn7g9cjJN.iNHOjFuXXZBD67CnvJVwDeyHLwBRi/pzBV6', 'STUDENT', 'ACTIVE', 'beginner', NULL, '2025-10-29 11:14:40', '2025-10-29 11:14:40');

INSERT INTO users (id, email, name, password, role, status, level, lastLogin, createdAt, updatedAt) 
VALUES ('admin-1761736480394', 'admin@gmp.com', 'Admin User', '$2a$12$TpTiLnNkb29MhN3DG3Q5Ued7Tz6P4VIHGLg5yXdE/8UbY9uskOcvi', 'ADMIN', 'ACTIVE', 'beginner', '2025-10-29 20:40:55', '2025-10-29 11:14:40', '2025-10-29 20:40:55');

INSERT INTO users (id, email, name, password, role, status, level, lastLogin, createdAt, updatedAt) 
VALUES ('student-1761770531726-fhxlde', 'gmpintus@gmail.com', 'Gian Mario', '$2a$12$e.LEh8nIEFpID24IrJbZhOu/4YwT7F3nxbm1HrNoOqPTvGOykpDr6', 'ADMIN', 'ACTIVE', 'beginner', '2025-10-29 20:42:11', '2025-10-29 20:42:11', '2025-10-29 20:42:11');

-- Courses
INSERT INTO courses (id, title, description, category, level, duration, price, isActive, createdAt, updatedAt)
VALUES ('course-1761736479906', 'gmp Language Basics', 'Complete gmp language basics course', 'Language', 'Beginner', 0, 0, 1, '2025-10-29 11:14:40', '2025-10-29 11:14:40');

-- Segments
INSERT INTO segments (id, name, criteria, createdAt, updatedAt)
VALUES ('SEG1761768175143zw8i7o9xv', 'seg1', 'ativo', '2025-10-29T20:02:55.143Z', '2025-10-29 20:02:55');

-- Other tables appear empty in the dump.
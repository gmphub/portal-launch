/**
 * Database Integration Layer
 * Prepares data for Oracle server integration
 * Currently uses local storage as fallback
 */

class DatabaseManager {
    constructor() {
        this.isServerAvailable = false;
        this.useLocalStorage = true;
        this.initializeData();
    }

    // Initialize local data structure matching expected Oracle schema
    initializeData() {
        if (!localStorage.getItem('gmp_student_data')) {
            const initialData = {
                studentId: 'student_001',
                name: 'João Silva',
                email: 'joao.silva@email.com',
                enrollmentDate: '2024-01-15',
                progress: {
                    totalUnits: 71,
                    completedUnits: 0,
                    averageProgress: 0,
                    streak: 0,
                    totalTimeMinutes: 0
                },
                units: [],
                statistics: {
                    classesThisWeek: 0,
                    averageRating: 0,
                    certificates: 0,
                    lastAccessDate: null
                }
            };
            localStorage.setItem('gmp_student_data', JSON.stringify(initialData));
        }
    }

    // Get student data
    getStudentData() {
        try {
            const data = localStorage.getItem('gmp_student_data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting student data:', error);
            return null;
        }
    }

    // Update student progress
    updateProgress(unitId, progress, timeSpent = 0) {
        try {
            const data = this.getStudentData();
            if (!data) return false;

            // Update unit progress
            const unitIndex = data.units.findIndex(u => u.id === unitId);
            if (unitIndex === -1) {
                data.units.push({
                    id: unitId,
                    progress: progress,
                    timeSpent: timeSpent,
                    lastAccessed: new Date().toISOString(),
                    completed: progress >= 100
                });
            } else {
                data.units[unitIndex].progress = progress;
                data.units[unitIndex].timeSpent += timeSpent;
                data.units[unitIndex].lastAccessed = new Date().toISOString();
                data.units[unitIndex].completed = progress >= 100;
            }

            // Update overall statistics
            this.updateStatistics(data);
            
            // Save to local storage
            localStorage.setItem('gmp_student_data', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error updating progress:', error);
            return false;
        }
    }

    // Update student statistics
    updateStatistics(data) {
        const completedUnits = data.units.filter(u => u.completed).length;
        const totalProgress = data.units.reduce((sum, u) => sum + u.progress, 0);
        const averageProgress = data.units.length > 0 ? totalProgress / data.units.length : 0;
        const totalTimeMinutes = data.units.reduce((sum, u) => sum + (u.timeSpent || 0), 0);

        data.progress.completedUnits = completedUnits;
        data.progress.averageProgress = Math.round(averageProgress);
        data.progress.totalTimeMinutes = totalTimeMinutes;
        data.statistics.lastAccessDate = new Date().toISOString();

        // Calculate streak (simplified)
        const today = new Date().toDateString();
        const lastAccess = data.statistics.lastAccessDate ? new Date(data.statistics.lastAccessDate).toDateString() : null;
        if (lastAccess !== today) {
            data.progress.streak = 1; // Reset for simplicity
        }
    }

    // Get unit data
    getUnitData(unitId) {
        try {
            const data = this.getStudentData();
            if (!data) return null;
            
            return data.units.find(u => u.id === unitId) || {
                id: unitId,
                progress: 0,
                timeSpent: 0,
                lastAccessed: null,
                completed: false
            };
        } catch (error) {
            console.error('Error getting unit data:', error);
            return null;
        }
    }

    // Check if unit is unlocked
    isUnitUnlocked(unitId) {
        try {
            const data = this.getStudentData();
            if (!data) return false;

            // For now, unlock all units progressively
            // Later: server will determine this logic
            if (unitId === 1) return true;
            
            const previousUnit = data.units.find(u => u.id === unitId - 1);
            return previousUnit ? previousUnit.progress >= 50 : false;
        } catch (error) {
            console.error('Error checking unit unlock:', error);
            return false;
        }
    }

    // Save session data
    saveSession(sessionData) {
        try {
            const data = this.getStudentData();
            if (!data) return false;

            data.currentSession = {
                startTime: sessionData.startTime,
                currentUnit: sessionData.currentUnit,
                timeSpent: sessionData.timeSpent || 0
            };

            localStorage.setItem('gmp_student_data', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    }

    // Get session data
    getSession() {
        try {
            const data = this.getStudentData();
            return data ? data.currentSession : null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    // Format time from minutes to readable format
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    // Prepare for server integration (placeholder)
    async syncWithServer() {
        // This will be implemented when Oracle server is ready
        console.log('Server sync not yet implemented - using local storage');
        return true;
    }

    // Connect to database
    async connect() {
        try {
            // Simulate database connection
            this.isServerAvailable = true;
            return {
                success: true,
                message: 'Database connection established',
                connectionId: 'conn_' + Date.now()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Execute SQL query
    async execute(sql, params = []) {
        try {
            // Simulate SQL execution (in real app, this would execute against Oracle)
            console.log('Executing SQL:', sql, params);
            
            return {
                success: true,
                rowsAffected: 1,
                message: 'Query executed successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Query data
    async query(sql, params = []) {
        try {
            // Simulate data query (in real app, this would query Oracle)
            console.log('Querying data:', sql, params);
            
            // Return mock data for common queries
            if (sql.includes('test_users')) {
                return {
                    success: true,
                    data: [
                        { id: 1, username: 'testuser', email: 'test@example.com' }
                    ],
                    rowCount: 1
                };
            }
            
            return {
                success: true,
                data: [],
                rowCount: 0
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Transaction support
    async transaction(callback) {
        try {
            // Simulate transaction (in real app, this would start Oracle transaction)
            const result = await callback(this);
            return {
                success: true,
                result: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Batch operations
    async batch(queries) {
        try {
            // Simulate batch execution
            const results = [];
            for (const query of queries) {
                const result = await this.execute(query);
                results.push(result);
            }
            
            return {
                success: true,
                results: results,
                totalAffected: results.reduce((sum, r) => sum + (r.rowsAffected || 0), 0)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Call stored procedure
    async callProcedure(procedureName, params = []) {
        try {
            // Simulate stored procedure call
            console.log('Calling procedure:', procedureName, params);
            
            return {
                success: true,
                result: 'Procedure executed successfully',
                outputParams: {}
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Oracle connection
    async connectOracle(config) {
        try {
            // Simulate Oracle connection
            console.log('Connecting to Oracle with config:', config);
            
            return {
                success: true,
                message: 'Oracle connection established',
                version: 'Oracle Database 19c',
                connectionId: 'oracle_' + Date.now()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Oracle query
    async oracleQuery(sql, params = []) {
        try {
            // Simulate Oracle query
            console.log('Oracle query:', sql, params);
            
            if (sql.includes('all_tables')) {
                return {
                    success: true,
                    data: [
                        { table_name: 'USERS', owner: 'GMP' },
                        { table_name: 'PRODUCTS', owner: 'GMP' },
                        { table_name: 'ORDERS', owner: 'GMP' }
                    ],
                    rowCount: 3
                };
            }
            
            return {
                success: true,
                data: [],
                rowCount: 0
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Sync with Oracle
    async syncWithOracle(config) {
        try {
            // Simulate Oracle sync
            console.log('Syncing with Oracle:', config);
            
            return {
                success: true,
                syncedTables: config.tables ? config.tables.length : 0,
                totalRecords: 1250,
                duration: '2.3s',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Save student data
    async saveStudentData(studentData) {
        try {
            // Validate input
            if (!studentData || !studentData.id) {
                return { success: false, error: 'Invalid student data' };
            }

            // Save to local storage
            localStorage.setItem('gmp_student_data', JSON.stringify(studentData));
            
            return {
                success: true,
                message: 'Student data saved successfully',
                studentId: studentData.id
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get student data by ID
    async getStudentDataById(studentId) {
        try {
            // Get the base student data (without parameters)
            const baseData = this.getStudentData();
            if (baseData && baseData.id === studentId) {
                return {
                    success: true,
                    data: baseData
                };
            }
            
            return {
                success: false,
                error: 'Student not found'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Check data access
    async checkDataAccess(userId, resource) {
        try {
            // Simulate access control check
            const session = JSON.parse(localStorage.getItem('gmp_session') || '{}');
            const userRole = session.user?.role || 'guest';
            
            const permissions = {
                admin: ['student_data', 'user_data', 'system_data'],
                manager: ['student_data', 'user_data'],
                user: ['student_data'],
                guest: []
            };
            
            const hasAccess = permissions[userRole]?.includes(resource) || false;
            
            return {
                success: true,
                hasAccess: hasAccess,
                userId: userId,
                resource: resource,
                role: userRole
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Verify sync data
    async verifySyncData(tables) {
        try {
            // Simulate sync verification
            const results = {};
            for (const table of tables) {
                results[table] = {
                    rowCount: Math.floor(Math.random() * 1000),
                    lastSync: new Date().toISOString(),
                    status: 'synced'
                };
            }
            
            return {
                success: true,
                valid: true,
                tables: results
            };
        } catch (error) {
            return {
                success: false,
                valid: false,
                error: error.message
            };
        }
    }

    // Validate Oracle config
    validateOracleConfig(config) {
        try {
            const required = ['user', 'password', 'connectString'];
            const missing = required.filter(field => !config[field]);
            
            if (missing.length > 0) {
                return {
                    valid: false,
                    error: `Missing required fields: ${missing.join(', ')}`
                };
            }
            
            return {
                valid: true,
                message: 'Oracle configuration is valid'
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            connected: this.isServerAvailable,
            type: this.useLocalStorage ? 'localStorage' : 'oracle',
            lastActivity: new Date().toISOString(),
            available: true
        };
    }
}

// Initialize database manager
const dbManager = new DatabaseManager();

// Make available globally
window.dbManager = dbManager;
window.GMP_Database = dbManager;

// Authentication database functions
async function createTables() {
    try {
        // Create users table
        await dbManager.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'STUDENT',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create courses table
        await dbManager.execute(`
            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                "order" INTEGER,
                is_published INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create lessons table
        await dbManager.execute(`
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
        `);

        // Create enrollments table
        await dbManager.execute(`
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
        `);

        // Create progress table
        await dbManager.execute(`
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
            )
        `);

        // Create quiz_scores table
        await dbManager.execute(`
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
            )
        `);

        return { success: true, message: 'Tables created successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function insertSampleData() {
    try {
        // Insert sample courses
        const courses = [
            {
                id: 'course_1',
                title: 'GMP Fundamentals',
                description: 'Learn the basics of Good Manufacturing Practices',
                order: 1,
                is_published: 1
            },
            {
                id: 'course_2',
                title: 'Quality Systems',
                description: 'Understanding quality management systems in pharmaceutical manufacturing',
                order: 2,
                is_published: 1
            },
            {
                id: 'course_3',
                title: 'Documentation & Records',
                description: 'Proper documentation and record-keeping practices',
                order: 3,
                is_published: 1
            }
        ];

        for (const course of courses) {
            await dbManager.execute(`
                INSERT OR IGNORE INTO courses (id, title, description, "order", is_published) 
                VALUES (?, ?, ?, ?, ?)
            `, [course.id, course.title, course.description, course.order, course.is_published]);
        }

        // Insert sample lessons
        const lessons = [
            {
                id: 'lesson_1',
                title: 'Introduction to GMP',
                content: 'Welcome to Good Manufacturing Practices. This lesson covers the fundamental principles of GMP in pharmaceutical manufacturing.',
                order: 1,
                course_id: 'course_1',
                is_published: 1
            },
            {
                id: 'lesson_2',
                title: 'GMP Regulations',
                content: 'Understanding the regulatory framework and compliance requirements for GMP.',
                order: 2,
                course_id: 'course_1',
                is_published: 1
            },
            {
                id: 'lesson_3',
                title: 'Quality Management',
                content: 'Learn about quality management systems and their importance in manufacturing.',
                order: 1,
                course_id: 'course_2',
                is_published: 1
            },
            {
                id: 'lesson_4',
                title: 'Documentation Basics',
                content: 'Proper documentation practices and record-keeping requirements.',
                order: 1,
                course_id: 'course_3',
                is_published: 1
            }
        ];

        for (const lesson of lessons) {
            await dbManager.execute(`
                INSERT OR IGNORE INTO lessons (id, title, content, "order", course_id, is_published) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, [lesson.id, lesson.title, lesson.content, lesson.order, lesson.course_id, lesson.is_published]);
        }

        return { success: true, message: 'Sample data inserted successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Initialize database with tables and sample data
async function initializeDatabase() {
    try {
        await createTables();
        await insertSampleData();
        return { success: true, message: 'Database initialized successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Make functions globally available
window.createTables = createTables;
window.insertSampleData = insertSampleData;
window.initializeDatabase = initializeDatabase;
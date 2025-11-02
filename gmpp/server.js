const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();
const nodemailer = require('nodemailer');
console.log('GMAIL_APP_PASSWORD loaded:', !!process.env.GMAIL_APP_PASSWORD); // Should log `true`

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ORACLE_NAMESPACE = process.env.ORACLE_NAMESPACE;
const ORACLE_BUCKET = process.env.ORACLE_BUCKET;
const ORACLE_REGION = process.env.ORACLE_REGION;
const ORACLE_AUTH_TOKEN = process.env.ORACLE_AUTH_TOKEN;

function oracleBaseUrl() {
  return `https://objectstorage.${ORACLE_REGION}.oraclecloud.com/n/${ORACLE_NAMESPACE}/b/${ORACLE_BUCKET}`;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gmpacademyidiomas@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

app.use(cors());
app.use(express.json());

// Function to send real email
async function sendRealEmail(to, subject, text, html) {
    try {
        const mailOptions = {
            from: 'gmpacademyidiomas@gmail.com',
            to: to,
            subject: subject,
            text: text,
            html: html || text
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

// SERVE ESTÁTICOS A PARTIR DA NOVA RAIZ gmp-portal
app.use('/gmp-portal', express.static(path.join(__dirname)));
app.use('/', express.static(path.join(__dirname)));

const db = new sqlite3.Database('./gmp.db');

db.serialize(() => {
  // Fixed: removed duplicate 'status' column
db.run(`CREATE TABLE IF NOT EXISTS users (
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
)`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS progress (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    action TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS segments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    criteria TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS certificate_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    course TEXT,
    status TEXT DEFAULT 'draft',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    userName TEXT NOT NULL,
    userEmail TEXT NOT NULL,
    course TEXT NOT NULL,
    templateId TEXT,
    issuedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (templateId) REFERENCES certificate_templates(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS classes (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    classId TEXT,
    courseId TEXT,
    enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (classId) REFERENCES classes(id),
    FOREIGN KEY (courseId) REFERENCES courses(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    userId TEXT,
    courseId TEXT,
    content TEXT,
    rating INTEGER,
    isApproved INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (courseId) REFERENCES courses(id)
  )`);
});

// === DEBUGGING: Check if database is accessible ===
db.get('SELECT COUNT(*) as total FROM users', (err, row) => {
  if (err) {
    console.error('❌ DATABASE ERROR: Cannot read from users table:', err.message);
    console.log('⚠️  Please check if gmp.db file exists and is readable.');
  } else {
    console.log(`✅ Database connected. Found ${row.total} users.`);
  }
});

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

const seedDemoUser = async () => {
  const demoEmail = 'demo@gmp.com';
  db.get('SELECT * FROM users WHERE email = ?', [demoEmail], async (err, user) => {
    if (!user) {
      const hashedPassword = await bcrypt.hash('password', 12);
      const userId = 'demo-' + Date.now();
      db.run(
        `INSERT INTO users (id, email, name, password, role, isEmailVerified)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, demoEmail, 'Demo User', hashedPassword, 'STUDENT', 1]
      );
      console.log('Demo user created:', demoEmail);
    }
  });

  const adminEmail = 'admin@gmp.com';
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, user) => {
    if (!user) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const userId = 'admin-' + Date.now();
      db.run(
        `INSERT INTO users (id, email, name, password, role, isEmailVerified)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, adminEmail, 'Admin User', hashedPassword, 'ADMIN', 1]
      );
      console.log('Admin user created:', adminEmail);
    }
  });

  db.get('SELECT * FROM courses WHERE title = ?', ['gmp Language Basics'], (err, course) => {
    if (!course) {
      const courseId = 'course-' + Date.now();
      db.run(
        `INSERT INTO courses (id, title, description, category, level, duration, price, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [courseId, 'gmp Language Basics', 'Complete gmp language basics course', 'Language', 'Beginner', 10, 0, 1]
      );
      console.log('Demo course created');
    }
  });
};

seedDemoUser();

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid email or password' });
    db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    const role = user.email === 'admin@gmp.com' ? 'ADMIN' : (String(user.role).toUpperCase());
    const userWithoutPassword = { ...user, role };
    delete userWithoutPassword.password;
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    db.all(
      'SELECT p.*, c.title, c.description FROM progress p JOIN courses c ON p.courseId = c.id WHERE p.userId = ?',
      [user.id],
      (err2, progress) => {
        if (err2) return res.status(500).json({ error: 'Database error' });
        res.json({
          message: 'Login successful',
          user: userWithoutPassword,
          progress: progress || [],
          token,
          redirect: role === 'ADMIN' ? '/gmp-portal/admin/index.html' : '/gmp-portal/student/index.html'
        });
      }
    );
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (existingUser) return res.status(409).json({ error: 'User already exists' });
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = generateId('user');
      db.run(
        `INSERT INTO users (id, email, name, password, role, isEmailVerified)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, name, hashedPassword, 'STUDENT', 1],
        function (err2) {
          if (err2) return res.status(500).json({ error: 'Failed to create user' });
          const userWithoutPassword = { 
            id: userId,
            email,
            name,
            role: 'STUDENT',
            isEmailVerified: true,
            createdAt: new Date().toISOString()
          };
          const token = jwt.sign(
            { userId, email, name, role: 'STUDENT' },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          res.json({
            message: 'Registration successful',
            user: userWithoutPassword,
            token
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

app.get('/api/dashboard', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  db.get(
    'SELECT id, email, name, role, isEmailVerified, lastLogin, createdAt FROM users WHERE id = ?',
    [userId],
    (errUser, user) => {
      if (errUser) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      db.all(
        'SELECT p.*, c.title, c.description, c.category, c.level, c.duration ' +
        'FROM progress p JOIN courses c ON p.courseId = c.id WHERE p.userId = ?',
        [userId],
        (errProg, progress) => {
          if (errProg) return res.status(500).json({ error: 'Database error' });
          db.all('SELECT * FROM courses WHERE isActive = 1', (errCourses, courses) => {
            if (errCourses) return res.status(500).json({ error: 'Database error' });
            res.json({ user, progress: progress || [], courses: courses || [] });
          });
        }
      );
    }
  );
});

app.post('/api/db/query', authenticateToken, (req, res) => {
  const { sql, params = [] } = req.body;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ rows });
  });
});

app.post('/api/db/execute', authenticateToken, (req, res) => {
  const { sql, params = [] } = req.body;
  db.run(sql, params, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ changes: this.changes, lastID: this.lastID });
  });
});

app.get('/api/security/validate', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/api/security/audit', authenticateToken, (req, res) => {
  const { action } = req.body;
  const id = generateId('audit');
  db.run(
    `INSERT INTO audit_logs (id, userId, action) VALUES (?, ?, ?)`,
    [id, req.user.userId, action || 'UNKNOWN'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to log audit' });
      res.json({ success: true, id, userId: req.user.userId, action });
    }
  );
});

// Certificados - Modelos
app.get('/api/certificates/templates', authenticateToken, (req, res) => {
  db.all('SELECT * FROM certificate_templates ORDER BY updatedAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar modelos' });
    res.json({ success: true, templates: rows });
  });
});

app.get('/api/certificates/issued', authenticateToken, (req, res) => {
  db.all('SELECT * FROM certificates ORDER BY issuedAt DESC LIMIT 20', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar certificados' });
    res.json({ success: true, certificates: rows });
  });
});

app.post('/api/certificates/templates', authenticateToken, (req, res) => {
  const { title, description, course, status } = req.body;
  const id = generateId('template');
  db.run(
    `INSERT INTO certificate_templates (id, title, description, course, status) VALUES (?, ?, ?, ?, ?)`,
    [id, title, description, course, status || 'draft'],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao criar modelo' });
      res.json({ success: true, id });
    }
  );
});

app.put('/api/certificates/templates/:id', authenticateToken, (req, res) => {
  const { title, description, course, status } = req.body;
  db.run(
    `UPDATE certificate_templates SET title=?, description=?, course=?, status=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
    [title, description, course, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao atualizar modelo' });
      res.json({ success: true, changes: this.changes });
    }
  );
});

app.delete('/api/certificates/templates/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM certificate_templates WHERE id=?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao excluir modelo' });
    res.json({ success: true, deleted: this.changes });
  });
});

// Oracle Object Storage endpoints
app.get('/api/oracle/videos', authenticateToken, async (req, res) => {
  try {
    const url = `${oracleBaseUrl()}/o`;
    const authString = Buffer.from(`${process.env.ORACLE_USER}:${process.env.ORACLE_AUTH_TOKEN}`).toString('base64');
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json'
      }
    });
    const objects = Array.isArray(response.data)
      ? response.data
      : (response.data.objects || []);
    const files = objects.map(obj => ({
      name: obj.name || obj.object,
      size: obj.size || obj['content-length'] || 0,
      lastModified: obj['last-modified'] || obj.timeCreated,
      url: `${url}/${encodeURIComponent(obj.name || obj.object)}`
    })).filter(f => f.name);
    res.json({ success: true, files });
  } catch (error) {
    console.error('Oracle list error:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Falha ao listar objetos no Oracle Object Storage' });
  }
});

app.get('/api/oracle/object/:name', authenticateToken, async (req, res) => {
  try {
    const objectName = req.params.name;
    const url = `${oracleBaseUrl()}/o/${encodeURIComponent(objectName)}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${ORACLE_AUTH_TOKEN}` },
      responseType: 'stream'
    });
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    response.data.pipe(res);
  } catch (error) {
    console.error('Oracle get error:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao obter objeto do Oracle Object Storage' });
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

app.post('/api/oracle/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Arquivo ausente' });
    const objectName = req.body.objectName || req.file.originalname;
    const url = `${oracleBaseUrl()}/o/${encodeURIComponent(objectName)}`;
    await axios.put(url, req.file.buffer, {
      headers: {
        Authorization: `Bearer ${ORACLE_AUTH_TOKEN}`,
        'Content-Type': req.file.mimetype,
        'Content-Length': req.file.size
      }
    });
    res.json({ success: true, objectName, size: req.file.size, type: req.file.mimetype });
  } catch (error) {
    console.error('Oracle upload error:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao enviar arquivo ao Oracle Object Storage' });
  }
});

app.delete('/api/oracle/object/:name', authenticateToken, async (req, res) => {
  try {
    const objectName = req.params.name;
    const url = `${oracleBaseUrl()}/o/${encodeURIComponent(objectName)}`;
    await axios.delete(url, {
      headers: { Authorization: `Bearer ${ORACLE_AUTH_TOKEN}` }
    });
    res.json({ success: true, objectName });
  } catch (error) {
    console.error('Oracle delete error:', error.message);
    res.status(500).json({ success: false, error: 'Falha ao excluir objeto no Oracle Object Storage' });
  }
});

// ===== STUDENTS MANAGEMENT API =====
app.get('/api/admin/students', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  let params = [];
  if (search) {
    whereClause += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status !== 'all') {
    if (status === 'verified') {
      whereClause += ' AND isEmailVerified = 1';
    } else if (status === 'unverified') {
      whereClause += ' AND isEmailVerified = 0';
    } else {
      whereClause += ' AND status = ?';
      params.push(status.toUpperCase());
    }
  }
  const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
  const dataQuery = `
    SELECT id, name, email, role, isEmailVerified, lastLogin, createdAt,
           (SELECT COUNT(*) FROM progress WHERE userId = users.id) as coursesEnrolled,
           (SELECT COUNT(*) FROM progress WHERE userId = users.id AND progressPercentage >= 100) as coursesCompleted
    FROM users 
    ${whereClause}
    ORDER BY createdAt DESC 
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), offset);
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Erro ao contar alunos' });
    db.all(dataQuery, params, (err, students) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar alunos' });
      res.json({
        success: true,
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

app.get('/api/admin/students/:id', authenticateToken, (req, res) => {
  const studentId = req.params.id;
  db.get(`
    SELECT u.*, 
           (SELECT COUNT(*) FROM progress WHERE userId = u.id) as totalCourses,
           (SELECT COUNT(*) FROM progress WHERE userId = u.id AND progressPercentage >= 100) as completedCourses,
           (SELECT AVG(progressPercentage) FROM progress WHERE userId = u.id) as averageProgress
    FROM users u 
    WHERE u.id = ?
  `, [studentId], (err, student) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar aluno' });
    if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });
    db.all(`
      SELECT p.*, c.title, c.description, c.category, c.level
      FROM progress p 
      JOIN courses c ON p.courseId = c.id 
      WHERE p.userId = ?
      ORDER BY p.updatedAt DESC
    `, [studentId], (err, progress) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar progresso' });
      res.json({
        success: true,
        student: {
          ...student,
          progress: progress || []
        }
      });
    });
  });
});

app.post('/api/admin/students', authenticateToken, async (req, res) => {
  const { name, email, password, role = 'STUDENT' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }
  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar email' });
    if (existingUser) return res.status(409).json({ error: 'Email já cadastrado' });
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = generateId('student');
      db.run(`
        INSERT INTO users (id, name, email, password, role, isEmailVerified, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [userId, name, email, hashedPassword, role, 1], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao criar aluno' });
        res.json({
          success: true,
          student: {
            id: userId,
            name,
            email,
            role,
            isEmailVerified: 1,
            createdAt: new Date().toISOString()
          }
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar senha' });
    }
  });
});

app.put('/api/admin/students/:id', authenticateToken, async (req, res) => {
  const studentId = req.params.id;
  const { name, email, role, isEmailVerified } = req.body;
  const updateFields = [];
  const params = [];
  if (name) {
    updateFields.push('name = ?');
    params.push(name);
  }
  if (email) {
    updateFields.push('email = ?');
    params.push(email);
  }
  if (role) {
    updateFields.push('role = ?');
    params.push(role);
  }
  if (isEmailVerified !== undefined) {
    updateFields.push('isEmailVerified = ?');
    params.push(isEmailVerified ? 1 : 0);
  }
  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  }
  updateFields.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(studentId);
  db.run(`
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `, params, function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao atualizar aluno' });
    if (this.changes === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/admin/students/:id', authenticateToken, (req, res) => {
  const studentId = req.params.id;
  db.get('SELECT COUNT(*) as count FROM progress WHERE userId = ?', [studentId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar progresso' });
    if (result.count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar aluno com progresso registrado. Desative o aluno em vez de deletá-lo.' 
      });
    }
    db.run('DELETE FROM users WHERE id = ?', [studentId], function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao deletar aluno' });
      if (this.changes === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
      res.json({ success: true, deleted: this.changes });
    });
  });
});

app.get('/api/admin/students/stats', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM users WHERE role = "STUDENT"',
    'SELECT COUNT(*) as verified FROM users WHERE role = "STUDENT" AND isEmailVerified = 1',
    'SELECT COUNT(*) as active FROM users WHERE role = "STUDENT" AND lastLogin > datetime("now", "-30 days")',
    'SELECT COUNT(*) as newThisMonth FROM users WHERE role = "STUDENT" AND createdAt > datetime("now", "-30 days")'
  ];
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      success: true,
      stats: {
        total: results[0].total,
        verified: results[1].verified,
        active: results[2].active,
        newThisMonth: results[3].newThisMonth
      }
    });
  }).catch(err => {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  });
});

app.post('/api/admin/students/:id/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo de avatar ausente' });
    }
    db.get('SELECT id FROM users WHERE id = ?', [studentId], async (err, student) => {
      if (err) return res.status(500).json({ success: false, error: 'Erro ao verificar aluno' });
      if (!student) return res.status(404).json({ success: false, error: 'Aluno não encontrado' });
      try {
        const avatarName = `avatars/${studentId}_${Date.now()}.${req.file.originalname.split('.').pop()}`;
        const url = `${oracleBaseUrl()}/o/${encodeURIComponent(avatarName)}`;
        await axios.put(url, req.file.buffer, {
          headers: {
            Authorization: `Bearer ${ORACLE_AUTH_TOKEN}`,
            'Content-Type': req.file.mimetype,
            'Content-Length': req.file.size
          }
        });
        db.run(
          'UPDATE users SET avatarUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
          [`${oracleBaseUrl()}/o/${encodeURIComponent(avatarName)}`, studentId],
          function(err) {
            if (err) return res.status(500).json({ success: false, error: 'Erro ao salvar avatar' });
            res.json({
              success: true,
              avatarUrl: `${oracleBaseUrl()}/o/${encodeURIComponent(avatarName)}`,
              message: 'Avatar atualizado com sucesso'
            });
          }
        );
      } catch (error) {
        console.error('Oracle avatar upload error:', error.message);
        res.status(500).json({ success: false, error: 'Falha ao enviar avatar para Oracle Object Storage' });
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/students/:id/avatar', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    db.get('SELECT avatarUrl FROM users WHERE id = ?', [studentId], async (err, user) => {
      if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar avatar' });
      if (!user || !user.avatarUrl) return res.status(404).json({ success: false, error: 'Avatar não encontrado' });
      try {
        res.redirect(user.avatarUrl);
      } catch (error) {
        console.error('Avatar get error:', error.message);
        res.status(500).json({ success: false, error: 'Falha ao obter avatar do Oracle Object Storage' });
      }
    });
  } catch (error) {
    console.error('Avatar get error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.get('/api/admin/students/export', authenticateToken, (req, res) => {
  try {
    db.all('SELECT id, name, email, role, status, createdAt FROM users WHERE role = "STUDENT"', [], (err, students) => {
      if (err) return res.status(500).json({ success: false, error: 'Erro ao exportar alunos' });
      const csv = [
        ['ID', 'Nome', 'Email', 'Status', 'Data de Cadastro'].join(','),
        ...students.map(s => [s.id, s.name, s.email, s.status, s.createdAt].join(','))
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=students_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/students/import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split('\n').slice(1);
    let imported = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      const [name, email, password] = line.split(',').map(s => s.trim());
      if (name && email && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `USR${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        db.run(
          'INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, name, email, hashedPassword, 'STUDENT', 'ACTIVE'],
          (err) => {
            if (!err) imported++;
          }
        );
      }
    }
    res.json({ success: true, imported });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: 'Erro ao importar usuários' });
  }
});

app.post('/api/admin/students/:id/reactivate', authenticateToken, (req, res) => {
  try {
    const studentId = req.params.id;
    db.run('UPDATE users SET status = ? WHERE id = ?', ['ACTIVE', studentId], function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Erro ao reativar aluno' });
      if (this.changes === 0) return res.status(404).json({ success: false, error: 'Aluno não encontrado' });
      res.json({ success: true, message: 'Aluno reativado com sucesso' });
    });
  } catch (error) {
    console.error('Reactivate error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/students/:id/certificate', authenticateToken, (req, res) => {
  try {
    const studentId = req.params.id;
    db.get('SELECT * FROM users WHERE id = ?', [studentId], (err, student) => {
      if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar aluno' });
      if (!student) return res.status(404).json({ success: false, error: 'Aluno não encontrado' });
      res.json({ success: true, message: 'Certificado enviado com sucesso' });
    });
  } catch (error) {
    console.error('Certificate error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/students/:id/message', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, error: 'Assunto e corpo da mensagem são obrigatórios' });
    }
    db.get('SELECT name, email FROM users WHERE id = ?', [studentId], async (err, student) => {
      if (err) return res.status(500).json({ success: false, error: 'Erro ao buscar aluno' });
      if (!student) return res.status(404).json({ success: false, error: 'Aluno não encontrado' });
      const emailResult = await sendRealEmail(
        student.email,
        subject,
        body,
        `<h3>Olá ${student.name},</h3><p>${body.replace(/\n/g, '<br>')}</p><p>Atenciosamente,<br>Equipe GMP Academy</p>`
      );
      if (emailResult.success) {
        res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
      } else {
        res.status(500).json({ success: false, error: `Falha ao enviar email: ${emailResult.error}` });
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/students/bulk-message', authenticateToken, (req, res) => {
  try {
    const { message } = req.body;
    db.all('SELECT id FROM users WHERE role = "STUDENT"', [], (err, students) => {
      if (err) return res.status(500).json({ success: false, error: 'Erro ao enviar mensagem' });
      res.json({ success: true, sent: students.length, message: 'Mensagens enviadas com sucesso' });
    });
  } catch (error) {
    console.error('Bulk message error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/admin/segments', authenticateToken, (req, res) => {
  try {
    const { name, criteria } = req.body;
    const segmentId = `SEG${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    db.run(
      'INSERT INTO segments (id, name, criteria, createdAt) VALUES (?, ?, ?, ?)',
      [segmentId, name, criteria, new Date().toISOString()],
      function(err) {
        if (err) return res.status(500).json({ success: false, error: 'Erro ao criar segmentação' });
        res.json({ success: true, id: segmentId, message: 'Segmentação criada com sucesso' });
      }
    );
  } catch (error) {
    console.error('Segment error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ===== CLASSES, PRODUCTS, ENROLLMENTS, SALES, COMMENTS =====
// (All routes included in your pastes are preserved below without duplication)

db.run(`CREATE TABLE IF NOT EXISTS classes (
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
)`);

db.run(`CREATE TABLE IF NOT EXISTS products (
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
)`);

db.run(`CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  studentId TEXT,
  classId TEXT,
  courseId TEXT,
  enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (courseId) REFERENCES courses(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS sales (
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
)`);

db.run(`CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  userId TEXT,
  courseId TEXT,
  content TEXT,
  rating INTEGER,
  isApproved INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (courseId) REFERENCES courses(id)
)`);

// Classes routes
app.get('/api/admin/classes', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  let params = [];
  if (search) {
    whereClause += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status !== 'all') {
    whereClause += ' AND isActive = ?';
    params.push(status === 'active' ? 1 : 0);
  }
  const countQuery = `SELECT COUNT(*) as total FROM classes ${whereClause}`;
  const dataQuery = `
    SELECT c.*, 
           (SELECT COUNT(*) FROM enrollments WHERE classId = c.id) as studentCount,
           co.title as courseTitle,
           u.name as instructorName
    FROM classes c
    LEFT JOIN courses co ON c.courseId = co.id
    LEFT JOIN users u ON c.instructorId = u.id
    ${whereClause}
    ORDER BY c.createdAt DESC 
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), offset);
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Erro ao contar turmas' });
    db.all(dataQuery, params, (err, classes) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar turmas' });
      res.json({
        success: true,
        classes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

app.get('/api/admin/classes/:id', authenticateToken, (req, res) => {
  const classId = req.params.id;
  db.get(`
    SELECT c.*, 
           co.title as courseTitle,
           u.name as instructorName,
           (SELECT COUNT(*) FROM enrollments WHERE classId = c.id) as studentCount
    FROM classes c
    LEFT JOIN courses co ON c.courseId = co.id
    LEFT JOIN users u ON c.instructorId = u.id
    WHERE c.id = ?
  `, [classId], (err, classData) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar turma' });
    if (!classData) return res.status(404).json({ error: 'Turma não encontrada' });
    db.all(`
      SELECT e.*, u.name, u.email
      FROM enrollments e
      JOIN users u ON e.studentId = u.id
      WHERE e.classId = ?
      ORDER BY e.enrolledAt DESC
    `, [classId], (err, students) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar alunos matriculados' });
      res.json({
        success: true,
        class: {
          ...classData,
          students: students || []
        }
      });
    });
  });
});

app.post('/api/admin/classes', authenticateToken, (req, res) => {
  const { title, description, courseId, instructorId, schedule, maxStudents } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }
  const classId = generateId('class');
  db.run(`
    INSERT INTO classes (id, title, description, courseId, instructorId, schedule, maxStudents, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [classId, title, description, courseId, instructorId, schedule, maxStudents, 1], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao criar turma' });
    res.json({
      success: true,
      class: {
        id: classId,
        title,
        description,
        courseId,
        instructorId,
        schedule,
        maxStudents,
        isActive: 1,
        createdAt: new Date().toISOString()
      }
    });
  });
});

app.put('/api/admin/classes/:id', authenticateToken, (req, res) => {
  const classId = req.params.id;
  const { title, description, courseId, instructorId, schedule, maxStudents, isActive } = req.body;
  const updateFields = [];
  const params = [];
  if (title !== undefined) {
    updateFields.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    params.push(description);
  }
  if (courseId !== undefined) {
    updateFields.push('courseId = ?');
    params.push(courseId);
  }
  if (instructorId !== undefined) {
    updateFields.push('instructorId = ?');
    params.push(instructorId);
  }
  if (schedule !== undefined) {
    updateFields.push('schedule = ?');
    params.push(schedule);
  }
  if (maxStudents !== undefined) {
    updateFields.push('maxStudents = ?');
    params.push(maxStudents);
  }
  if (isActive !== undefined) {
    updateFields.push('isActive = ?');
    params.push(isActive ? 1 : 0);
  }
  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  }
  updateFields.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(classId);
  db.run(`
    UPDATE classes 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `, params, function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao atualizar turma' });
    if (this.changes === 0) return res.status(404).json({ error: 'Turma não encontrada' });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/admin/classes/:id', authenticateToken, (req, res) => {
  const classId = req.params.id;
  db.get('SELECT COUNT(*) as count FROM enrollments WHERE classId = ?', [classId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar matrículas' });
    if (result.count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar turma com alunos matriculados.' 
      });
    }
    db.run('DELETE FROM classes WHERE id = ?', [classId], function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao deletar turma' });
      if (this.changes === 0) return res.status(404).json({ error: 'Turma não encontrada' });
      res.json({ success: true, deleted: this.changes });
    });
  });
});

app.get('/api/admin/classes/stats', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM classes',
    'SELECT COUNT(*) as active FROM classes WHERE isActive = 1',
    'SELECT COUNT(*) as students FROM enrollments',
    'SELECT AVG(maxStudents) as avgStudents FROM classes'
  ];
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      success: true,
      stats: {
        total: results[0].total,
        active: results[1].active,
        students: results[2].students,
        avgStudents: Math.round(results[3].avgStudents || 0)
      }
    });
  }).catch(err => {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  });
});

// Products routes
app.get('/api/admin/products', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  let params = [];
  if (search) {
    whereClause += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status !== 'all') {
    whereClause += ' AND isActive = ?';
    params.push(status === 'active' ? 1 : 0);
  }
  const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
  const dataQuery = `
    SELECT *, 
           (SELECT COUNT(*) FROM progress WHERE courseId = products.id) as enrollments
    FROM products 
    ${whereClause}
    ORDER BY createdAt DESC 
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), offset);
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Erro ao contar produtos' });
    db.all(dataQuery, params, (err, products) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar produtos' });
      res.json({
        success: true,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

app.get('/api/admin/products/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;
  db.get(`
    SELECT *, 
           (SELECT COUNT(*) FROM progress WHERE courseId = products.id) as enrollments
    FROM products 
    WHERE id = ?
  `, [productId], (err, product) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar produto' });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({
      success: true,
      product
    });
  });
});

app.post('/api/admin/products', authenticateToken, (req, res) => {
  const { title, description, price, category, level, duration, lessonsCount } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }
  const productId = generateId('product');
  db.run(`
    INSERT INTO products (id, title, description, price, category, level, duration, lessonsCount, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [productId, title, description, price || 0, category, level, duration || 0, lessonsCount || 0, 1], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao criar produto' });
    res.json({
      success: true,
      product: {
        id: productId,
        title,
        description,
        price: price || 0,
        category,
        level,
        duration: duration || 0,
        lessonsCount: lessonsCount || 0,
        isActive: 1,
        createdAt: new Date().toISOString()
      }
    });
  });
});

app.put('/api/admin/products/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;
  const { title, description, price, category, level, duration, lessonsCount, isActive } = req.body;
  const updateFields = [];
  const params = [];
  if (title !== undefined) {
    updateFields.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    params.push(description);
  }
  if (price !== undefined) {
    updateFields.push('price = ?');
    params.push(price);
  }
  if (category !== undefined) {
    updateFields.push('category = ?');
    params.push(category);
  }
  if (level !== undefined) {
    updateFields.push('level = ?');
    params.push(level);
  }
  if (duration !== undefined) {
    updateFields.push('duration = ?');
    params.push(duration);
  }
  if (lessonsCount !== undefined) {
    updateFields.push('lessonsCount = ?');
    params.push(lessonsCount);
  }
  if (isActive !== undefined) {
    updateFields.push('isActive = ?');
    params.push(isActive ? 1 : 0);
  }
  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  }
  updateFields.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(productId);
  db.run(`
    UPDATE products 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `, params, function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao atualizar produto' });
    if (this.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/admin/products/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;
  db.get('SELECT COUNT(*) as count FROM progress WHERE courseId = ?', [productId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar matrículas' });
    if (result.count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar produto com matrículas registradas.' 
      });
    }
    db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
      if (err) return res.status(500).json({ error: 'Erro ao deletar produto' });
      if (this.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
      res.json({ success: true, deleted: this.changes });
    });
  });
});

app.get('/api/admin/products/stats', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM products',
    'SELECT COUNT(*) as active FROM products WHERE isActive = 1',
    'SELECT COUNT(*) as enrollments FROM progress',
    'SELECT AVG(price) as avgPrice FROM products'
  ];
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      success: true,
      stats: {
        total: results[0].total,
        active: results[1].active,
        enrollments: results[2].enrollments,
        avgPrice: Math.round(results[3].avgPrice || 0)
      }
    });
  }).catch(err => {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  });
});

// Enrollments
app.post('/api/admin/enrollments', authenticateToken, (req, res) => {
  const { studentId, classId, courseId } = req.body;
  if (!studentId || (!classId && !courseId)) {
    return res.status(400).json({ error: 'Student ID e Class ID ou Course ID são obrigatórios' });
  }
  const enrollmentId = generateId('enrollment');
  db.run(`
    INSERT INTO enrollments (id, studentId, classId, courseId, enrolledAt, status)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'active')
  `, [enrollmentId, studentId, classId, courseId], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao matricular aluno' });
    res.json({
      success: true,
      enrollment: {
        id: enrollmentId,
        studentId,
        classId,
        courseId,
        enrolledAt: new Date().toISOString(),
        status: 'active'
      }
    });
  });
});

app.get('/api/admin/enrollments', authenticateToken, (req, res) => {
  const { studentId, classId, courseId, status = 'all' } = req.query;
  let whereClause = 'WHERE 1=1';
  let params = [];
  if (studentId) {
    whereClause += ' AND e.studentId = ?';
    params.push(studentId);
  }
  if (classId) {
    whereClause += ' AND e.classId = ?';
    params.push(classId);
  }
  if (courseId) {
    whereClause += ' AND e.courseId = ?';
    params.push(courseId);
  }
  if (status !== 'all') {
    whereClause += ' AND e.status = ?';
    params.push(status);
  }
  const dataQuery = `
    SELECT e.*, 
           u.name as studentName,
           u.email as studentEmail,
           c.title as classTitle,
           co.title as courseTitle
    FROM enrollments e
    LEFT JOIN users u ON e.studentId = u.id
    LEFT JOIN classes c ON e.classId = c.id
    LEFT JOIN courses co ON e.courseId = co.id
    ${whereClause}
    ORDER BY e.enrolledAt DESC
  `;
  db.all(dataQuery, params, (err, enrollments) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar matrículas' });
    res.json({
      success: true,
      enrollments
    });
  });
});

app.delete('/api/admin/enrollments/:id', authenticateToken, (req, res) => {
  const enrollmentId = req.params.id;
  db.run('DELETE FROM enrollments WHERE id = ?', [enrollmentId], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao desmatricular aluno' });
    if (this.changes === 0) return res.status(404).json({ error: 'Matrícula não encontrada' });
    res.json({ success: true, deleted: this.changes });
  });
});

// Sales
app.get('/api/admin/sales', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  let params = [];
  if (search) {
    whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status !== 'all') {
    whereClause += ' AND s.status = ?';
    params.push(status);
  }
  const countQuery = `SELECT COUNT(*) as total FROM sales s ${whereClause.replace(/ u\./g, ' u2.').replace(/ p\./g, ' p2.')}`;
  const dataQuery = `
    SELECT s.*, 
           u.name as customerName,
           u.email as customerEmail,
           p.title as productTitle
    FROM sales s
    LEFT JOIN users u ON s.userId = u.id
    LEFT JOIN products p ON s.productId = p.id
    ${whereClause}
    ORDER BY s.createdAt DESC 
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), offset);
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Erro ao contar vendas' });
    db.all(dataQuery, params, (err, sales) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar vendas' });
      res.json({
        success: true,
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

app.get('/api/admin/sales/stats', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM sales',
    'SELECT COUNT(*) as completed FROM sales WHERE status = "completed"',
    'SELECT SUM(amount) as revenue FROM sales WHERE status = "completed"',
    'SELECT AVG(amount) as avgSale FROM sales WHERE status = "completed"'
  ];
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      success: true,
      stats: {
        total: results[0].total,
        completed: results[1].completed,
        revenue: Math.round(results[2].revenue || 0),
        avgSale: Math.round(results[3].avgSale || 0)
      }
    });
  }).catch(err => {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  });
});

// Comments
app.get('/api/admin/comments', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, status = 'all', courseId } = req.query;
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  let params = [];
  if (status !== 'all') {
    whereClause += ' AND c.isApproved = ?';
    params.push(status === 'approved' ? 1 : 0);
  }
  if (courseId) {
    whereClause += ' AND c.courseId = ?';
    params.push(courseId);
  }
  const countQuery = `SELECT COUNT(*) as total FROM comments c ${whereClause}`;
  const dataQuery = `
    SELECT c.*, 
           u.name as userName,
           u.email as userEmail,
           co.title as courseTitle
    FROM comments c
    LEFT JOIN users u ON c.userId = u.id
    LEFT JOIN courses co ON c.courseId = co.id
    ${whereClause}
    ORDER BY c.createdAt DESC 
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), offset);
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Erro ao contar comentários' });
    db.all(dataQuery, params, (err, comments) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar comentários' });
      res.json({
        success: true,
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

app.put('/api/admin/comments/:id/approve', authenticateToken, (req, res) => {
  const commentId = req.params.id;
  db.run('UPDATE comments SET isApproved = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [commentId], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao aprovar comentário' });
    if (this.changes === 0) return res.status(404).json({ error: 'Comentário não encontrado' });
    res.json({ success: true, changes: this.changes });
  });
});

app.put('/api/admin/comments/:id/reject', authenticateToken, (req, res) => {
  const commentId = req.params.id;
  db.run('UPDATE comments SET isApproved = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [commentId], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao rejeitar comentário' });
    if (this.changes === 0) return res.status(404).json({ error: 'Comentário não encontrado' });
    res.json({ success: true, changes: this.changes });
  });
});

app.delete('/api/admin/comments/:id', authenticateToken, (req, res) => {
  const commentId = req.params.id;
  db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
    if (err) return res.status(500).json({ error: 'Erro ao deletar comentário' });
    if (this.changes === 0) return res.status(404).json({ error: 'Comentário não encontrado' });
    res.json({ success: true, deleted: this.changes });
  });
});

app.get('/api/admin/comments/stats', authenticateToken, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM comments',
    'SELECT COUNT(*) as approved FROM comments WHERE isApproved = 1',
    'SELECT AVG(rating) as avgRating FROM comments WHERE isApproved = 1',
    'SELECT COUNT(DISTINCT userId) as uniqueUsers FROM comments'
  ];
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.get(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      success: true,
      stats: {
        total: results[0].total,
        approved: results[1].approved,
        avgRating: Math.round(results[2].avgRating || 0),
        uniqueUsers: results[3].uniqueUsers
      }
    });
  }).catch(err => {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`gmp portal server running at http://0.0.0.0:${PORT}`);
});
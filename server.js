const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
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

app.use(cors());
app.use(express.json());

// SERVE ESTÁTICOS A PARTIR DA NOVA RAIZ gmp-portal
// Mantém compatibilidade com links antigos que usam /gmp-portal/...
app.use('/gmp-portal', express.static(path.join(__dirname)));
// Também permite acessar sem prefixo, ex.: /admin/index.html
app.use('/', express.static(path.join(__dirname)));


const db = new sqlite3.Database('./gmp.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'STUDENT',
    isEmailVerified INTEGER DEFAULT 0,
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

// Root route (use new root)
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

app.listen(PORT, () => {
  console.log(`gmp portal server running at http://localhost:${PORT}`);
});

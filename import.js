const fs = require('fs');
const db = require('better-sqlite3')('gmp2.db');
fs.readFileSync('recovered.sql', 'utf8').split(';').forEach(stmt => { if (stmt.trim()) db.exec(stmt); });
db.close();
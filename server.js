import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Error connecting to database:", err);
  else {
    console.log("Connected to SQLite database");
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, exchangeRate REAL)`);
    db.run(`INSERT OR IGNORE INTO settings (id, exchangeRate) VALUES (1, 3.40)`);
    
    db.run(`CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY, name TEXT, weight REAL)`);
    // Insert initial data if people is empty
    db.get("SELECT COUNT(*) as count FROM people", (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO people (id, name, weight) VALUES ('1', 'Jair', 1)`);
        db.run(`INSERT INTO people (id, name, weight) VALUES ('2', 'Bernie', 1)`);
        
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('101', 'Luz', 344, 0, '1')`);
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('102', 'Gas', 38, 0, '1')`);
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('103', 'Agua', 17, 0, '1')`);
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('104', 'Internet', 75, 0, '1')`);
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('105', 'HBO', 14, 0, '1')`);
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('106', 'Google Photos', 37.40, 0, '1')`);
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('107', 'Youtube Premium', 56.10, 0, '1')`);
        db.run(`INSERT INTO expenses (id, name, amount, isDolar, paidById) VALUES ('108', 'Pollo', 134, 0, '1')`);
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, name TEXT, amount REAL, isDolar INTEGER, paidById TEXT, customWeights TEXT)`);
    db.run(`ALTER TABLE expenses ADD COLUMN customWeights TEXT`, (err) => { /* ignore error if exists */ });
    db.run(`CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, totalSoles REAL, totalDolars REAL, details TEXT)`);
  });
}

// APIs
app.get('/api/data', (req, res) => {
  db.get(`SELECT exchangeRate FROM settings WHERE id = 1`, (err, setting) => {
    db.all(`SELECT * FROM people`, (err, people) => {
      db.all(`SELECT * FROM expenses`, (err, expenses) => {
        const formattedExpenses = expenses.map(e => ({
          ...e, 
          isDolar: e.isDolar === 1,
          customWeights: e.customWeights ? JSON.parse(e.customWeights) : {}
        }));
        res.json({
          exchangeRate: setting?.exchangeRate || 3.40,
          people: people || [],
          expenses: formattedExpenses || []
        });
      });
    });
  });
});

app.post('/api/settings', (req, res) => {
  const { exchangeRate } = req.body;
  db.run(`UPDATE settings SET exchangeRate = ? WHERE id = 1`, [exchangeRate], (err) => {
    res.json({ success: true });
  });
});

app.post('/api/people', (req, res) => {
  const { id, name, weight } = req.body;
  db.run(`INSERT OR REPLACE INTO people (id, name, weight) VALUES (?, ?, ?)`, [id, name, weight], () => {
    res.json({ success: true });
  });
});

app.delete('/api/people/:id', (req, res) => {
  db.run(`DELETE FROM people WHERE id = ?`, [req.params.id], () => {
    res.json({ success: true });
  });
});

app.post('/api/expenses', (req, res) => {
  const { id, name, amount, isDolar, paidById, customWeights } = req.body;
  const cw = customWeights ? JSON.stringify(customWeights) : null;
  db.run(`INSERT OR REPLACE INTO expenses (id, name, amount, isDolar, paidById, customWeights) VALUES (?, ?, ?, ?, ?, ?)`, 
    [id, name, amount, isDolar ? 1 : 0, paidById, cw], () => {
    res.json({ success: true });
  });
});

app.delete('/api/expenses/:id', (req, res) => {
  db.run(`DELETE FROM expenses WHERE id = ?`, [req.params.id], () => {
    res.json({ success: true });
  });
});

app.post('/api/settle', (req, res) => {
  const { totalSoles, totalDolars, details } = req.body;
  const date = new Date().toISOString();
  db.run(`INSERT INTO history (date, totalSoles, totalDolars, details) VALUES (?, ?, ?, ?)`, 
    [date, totalSoles, totalDolars, JSON.stringify(details)], (err) => {
      if (err) return res.status(500).json({error: err.message});
      db.run(`DELETE FROM expenses`, () => {
        res.json({ success: true });
      });
  });
});

app.get('/api/history', (req, res) => {
  db.all(`SELECT * FROM history ORDER BY id DESC`, (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.delete('/api/history/:id', (req, res) => {
  db.run(`DELETE FROM history WHERE id = ?`, [req.params.id], () => {
    res.json({ success: true });
  });
});

// Serve Static Files (Frontend)
app.use(express.static(join(__dirname, 'dist')));

// Handle React Routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = 1503;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});

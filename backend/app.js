require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app = express();

// Ensure uploads directory exists at startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Simulated login — excluded from auth middleware
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    return res.json({ token: 'admin-token' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

const auth = require('./middleware/auth');
app.use('/api/students', auth, require('./routes/students'));
app.use('/api/drives',   auth, require('./routes/drives'));
app.use('/api/reports',  auth, require('./routes/reports'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

module.exports = app;

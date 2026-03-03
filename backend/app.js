require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB (cached for serverless re-use)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shotsecure';
let _conn = null;
const connectDB = async () => {
  if (_conn) return;
  _conn = await mongoose.connect(MONGO_URI);
};
app.use((_req, _res, next) => { connectDB().then(next).catch(next); });

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

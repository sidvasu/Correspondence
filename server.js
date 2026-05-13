import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ObjectId } from "mongodb";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import env from "dotenv";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

const MONGO_URL = "mongodb://localhost:27017"
const DB_NAME = "cpsc431_vasusiddharth";
let db;

const JWT_SECRET = process.env.JWT_SECRET || 'cpsc431-final-project-development-secret-key';

MongoClient.connect(MONGO_URL)
    .then(client => {
        db = client.db(DB_NAME);
        console.log('Connected to MongoDB');
        app.listen(3000, () => console.log('Server running at http://localhost:3000'));
    })
    .catch(err => console.error('MongoDB connection failed:', err));

function files() {
    return db.collection('files');
}

function users() { 
    return db.collection('users'); 
}

const AUTH_COOKIE_NAME = 'authToken';
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000;
const COOKIE_MAX_AGE_SECONDS = COOKIE_MAX_AGE_MS / 1000;

function parseCookies(req) {
  const header = req.headers.cookie;

  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        const key = index >= 0 ? part.slice(0, index) : part;
        const value = index >= 0 ? part.slice(index + 1) : '';
        return [key, decodeURIComponent(value)];
      })
  );
}

function setAuthCookie(res, token) {
  const cookieValue = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`
  ].join('; ');

  res.setHeader('Set-Cookie', cookieValue);
}

function clearAuthCookie(res) {
  const cookieValue = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ].join('; ');

  res.setHeader('Set-Cookie', cookieValue);
}

function authenticateToken(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      error: 'Access denied'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Invalid token'
    });
  }
}

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.get('/share.html', authenticateToken, (req, res) => {
  res.sendFile(join(__dirname, 'public', 'share.html'));
});

app.post("/register", async (req, res) => {
  try {
    let { username, password } = req.body;

    username = username.trim();
    const existing = await users().findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await users().insertOne({ username, password: hashed });

    res.json({ message: 'Registered successfully' });
  } catch (error) {
    console.error('Register route error:', error);
    return res.status(500).render('register', {
      message: 'Server error while registering.'
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;

    username = username.trim();
    const user = await users().findOne({ username });
    if (!user) {
      return res.status(401).json(
        { error: 'Invalid username or password' }
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json(
        { error: 'Invalid username or password' }
      );
    }

    const token = jwt.sign({
        sub: String(user._id),
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    setAuthCookie(res, token);
    res.json({ message: 'Logged in successfully' });
  } catch (error) {
    return res.status(500).render('index', {
      user: null,
      message: 'Server error while logging in.'
    });
  }
});

app.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});


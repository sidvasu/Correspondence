import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { users } from "../config/db.js";
import {
  JWT_SECRET,
  COOKIE_MAX_AGE_SECONDS,
  setAuthCookie,
  clearAuthCookie,
} from "../middleware/auth.js";

const router = Router();

// Endpoint for registering an account
router.post("/register", async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    username = username.trim();
    const existing = await users().findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await users().insertOne({ username, password: hashed });

    res.json({ message: "Registered successfully" });
  } catch (error) {
    console.error("Register route error:", error);
    return res.status(500).json({ error: "Server error while registering." });
  }
});

// Endpoint for logging in
router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;

    username = username.trim();
    const user = await users().findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { sub: String(user._id), username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    setAuthCookie(res, token);
    res.json({ message: "Logged in successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Server error while logging in." });
  }
});

// Endpoint for logging out
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

export default router;
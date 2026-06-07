import { Router } from 'express';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { pool } from '../db/pool.js';
import {
  createSession,
  deleteSession,
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
} from '../middleware/auth.js';

const router = Router();

const KEY_LEN = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    try {
      const salt = randomBytes(16).toString('hex');
      const key = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
      resolve(salt + ':' + key.toString('hex'));
    } catch (e) {
      reject(e);
    }
  });
}

async function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const keyBuf = Buffer.from(key, 'hex');
  const derived = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return derived.length === keyBuf.length && timingSafeEqual(derived, keyBuf);
}

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password required' });
    }
    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({ error: 'username must be 2-50 characters' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'password must be at least 4 characters' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'username or email already taken' });
    }

    const hash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, display_name, avatar_url, created_at`,
      [username, email, hash]
    );
    const user = result.rows[0];

    await pool.query(
      'INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [user.id]
    );

    const session = await createSession(user);
    setSessionCookie(res, session);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, email, password_hash, display_name, avatar_url FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];

    const match = await verifyPassword(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      `INSERT INTO user_stats (user_id, last_login_date)
       VALUES ($1, CURRENT_DATE)
       ON CONFLICT (user_id) DO UPDATE SET
         last_login_date = CURRENT_DATE,
         login_streak = CASE
           WHEN user_stats.last_login_date = CURRENT_DATE - INTERVAL '1 day'
             THEN user_stats.login_streak + 1
           WHEN user_stats.last_login_date = CURRENT_DATE
             THEN user_stats.login_streak
           ELSE 1
         END`,
      [user.id]
    );

    const session = await createSession(user);
    setSessionCookie(res, session);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  const sid = req.cookies?.flove_sid;
  if (sid) {
    await deleteSession(sid);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.created_at,
              COALESCE(s.total_points, 0) AS total_points,
              COALESCE(s.level, 1) AS level,
              COALESCE(s.submission_count, 0) AS submission_count,
              COALESCE(s.login_streak, 0) AS login_streak
       FROM users u
       LEFT JOIN user_stats s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = rows[0];
    res.json({
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      createdAt: u.created_at,
      stats: {
        totalPoints: u.total_points,
        level: u.level,
        submissionCount: u.submission_count,
        loginStreak: u.login_streak,
      },
    });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET display_name = COALESCE($1, display_name),
                         avatar_url = COALESCE($2, avatar_url),
                         updated_at = NOW()
       WHERE id = $3
       RETURNING id, username, display_name, avatar_url`,
      [displayName, avatarUrl, req.user.userId]
    );
    const u = rows[0];
    res.json({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
    });
  } catch (err) {
    console.error('profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

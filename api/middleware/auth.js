import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool.js';

const SESSION_COOKIE = 'flove_sid';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

async function createSession(user) {
  const sid = uuidv4();
  const sess = JSON.stringify({
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    createdAt: new Date().toISOString(),
  });
  const expires = new Date(Date.now() + SESSION_MAX_AGE);
  await pool.query(
    'INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2::jsonb, $3)',
    [sid, sess, expires]
  );
  return { sid, maxAge: SESSION_MAX_AGE };
}

async function getSession(sid) {
  const { rows } = await pool.query(
    'SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()',
    [sid]
  );
  if (rows.length === 0) return null;
  return rows[0].sess;
}

async function deleteSession(sid) {
  await pool.query('DELETE FROM sessions WHERE sid = $1', [sid]);
}

async function cleanExpiredSessions() {
  await pool.query('DELETE FROM sessions WHERE expire <= NOW()');
}

function requireAuth(req, res, next) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function optionalAuth(req, res, next) {
  next();
}

async function loadUser(req, _res, next) {
  try {
    const sid = req.cookies?.[SESSION_COOKIE];
    if (sid) {
      const sess = await getSession(sid);
      if (sess) {
        req.user = sess;
      }
    }
  } catch (e) {
    console.error('loadUser error:', e);
  }
  next();
}

function setSessionCookie(res, session) {
  res.cookie(SESSION_COOKIE, session.sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: session.maxAge,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}

export {
  SESSION_COOKIE,
  createSession,
  getSession,
  deleteSession,
  cleanExpiredSessions,
  requireAuth,
  optionalAuth,
  loadUser,
  setSessionCookie,
  clearSessionCookie,
};

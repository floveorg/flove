import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const APP_BASE_POINTS = {
  'varyy': 20, 'hacky': 15, 'evily': 25, 'daty': 30,
  'maty': 20, 'hoty': 10, 'crumbly': 20, 'myfamily': 20,
  'parenty': 25, 'souls': 50, 'willy': 30, 'worthing': 15,
  'poly': 15, 'raty': 15, 'vizy2': 20, 'freed': 25,
  'shareful': 25, 'offeradvanced': 30, 'minioffer': 10,
  'help': 15, 'crafty': 15, 'fivy': 20, 'keys': 25,
  'wisy': 20, 'comby': 15, 'realy': 15, 'astry': 20,
  'profily': 15, 'sensy': 10, 'diesafe': 25,
  'flovybasic': 10, 'flovynormal': 15, 'flovymini': 8,
  'flovyadvanced': 20, 'flovysuper': 25,
};

function calculatePoints(appName, formType, data) {
  let base = APP_BASE_POINTS[appName] || 10;
  if (formType) {
    const formBonuses = {
      'full': 5, 'advanced': 5, 'detailed': 5,
      'quick': -3, 'mini': -5,
    };
    base += formBonuses[formType] || 0;
  }

  const entries = Object.entries(data);
  let fieldPoints = 0;
  let textLength = 0;

  for (const [, value] of entries) {
    if (value === null || value === undefined || value === '') continue;
    fieldPoints += 2;
    const str = String(value);
    textLength += str.length;
    if (Array.isArray(value) && value.length > 1) {
      fieldPoints += value.length;
    }
  }

  const textBonus = Math.min(Math.floor(textLength / 50) * 2, 30);

  const total = Math.max(base + fieldPoints + textBonus, 1);
  return total;
}

async function checkBadges(userId) {
  const earned = [];

  const { rows: stats } = await pool.query(
    'SELECT total_points, submission_count, login_streak FROM user_stats WHERE user_id = $1',
    [userId]
  );

  if (stats.length === 0) return earned;
  const s = stats[0];

  const badgeChecks = [];

  if (s.submission_count >= 1) badgeChecks.push('first_submit');
  if (s.submission_count >= 10) badgeChecks.push('ten_submits');
  if (s.submission_count >= 100) badgeChecks.push('hundred_submits');
  if (s.login_streak >= 3) badgeChecks.push('streak_3');
  if (s.login_streak >= 7) badgeChecks.push('streak_7');
  if (s.login_streak >= 30) badgeChecks.push('streak_30');
  if (s.total_points >= 100) badgeChecks.push('score_100');
  if (s.total_points >= 1000) badgeChecks.push('score_1000');

  const { rows: appCount } = await pool.query(
    'SELECT COUNT(DISTINCT app_name) AS cnt FROM form_submissions WHERE user_id = $1',
    [userId]
  );
  if (appCount[0].cnt >= 5) badgeChecks.push('explorer');
  if (appCount[0].cnt >= 10) badgeChecks.push('all_rounder');

  for (const code of badgeChecks) {
    const already = await pool.query(
      'SELECT 1 FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = $1 AND b.code = $2',
      [userId, code]
    );
    if (already.rows.length > 0) continue;

    const { rows: badge } = await pool.query(
      'SELECT id, code, name, description FROM badges WHERE code = $1',
      [code]
    );
    if (badge.length > 0) {
      await pool.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, badge[0].id]
      );
      earned.push(badge[0]);
    }
  }

  return earned;
}

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.total_points, s.level, s.submission_count, s.login_streak,
              u.display_name, u.avatar_url, u.username
       FROM user_stats s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1`,
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.json({ totalPoints: 0, level: 1, submissionCount: 0, loginStreak: 0 });
    }
    const r = rows[0];

    const { rows: badges } = await pool.query(
      `SELECT b.code, b.name, b.description, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at`,
      [req.user.userId]
    );

    res.json({
      totalPoints: r.total_points,
      level: r.level,
      submissionCount: r.submission_count,
      loginStreak: r.login_streak,
      username: r.username,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      badges,
    });
  } catch (err) {
    console.error('scores me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.username, u.display_name, u.avatar_url, s.total_points, s.level, s.submission_count
       FROM user_stats s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.total_points DESC
       LIMIT 50`
    );
    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
export { calculatePoints, checkBadges };

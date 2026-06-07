import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const DAILY_CLICK_CAP = 50;
const CLICK_POINTS = 1;

router.post('/click', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appName, actionType, label } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'appName required' });
    }

    const { rows: today } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM score_events
       WHERE user_id = $1 AND app_name = $2 AND action_type = 'click'
         AND created_at >= CURRENT_DATE`,
      [userId, appName]
    );

    if (parseInt(today[0].cnt) >= DAILY_CLICK_CAP) {
      return res.json({ points: 0, dailyCap: true });
    }

    const meta = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      actionType: actionType || 'click',
      label: label || '',
    };

    await pool.query(
      `INSERT INTO score_events (user_id, app_name, action_type, points, reason, metadata)
       VALUES ($1, $2, 'click', $3, $4, $5::jsonb)`,
      [userId, appName, CLICK_POINTS, `Click in ${appName}${label ? ': ' + label : ''}`, JSON.stringify(meta)]
    );

    await pool.query(
      `UPDATE user_stats SET
         total_points = total_points + $1,
         updated_at = NOW()
       WHERE user_id = $2`,
      [CLICK_POINTS, userId]
    );

    const { rows: stats } = await pool.query(
      'SELECT total_points, level, submission_count FROM user_stats WHERE user_id = $1',
      [userId]
    );

    const fromPath = req.path;
    const badgeChecks = [];

    if (stats[0].total_points >= 100) badgeChecks.push('score_100');
    if (stats[0].total_points >= 1000) badgeChecks.push('score_1000');

    const earned = [];
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

    res.json({ points: CLICK_POINTS, stats: stats[0], newBadges: earned });
  } catch (err) {
    console.error('click event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/pageview', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appName } = req.body;

    if (!appName) return res.status(400).json({ error: 'appName required' });

    const { rows: today } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM score_events
       WHERE user_id = $1 AND app_name = $2 AND action_type = 'pageview'
         AND created_at >= CURRENT_DATE`,
      [userId, appName]
    );

    if (parseInt(today[0].cnt) >= 5) {
      return res.json({ points: 0, dailyCap: true });
    }

    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    await pool.query(
      `INSERT INTO score_events (user_id, app_name, action_type, points, reason, metadata)
       VALUES ($1, $2, 'pageview', 1, $3, $4::jsonb)`,
      [userId, appName, `Page view: ${appName}`, JSON.stringify(meta)]
    );

    await pool.query(
      `UPDATE user_stats SET total_points = total_points + 1, updated_at = NOW() WHERE user_id = $1`,
      [userId]
    );

    const { rows: stats } = await pool.query(
      'SELECT total_points, level, submission_count FROM user_stats WHERE user_id = $1',
      [userId]
    );

    res.json({ points: 1, stats: stats[0] });
  } catch (err) {
    console.error('pageview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

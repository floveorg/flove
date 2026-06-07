import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { calculatePoints, checkBadges } from './scores.js';

const router = Router();

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appName, formType, data } = req.body;

    if (!appName || !data) {
      return res.status(400).json({ error: 'appName and data required' });
    }

    const meta = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      fieldCount: Object.keys(data).length,
      textLength: JSON.stringify(data).length,
    };

    const points = calculatePoints(appName, formType, data);

    const { rows } = await pool.query(
      `INSERT INTO form_submissions (user_id, app_name, form_type, data, points)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id, points, created_at`,
      [userId, appName, formType || '', JSON.stringify(data), points]
    );
    const submission = rows[0];

    await pool.query(
      `INSERT INTO score_events (user_id, app_name, form_type, action_type, points, reason, metadata)
       VALUES ($1, $2, $3, 'submit', $4, $5, $6::jsonb)`,
      [userId, appName, formType || '', points, `Form submission: ${appName}`, JSON.stringify(meta)]
    );

    await pool.query(
      `UPDATE user_stats SET
         total_points = total_points + $1,
         submission_count = submission_count + 1,
         updated_at = NOW()
       WHERE user_id = $2`,
      [points, userId]
    );

    const { rows: stats } = await pool.query(
      'SELECT total_points, level, submission_count FROM user_stats WHERE user_id = $1',
      [userId]
    );

    const badges = await checkBadges(userId);

    res.status(201).json({
      submission: {
        id: submission.id,
        appName,
        formType,
        points: submission.points,
        createdAt: submission.created_at,
      },
      stats: stats[0],
      newBadges: badges,
    });
  } catch (err) {
    console.error('form submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/submissions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, appName } = req.query;

    let query = 'SELECT * FROM form_submissions WHERE user_id = $1';
    const params = [userId];

    if (appName) {
      query += ' AND app_name = $' + (params.length + 1);
      params.push(appName);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await pool.query(query, params);
    res.json({ submissions: rows });
  } catch (err) {
    console.error('list submissions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

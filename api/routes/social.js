import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/follow/:userId', requireAuth, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followeeId = parseInt(req.params.userId);

    if (followerId === followeeId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const { rows: exists } = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [followeeId]
    );
    if (exists.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      'INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followeeId]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, actor_id)
       VALUES ($1, 'follow', $2) ON CONFLICT DO NOTHING`,
      [followeeId, followerId]
    );

    const { rows: count } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM follows WHERE followee_id = $1',
      [followeeId]
    );

    res.json({ following: true, followerCount: parseInt(count[0].cnt) });
  } catch (err) {
    console.error('follow error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/follow/:userId', requireAuth, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followeeId = parseInt(req.params.userId);

    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2',
      [followerId, followeeId]
    );

    const { rows: count } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM follows WHERE followee_id = $1',
      [followeeId]
    );

    res.json({ following: false, followerCount: parseInt(count[0].cnt) });
  } catch (err) {
    console.error('unfollow error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/followers/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
              COALESCE(s.total_points, 0) AS total_points
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       LEFT JOIN user_stats s ON s.user_id = u.id
       WHERE f.followee_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json({ followers: rows });
  } catch (err) {
    console.error('followers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/following/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
              COALESCE(s.total_points, 0) AS total_points
       FROM follows f
       JOIN users u ON u.id = f.followee_id
       LEFT JOIN user_stats s ON s.user_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json({ following: rows });
  } catch (err) {
    console.error('following error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { rows } = await pool.query(
      `SELECT n.id, n.type, n.read, n.created_at,
              n.post_id,
              u.id AS actor_id, u.username AS actor_username, u.display_name AS actor_display_name
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const { rows: unreadResult } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );

    res.json({ notifications: rows, unreadCount: parseInt(unreadResult[0].cnt) });
  } catch (err) {
    console.error('notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/notifications/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ids } = req.body;

    if (Array.isArray(ids) && ids.length > 0) {
      await pool.query(
        `UPDATE notifications SET read = TRUE WHERE user_id = $1 AND id = ANY($2::int[])`,
        [userId, ids]
      );
    } else {
      await pool.query(
        'UPDATE notifications SET read = TRUE WHERE user_id = $1',
        [userId]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('mark read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

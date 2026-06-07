import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/@:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.website_url, u.created_at,
              COALESCE(s.total_points, 0) AS total_points,
              COALESCE(s.level, 1) AS level,
              COALESCE(s.submission_count, 0) AS submission_count,
              COALESCE(s.login_streak, 0) AS login_streak
       FROM users u
       LEFT JOIN user_stats s ON s.user_id = u.id
       WHERE u.username = $1`,
      [username]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = rows[0];

    const { rows: badges } = await pool.query(
      `SELECT b.code, b.name, b.description, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at`,
      [u.id]
    );

    const { rows: postCount } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM posts WHERE user_id = $1',
      [u.id]
    );

    const { rows: followerCount } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM follows WHERE followee_id = $1',
      [u.id]
    );

    const { rows: followingCount } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM follows WHERE follower_id = $1',
      [u.id]
    );

    let isFollowing = false;
    if (req.user && req.user.userId) {
      const { rows: followCheck } = await pool.query(
        'SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2',
        [req.user.userId, u.id]
      );
      isFollowing = followCheck.length > 0;
    }

    res.json({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      websiteUrl: u.website_url,
      createdAt: u.created_at,
      stats: {
        totalPoints: u.total_points,
        level: u.level,
        submissionCount: u.submission_count,
        loginStreak: u.login_streak,
        postCount: parseInt(postCount[0].cnt),
        followerCount: parseInt(followerCount[0].cnt),
        followingCount: parseInt(followingCount[0].cnt),
      },
      badges,
      isFollowing,
    });
  } catch (err) {
    console.error('get user profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (q.length < 1) {
      return res.json({ users: [] });
    }
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
              COALESCE(s.total_points, 0) AS total_points,
              COALESCE(s.level, 1) AS level
       FROM users u
       LEFT JOIN user_stats s ON s.user_id = u.id
       WHERE u.username ILIKE $1 OR u.display_name ILIKE $1
       ORDER BY s.total_points DESC
       LIMIT 20`,
      [`%${q}%`]
    );
    res.json({ users: rows });
  } catch (err) {
    console.error('search users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

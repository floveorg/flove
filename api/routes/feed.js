import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function extractMentions(text) {
  if (!text) return [];
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

router.post('/publish', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appName, formType, content, dataSnapshot, pointsEarned } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'appName required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO posts (user_id, app_name, form_type, content, data_snapshot, points_earned)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, created_at`,
      [userId, appName, formType || '', content || '', JSON.stringify(dataSnapshot || {}), pointsEarned || 0]
    );
    const post = rows[0];

    await pool.query(
      `UPDATE user_stats SET total_points = total_points + 5, updated_at = NOW() WHERE user_id = $1`,
      [userId]
    );

    const mentionNames = extractMentions(content);
    for (const name of mentionNames) {
      const { rows: mentioned } = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [name]
      );
      if (mentioned.length === 0 || mentioned[0].id === userId) continue;
      await pool.query(
        'INSERT INTO mentions (post_id, mentioned_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [post.id, mentioned[0].id]
      );
      await pool.query(
        `INSERT INTO notifications (user_id, type, actor_id, post_id)
         VALUES ($1, 'mention', $2, $3) ON CONFLICT DO NOTHING`,
        [mentioned[0].id, userId, post.id]
      );
    }

    const { rows: postData } = await pool.query(
      `SELECT p.id, p.app_name, p.form_type, p.content, p.data_snapshot, p.points_earned, p.created_at,
              u.id AS user_id, u.username, u.display_name, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [post.id]
    );
    const p = postData[0];

    const { rows: likes } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = $1',
      [post.id]
    );

    const { rows: mentionedUsers } = await pool.query(
      `SELECT u.username, u.display_name FROM mentions m JOIN users u ON u.id = m.mentioned_user_id WHERE m.post_id = $1`,
      [post.id]
    );

    res.status(201).json({
      post: {
        id: p.id,
        appName: p.app_name,
        formType: p.form_type,
        content: p.content,
        pointsEarned: p.points_earned,
        createdAt: p.created_at,
        likes: parseInt(likes[0].cnt),
        liked: false,
        user: {
          id: p.user_id,
          username: p.username,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
        },
        mentions: mentionedUsers,
      },
    });
  } catch (err) {
    console.error('publish error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/@:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows: user } = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = user[0].id;

    const { rows: posts } = await pool.query(
      `SELECT p.id, p.app_name, p.form_type, p.content, p.data_snapshot, p.points_earned, p.created_at,
              u.id AS user_id, u.username, u.display_name, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const { rows: countResult } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM posts WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult[0].cnt);

    let currentUserId = null;
    if (req.user && req.user.userId) {
      currentUserId = req.user.userId;
    }

    const postIds = posts.map(p => p.id);
    const likeMap = {};
    const mentionMap = {};

    if (postIds.length > 0) {
      const { rows: allLikes } = await pool.query(
        `SELECT post_id, COUNT(*) AS cnt FROM post_likes WHERE post_id = ANY($1::int[]) GROUP BY post_id`,
        [postIds]
      );
      for (const l of allLikes) {
        likeMap[l.post_id] = parseInt(l.cnt);
      }
      if (currentUserId) {
        const { rows: myLikes } = await pool.query(
          'SELECT post_id FROM post_likes WHERE user_id = $1 AND post_id = ANY($2::int[])',
          [currentUserId, postIds]
        );
        for (const l of myLikes) {
          if (!likeMap[l.post_id]) likeMap[l.post_id] = 0;
        }
        const likedSet = new Set(myLikes.map(l => l.post_id));
        const { rows: allMentions } = await pool.query(
          `SELECT m.post_id, u.username, u.display_name FROM mentions m JOIN users u ON u.id = m.mentioned_user_id WHERE m.post_id = ANY($1::int[])`,
          [postIds]
        );
        for (const m of allMentions) {
          if (!mentionMap[m.post_id]) mentionMap[m.post_id] = [];
          mentionMap[m.post_id].push({ username: m.username, displayName: m.display_name });
        }

        const result = posts.map(p => ({
          id: p.id,
          appName: p.app_name,
          formType: p.form_type,
          content: p.content,
          dataSnapshot: p.data_snapshot,
          pointsEarned: p.points_earned,
          createdAt: p.created_at,
          likes: likeMap[p.id] || 0,
          liked: likedSet.has(p.id),
          user: {
            id: p.user_id,
            username: p.username,
            displayName: p.display_name,
            avatarUrl: p.avatar_url,
          },
          mentions: mentionMap[p.id] || [],
        }));

        return res.json({ posts: result, total, page, limit, hasMore: offset + limit < total });
      }
    }

    const result = posts.map(p => ({
      id: p.id,
      appName: p.app_name,
      formType: p.form_type,
      content: p.content,
      dataSnapshot: p.data_snapshot,
      pointsEarned: p.points_earned,
      createdAt: p.created_at,
      likes: likeMap[p.id] || 0,
      liked: false,
      user: {
        id: p.user_id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
      },
      mentions: [],
    }));

    res.json({ posts: result, total, page, limit, hasMore: offset + limit < total });
  } catch (err) {
    console.error('get user feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/timeline', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows: posts } = await pool.query(
      `SELECT p.id, p.app_name, p.form_type, p.content, p.data_snapshot, p.points_earned, p.created_at,
              u.id AS user_id, u.username, u.display_name, u.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id IN (
         SELECT followee_id FROM follows WHERE follower_id = $1
       ) OR p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const { rows: countResult } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM posts p
       WHERE p.user_id IN (
         SELECT followee_id FROM follows WHERE follower_id = $1
       ) OR p.user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult[0].cnt);

    const postIds = posts.map(p => p.id);
    const likeMap = {};
    const likedSet = new Set();
    const mentionMap = {};

    if (postIds.length > 0) {
      const { rows: allLikes } = await pool.query(
        `SELECT post_id, COUNT(*) AS cnt FROM post_likes WHERE post_id = ANY($1::int[]) GROUP BY post_id`,
        [postIds]
      );
      for (const l of allLikes) likeMap[l.post_id] = parseInt(l.cnt);

      const { rows: myLikes } = await pool.query(
        'SELECT post_id FROM post_likes WHERE user_id = $1 AND post_id = ANY($2::int[])',
        [userId, postIds]
      );
      for (const l of myLikes) likedSet.add(l.post_id);

      const { rows: allMentions } = await pool.query(
        `SELECT m.post_id, u.username, u.display_name FROM mentions m JOIN users u ON u.id = m.mentioned_user_id WHERE m.post_id = ANY($1::int[])`,
        [postIds]
      );
      for (const m of allMentions) {
        if (!mentionMap[m.post_id]) mentionMap[m.post_id] = [];
        mentionMap[m.post_id].push({ username: m.username, displayName: m.display_name });
      }
    }

    const result = posts.map(p => ({
      id: p.id,
      appName: p.app_name,
      formType: p.form_type,
      content: p.content,
      dataSnapshot: p.data_snapshot,
      pointsEarned: p.points_earned,
      createdAt: p.created_at,
      likes: likeMap[p.id] || 0,
      liked: likedSet.has(p.id),
      user: {
        id: p.user_id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
      },
      mentions: mentionMap[p.id] || [],
    }));

    res.json({ posts: result, total, page, limit, hasMore: offset + limit < total });
  } catch (err) {
    console.error('timeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/like/:postId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = parseInt(req.params.postId);

    await pool.query(
      'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, postId]
    );

    const { rows: postOwner } = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );
    if (postOwner.length > 0 && postOwner[0].user_id !== userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, actor_id, post_id)
         VALUES ($1, 'like', $2, $3) ON CONFLICT DO NOTHING`,
        [postOwner[0].user_id, userId, postId]
      );
    }

    const { rows: cnt } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = $1',
      [postId]
    );

    res.json({ likes: parseInt(cnt[0].cnt) });
  } catch (err) {
    console.error('like error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/like/:postId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = parseInt(req.params.postId);

    await pool.query(
      'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    const { rows: cnt } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM post_likes WHERE post_id = $1',
      [postId]
    );

    res.json({ likes: parseInt(cnt[0].cnt) });
  } catch (err) {
    console.error('unlike error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:postId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = parseInt(req.params.postId);

    const { rows } = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not yours' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('delete post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

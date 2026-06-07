CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions (expire);

CREATE TABLE IF NOT EXISTS score_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_name VARCHAR(100) NOT NULL,
  form_type VARCHAR(100) DEFAULT '',
  action_type VARCHAR(100) NOT NULL DEFAULT 'submit',
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_events_user ON score_events (user_id);
CREATE INDEX IF NOT EXISTS idx_score_events_app ON score_events (app_name);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  submission_count INTEGER NOT NULL DEFAULT 0,
  login_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_name VARCHAR(100) NOT NULL,
  form_type VARCHAR(100) DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_user ON form_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_app ON form_submissions (app_name);

CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  icon_url TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

INSERT INTO badges (code, name, description) VALUES
  ('first_submit', 'First Steps', 'Submit your first form'),
  ('ten_submits', 'Getting Started', 'Submit 10 forms'),
  ('hundred_submits', 'Dedicated', 'Submit 100 forms'),
  ('streak_3', 'Consistent', '3-day login streak'),
  ('streak_7', 'Committed', '7-day login streak'),
  ('streak_30', 'Devoted', '30-day login streak'),
  ('score_100', 'Century', 'Reach 100 points'),
  ('score_1000', 'Millennium', 'Reach 1,000 points'),
  ('explorer', 'Explorer', 'Use 5 different apps'),
  ('all_rounder', 'All-Rounder', 'Use 10 different apps')
ON CONFLICT (code) DO NOTHING;

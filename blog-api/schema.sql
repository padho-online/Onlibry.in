-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  tags TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  status TEXT DEFAULT 'draft',
  published_at TEXT,
  scheduled_for TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
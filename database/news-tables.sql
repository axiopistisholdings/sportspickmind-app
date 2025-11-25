-- AI Generated Sports News System
-- For upcoming games, insights, and analysis

-- Main news articles table
CREATE TABLE IF NOT EXISTS ai_news_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_type TEXT NOT NULL, -- 'game_preview', 'injury_report', 'prediction_insight', 'matchup_analysis', 'weekly_recap'
  headline TEXT NOT NULL,
  subheadline TEXT,
  content TEXT NOT NULL, -- Full article content
  summary TEXT, -- Short summary (2-3 sentences)

  -- Related entities
  sport TEXT, -- 'NFL', 'NBA', 'MLB', 'NHL'
  game_id TEXT, -- If related to specific game
  team_ids TEXT, -- Comma-separated team IDs
  player_ids TEXT, -- Comma-separated player IDs if mentioned

  -- SEO and metadata
  slug TEXT UNIQUE, -- URL-friendly identifier
  keywords TEXT, -- Comma-separated keywords
  read_time_minutes INTEGER, -- Estimated reading time

  -- AI metadata
  ai_model TEXT, -- Model used to generate
  confidence_score REAL, -- Content quality score
  sources_used TEXT, -- JSON array of data sources

  -- Publishing
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TEXT,
  expires_at TEXT, -- For time-sensitive content

  -- Engagement
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- News categories/tags
CREATE TABLE IF NOT EXISTS news_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- 'Game Previews', 'Injury Updates', etc.
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon name or emoji
  color TEXT, -- Hex color for UI
  sort_order INTEGER DEFAULT 0
);

-- Article-category relationships
CREATE TABLE IF NOT EXISTS article_categories (
  article_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (article_id, category_id),
  FOREIGN KEY (article_id) REFERENCES ai_news_articles(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE CASCADE
);

-- Featured articles
CREATE TABLE IF NOT EXISTS featured_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  position INTEGER DEFAULT 0, -- Display order
  featured_until TEXT, -- Auto-unfeature after this date
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (article_id) REFERENCES ai_news_articles(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_type ON ai_news_articles(article_type);
CREATE INDEX IF NOT EXISTS idx_articles_sport ON ai_news_articles(sport);
CREATE INDEX IF NOT EXISTS idx_articles_status ON ai_news_articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON ai_news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON ai_news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_game ON ai_news_articles(game_id);

-- Insert default categories
INSERT OR IGNORE INTO news_categories (name, slug, description, icon, color, sort_order) VALUES
  ('Game Previews', 'game-previews', 'AI analysis of upcoming matchups', '🎯', '#3B82F6', 1),
  ('Prediction Insights', 'prediction-insights', 'Deep dives into AI predictions', '🧠', '#8B5CF6', 2),
  ('Injury Reports', 'injury-reports', 'Latest injury updates and impact', '⚕️', '#EF4444', 3),
  ('Matchup Analysis', 'matchup-analysis', 'Head-to-head breakdowns', '⚔️', '#F59E0B', 4),
  ('Weekly Recaps', 'weekly-recaps', 'Week in review and accuracy reports', '📊', '#10B981', 5),
  ('Team Form', 'team-form', 'Team momentum and trends', '📈', '#06B6D4', 6),
  ('Player Spotlights', 'player-spotlights', 'Key player analysis', '⭐', '#EC4899', 7);

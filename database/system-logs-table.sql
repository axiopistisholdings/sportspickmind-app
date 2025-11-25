-- System Logs Table
-- For tracking automated tasks and system events

CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_type TEXT NOT NULL, -- 'injury_collection', 'prediction_validation', 'weight_tuning', etc.
  message TEXT NOT NULL,
  metadata TEXT, -- JSON data
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for querying logs by type and date
CREATE INDEX IF NOT EXISTS idx_system_logs_type_date
  ON system_logs(log_type, created_at DESC);

-- Index for recent logs
CREATE INDEX IF NOT EXISTS idx_system_logs_created
  ON system_logs(created_at DESC);

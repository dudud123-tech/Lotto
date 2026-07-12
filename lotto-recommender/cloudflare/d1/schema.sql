PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lotto_draws (
  round INTEGER PRIMARY KEY,
  draw_date TEXT,
  n1 INTEGER NOT NULL,
  n2 INTEGER NOT NULL,
  n3 INTEGER NOT NULL,
  n4 INTEGER NOT NULL,
  n5 INTEGER NOT NULL,
  n6 INTEGER NOT NULL,
  bonus INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lotto_draws_draw_date ON lotto_draws(draw_date);

CREATE TABLE IF NOT EXISTS generated_tickets (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'unknown',
  n1 INTEGER NOT NULL,
  n2 INTEGER NOT NULL,
  n3 INTEGER NOT NULL,
  n4 INTEGER NOT NULL,
  n5 INTEGER NOT NULL,
  n6 INTEGER NOT NULL,
  latest_checked_round INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generated_tickets_created_at ON generated_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_tickets_source_type ON generated_tickets(source_type);

CREATE TABLE IF NOT EXISTS ticket_match_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  match_count INTEGER NOT NULL,
  bonus_matched INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(ticket_id) REFERENCES generated_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY(round) REFERENCES lotto_draws(round) ON DELETE CASCADE,
  UNIQUE(ticket_id, round)
);

CREATE INDEX IF NOT EXISTS idx_ticket_match_results_round ON ticket_match_results(round);
CREATE INDEX IF NOT EXISTS idx_ticket_match_results_rank ON ticket_match_results(rank);

CREATE TABLE IF NOT EXISTS site_stats_daily (
  stat_date TEXT PRIMARY KEY,
  generated_count INTEGER NOT NULL DEFAULT 0,
  pattern_count INTEGER NOT NULL DEFAULT 0,
  zodiac_count INTEGER NOT NULL DEFAULT 0,
  marble_count INTEGER NOT NULL DEFAULT 0,
  manual_count INTEGER NOT NULL DEFAULT 0,
  random_count INTEGER NOT NULL DEFAULT 0,
  rank1_count INTEGER NOT NULL DEFAULT 0,
  rank2_count INTEGER NOT NULL DEFAULT 0,
  rank3_count INTEGER NOT NULL DEFAULT 0,
  rank4_count INTEGER NOT NULL DEFAULT 0,
  rank5_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

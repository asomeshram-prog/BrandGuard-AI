CREATE TABLE IF NOT EXISTS reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 created_at TEXT NOT NULL,
 content_text TEXT,
 content_filename TEXT,
 content_path TEXT,
 guideline_filename TEXT,
 guideline_path TEXT,
 report_json TEXT,
 brand_score INTEGER DEFAULT 0,
 status TEXT DEFAULT 'Pending',
 reviewer_comment TEXT DEFAULT ''
);

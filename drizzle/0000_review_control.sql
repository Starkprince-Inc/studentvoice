CREATE TABLE IF NOT EXISTS review_artifacts (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  derivative_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  source_series TEXT,
  status TEXT NOT NULL DEFAULT 'unreviewed',
  mapped_subject_id TEXT,
  relation TEXT,
  observation TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS review_artifacts_status_idx ON review_artifacts(status);
CREATE INDEX IF NOT EXISTS review_artifacts_subject_idx ON review_artifacts(mapped_subject_id);
CREATE TABLE IF NOT EXISTS identity_suggestions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  basis TEXT NOT NULL,
  encrypted_payload TEXT NOT NULL,
  iv TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'suggested_private',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS identity_suggestions_subject_idx ON identity_suggestions(subject_id);
CREATE TABLE IF NOT EXISTS review_audit (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

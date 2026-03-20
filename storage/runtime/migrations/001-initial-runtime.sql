CREATE TABLE IF NOT EXISTS runtime_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS captured_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  path TEXT,
  status_code INTEGER,
  matched_mock_rule_id TEXT,
  request_headers_json TEXT,
  request_body_preview TEXT,
  request_body_redacted INTEGER NOT NULL DEFAULT 1,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS execution_histories (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  request_id TEXT,
  environment_id TEXT,
  status TEXT NOT NULL,
  cancellation_outcome TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  error_code TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS execution_results (
  execution_id TEXT PRIMARY KEY,
  response_status INTEGER,
  response_headers_json TEXT,
  response_body_preview TEXT,
  response_body_redacted INTEGER NOT NULL DEFAULT 1,
  stage_status_json TEXT,
  log_summary_json TEXT,
  request_snapshot_json TEXT NOT NULL DEFAULT '{}',
  redaction_applied INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (execution_id) REFERENCES execution_histories(id)
);

CREATE TABLE IF NOT EXISTS test_results (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  details_json TEXT,
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (execution_id) REFERENCES execution_histories(id)
);

CREATE INDEX IF NOT EXISTS idx_captured_requests_received_at
  ON captured_requests (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_execution_histories_started_at
  ON execution_histories (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_execution_histories_status
  ON execution_histories (status);

CREATE INDEX IF NOT EXISTS idx_test_results_execution_id
  ON test_results (execution_id);

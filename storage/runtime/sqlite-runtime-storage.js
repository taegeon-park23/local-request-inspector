const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { STORAGE_SCHEMA_VERSION } = require('../shared/constants');

class SqliteRuntimeStorage {
  constructor(options) {
    this.layout = options.layout;
    this.migrationsDir = options.migrationsDir;
    this.database = null;
  }

  ensureStructure() {
    fs.mkdirSync(this.layout.runtimeDir, { recursive: true });
    this.database = new DatabaseSync(this.layout.runtimeDbPath);
    this.database.exec('PRAGMA journal_mode = WAL;');
    this.database.exec('PRAGMA foreign_keys = ON;');
    this.applyBootstrapMigration();
    this.upsertMetadata('schemaVersion', String(STORAGE_SCHEMA_VERSION));
    this.upsertMetadata('runtimePersistenceMode', 'redacted-only');
  }

  applyBootstrapMigration() {
    const bootstrapSqlPath = path.join(this.migrationsDir, '001-initial-runtime.sql');
    const sql = fs.readFileSync(bootstrapSqlPath, 'utf8');
    this.database.exec(sql);
  }

  upsertMetadata(key, value) {
    const statement = this.database.prepare(`
      INSERT INTO runtime_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    statement.run(key, value, new Date().toISOString());
  }

  insertExecutionHistory(record) {
    const statement = this.database.prepare(`
      INSERT INTO execution_histories (
        id, workspace_id, request_id, environment_id, status, cancellation_outcome,
        started_at, completed_at, duration_ms, error_code, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    statement.run(
      record.id,
      record.workspaceId || null,
      record.requestId || null,
      record.environmentId || null,
      record.status,
      record.cancellationOutcome || null,
      record.startedAt,
      record.completedAt || null,
      record.durationMs || null,
      record.errorCode || null,
      record.errorMessage || null,
    );
  }

  insertExecutionResult(record) {
    const statement = this.database.prepare(`
      INSERT INTO execution_results (
        execution_id, response_status, response_headers_json, response_body_preview,
        response_body_redacted, stage_status_json, log_summary_json, redaction_applied
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(execution_id) DO UPDATE SET
        response_status = excluded.response_status,
        response_headers_json = excluded.response_headers_json,
        response_body_preview = excluded.response_body_preview,
        response_body_redacted = excluded.response_body_redacted,
        stage_status_json = excluded.stage_status_json,
        log_summary_json = excluded.log_summary_json,
        redaction_applied = excluded.redaction_applied
    `);

    statement.run(
      record.executionId,
      record.responseStatus ?? null,
      record.responseHeadersJson ?? '[]',
      record.responseBodyPreview ?? '',
      record.responseBodyRedacted ? 1 : 0,
      record.stageStatusJson ?? '{}',
      record.logSummaryJson ?? '{}',
      record.redactionApplied ? 1 : 0,
    );
  }
}

module.exports = {
  SqliteRuntimeStorage,
};

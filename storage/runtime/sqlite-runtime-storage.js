const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { STORAGE_SCHEMA_VERSION } = require('../shared/constants');

function parseJsonColumn(value, fallbackValue) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
}

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
    this.ensureExecutionResultColumns();
    this.ensureCapturedRequestColumns();
    this.upsertMetadata('schemaVersion', String(STORAGE_SCHEMA_VERSION));
    this.upsertMetadata('runtimePersistenceMode', 'redacted-only');
  }

  applyBootstrapMigration() {
    const bootstrapSqlPath = path.join(this.migrationsDir, '001-initial-runtime.sql');
    const sql = fs.readFileSync(bootstrapSqlPath, 'utf8');
    this.database.exec(sql);
  }

  ensureColumn(tableName, columnName, definitionSql) {
    const columns = this.database.prepare(`PRAGMA table_info(${tableName})`).all();
    const hasColumn = columns.some((column) => column.name === columnName);

    if (!hasColumn) {
      this.database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
    }
  }

  ensureExecutionResultColumns() {
    this.ensureColumn('execution_results', 'request_snapshot_json', `TEXT NOT NULL DEFAULT '{}'`);
  }

  ensureCapturedRequestColumns() {
    this.ensureColumn('captured_requests', 'mock_outcome', `TEXT NOT NULL DEFAULT 'Mocked'`);
    this.ensureColumn('captured_requests', 'scope_label', `TEXT NOT NULL DEFAULT 'All runtime captures'`);
    this.ensureColumn('captured_requests', 'request_body_mode', `TEXT NOT NULL DEFAULT 'none'`);
  }

  upsertMetadata(key, value) {
    const statement = this.database.prepare(`
      INSERT INTO runtime_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    statement.run(key, value, new Date().toISOString());
  }

  insertCapturedRequest(record) {
    const statement = this.database.prepare(`
      INSERT INTO captured_requests (
        id, workspace_id, method, url, path, status_code, matched_mock_rule_id,
        request_headers_json, request_body_preview, request_body_redacted, received_at,
        mock_outcome, scope_label, request_body_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    statement.run(
      record.id,
      record.workspaceId || null,
      record.method,
      record.url,
      record.path || null,
      record.statusCode ?? null,
      record.matchedMockRuleId || null,
      record.requestHeadersJson ?? '{}',
      record.requestBodyPreview ?? '',
      record.requestBodyRedacted ? 1 : 0,
      record.receivedAt,
      record.mockOutcome || 'Mocked',
      record.scopeLabel || 'All runtime captures',
      record.requestBodyMode || 'none',
    );
  }

  mapCapturedRequestRow(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      method: row.method,
      url: row.url,
      path: row.path,
      statusCode: row.status_code,
      matchedMockRuleId: row.matched_mock_rule_id,
      requestHeaders: parseJsonColumn(row.request_headers_json, {}),
      requestBodyPreview: row.request_body_preview || '',
      requestBodyRedacted: Number(row.request_body_redacted || 0) === 1,
      receivedAt: row.received_at,
      mockOutcome: row.mock_outcome || 'Mocked',
      scopeLabel: row.scope_label || 'All runtime captures',
      requestBodyMode: row.request_body_mode || 'none',
    };
  }

  createCapturedRequestSelectSql(whereClause = '') {
    return `
      SELECT
        id,
        workspace_id,
        method,
        url,
        path,
        status_code,
        matched_mock_rule_id,
        request_headers_json,
        request_body_preview,
        request_body_redacted,
        received_at,
        mock_outcome,
        scope_label,
        request_body_mode
      FROM captured_requests
      ${whereClause}
      ORDER BY received_at DESC
    `;
  }

  listCapturedRequests() {
    const statement = this.database.prepare(this.createCapturedRequestSelectSql());
    return statement.all().map((row) => this.mapCapturedRequestRow(row));
  }

  readCapturedRequest(capturedRequestId) {
    const statement = this.database.prepare(
      this.createCapturedRequestSelectSql('WHERE id = ?'),
    );

    return this.mapCapturedRequestRow(statement.get(capturedRequestId));
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
        response_body_redacted, stage_status_json, log_summary_json, request_snapshot_json, redaction_applied
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(execution_id) DO UPDATE SET
        response_status = excluded.response_status,
        response_headers_json = excluded.response_headers_json,
        response_body_preview = excluded.response_body_preview,
        response_body_redacted = excluded.response_body_redacted,
        stage_status_json = excluded.stage_status_json,
        log_summary_json = excluded.log_summary_json,
        request_snapshot_json = excluded.request_snapshot_json,
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
      record.requestSnapshotJson ?? '{}',
      record.redactionApplied ? 1 : 0,
    );
  }

  insertTestResults(records) {
    if (!Array.isArray(records) || records.length === 0) {
      return;
    }

    const statement = this.database.prepare(`
      INSERT INTO test_results (
        id, execution_id, test_name, status, message, details_json, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.database.transaction((items) => {
      for (const record of items) {
        statement.run(
          record.id,
          record.executionId,
          record.testName,
          record.status,
          record.message || null,
          record.detailsJson || '{}',
          record.recordedAt,
        );
      }
    });

    insertMany(records);
  }

  listExecutionTestResults(executionId, limit = 8) {
    const statement = this.database.prepare(`
      SELECT
        id,
        execution_id,
        test_name,
        status,
        message,
        details_json,
        recorded_at
      FROM test_results
      WHERE execution_id = ?
      ORDER BY recorded_at ASC
      LIMIT ?
    `);

    return statement.all(executionId, limit).map((row) => ({
      id: row.id,
      executionId: row.execution_id,
      testName: row.test_name,
      status: row.status,
      message: row.message,
      details: parseJsonColumn(row.details_json, {}),
      recordedAt: row.recorded_at,
    }));
  }

  mapExecutionHistoryRow(row) {
    if (!row) {
      return null;
    }

    return {
      executionId: row.execution_id,
      workspaceId: row.workspace_id,
      requestId: row.request_id,
      environmentId: row.environment_id,
      status: row.status,
      cancellationOutcome: row.cancellation_outcome,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMs: row.duration_ms,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      responseStatus: row.response_status,
      responseHeaders: parseJsonColumn(row.response_headers_json, []),
      responseBodyPreview: row.response_body_preview || '',
      responseBodyRedacted: Number(row.response_body_redacted || 0) === 1,
      stageStatus: parseJsonColumn(row.stage_status_json, {}),
      logSummary: parseJsonColumn(row.log_summary_json, {}),
      requestSnapshot: parseJsonColumn(row.request_snapshot_json, {}),
      redactionApplied: Number(row.redaction_applied || 0) === 1,
      assertionCount: Number(row.assertion_count || 0),
      passedAssertions: Number(row.passed_assertions || 0),
      failedAssertions: Number(row.failed_assertions || 0),
      skippedAssertions: Number(row.skipped_assertions || 0),
    };
  }

  createExecutionHistorySelectSql(whereClause = '') {
    return `
      SELECT
        histories.id AS execution_id,
        histories.workspace_id,
        histories.request_id,
        histories.environment_id,
        histories.status,
        histories.cancellation_outcome,
        histories.started_at,
        histories.completed_at,
        histories.duration_ms,
        histories.error_code,
        histories.error_message,
        results.response_status,
        results.response_headers_json,
        results.response_body_preview,
        results.response_body_redacted,
        results.stage_status_json,
        results.log_summary_json,
        results.request_snapshot_json,
        results.redaction_applied,
        COALESCE(test_counts.assertion_count, 0) AS assertion_count,
        COALESCE(test_counts.passed_assertions, 0) AS passed_assertions,
        COALESCE(test_counts.failed_assertions, 0) AS failed_assertions,
        COALESCE(test_counts.skipped_assertions, 0) AS skipped_assertions
      FROM execution_histories histories
      LEFT JOIN execution_results results
        ON results.execution_id = histories.id
      LEFT JOIN (
        SELECT
          execution_id,
          COUNT(*) AS assertion_count,
          SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS passed_assertions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_assertions,
          SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped_assertions
        FROM test_results
        GROUP BY execution_id
      ) test_counts
        ON test_counts.execution_id = histories.id
      ${whereClause}
      ORDER BY histories.started_at DESC
    `;
  }

  listExecutionHistories() {
    const statement = this.database.prepare(this.createExecutionHistorySelectSql());
    return statement.all().map((row) => this.mapExecutionHistoryRow(row));
  }

  readExecutionHistory(executionId) {
    const statement = this.database.prepare(
      this.createExecutionHistorySelectSql('WHERE histories.id = ?'),
    );

    const historyRecord = this.mapExecutionHistoryRow(statement.get(executionId));

    if (!historyRecord) {
      return null;
    }

    return {
      ...historyRecord,
      testResults: this.listExecutionTestResults(executionId),
    };
  }
}

module.exports = {
  SqliteRuntimeStorage,
};

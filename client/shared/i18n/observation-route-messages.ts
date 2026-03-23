export const observationRouteMessagesEn = {
  capturesRoute: {
    filters: {
      searchLabel: 'Search captures',
      outcomeFilterLabel: 'Mock outcome filter',
      listAriaLabel: 'Captures list',
    },
    outcomeFilterOptions: {
      all: 'All outcomes',
      mocked: 'Mocked',
      bypassed: 'Bypassed',
      noRuleMatched: 'No rule matched',
      blocked: 'Blocked',
    },
    sidebar: {
      eyebrow: 'Observation feed',
      title: 'Capture list',
      roleChip: 'Runtime lane',
      selectedSummary: {
        title: 'Selected capture',
        labels: {
          scope: 'Scope',
          observedAt: 'Observed at',
          bodyHint: 'Body hint',
          previewPolicy: 'Preview policy',
        },
      },
      health: {
        idle: 'Capture observation is idle until the runtime adapter starts and the persisted capture list is queried.',
        connecting: 'Connecting to the runtime capture feed while loading the latest persisted inbound capture summaries.',
        connected: 'Persisted inbound capture summaries are available. Select a row to inspect it or open a replay draft without mutating the capture record.',
        degraded: 'Capture observation is degraded. Existing persisted inbound summaries may still be visible while refresh and deeper diagnostics remain limited.',
        offline: 'Capture observation is offline. Persisted inbound capture rows remain queryable, but no new runtime events can trigger refresh right now.',
      },
    },
    empty: {
      loadingList: {
        title: 'Loading persisted captures',
        description: 'Waiting for the runtime lane to return the latest inbound capture summaries. Runtime events refresh this list when new captures arrive.',
      },
      degraded: {
        title: 'Capture observation is degraded',
        fallbackDescription: 'Persisted capture summaries could not be refreshed cleanly.',
      },
      noItems: {
        title: 'No captures yet',
        description: 'Inbound traffic will appear here once requests hit the local server and the runtime lane persists bounded capture summaries.',
      },
      noFilteredItems: {
        title: 'No captures match these filters',
        description: 'Adjust the search text or mock outcome filter to bring persisted capture rows back into view.',
      },
      loadingDetail: {
        title: 'Loading persisted capture detail',
        description: 'The runtime lane is loading the latest capture list before a detail row can be selected.',
      },
      noSelection: {
        title: 'No capture selected',
        description: 'Pick a capture row to inspect the persisted inbound request snapshot, mock outcome vocabulary, and the compact timeline scaffold. Replay opens a separate authoring draft in Workspace.',
      },
      loadingPersistedDetail: {
        title: 'Loading persisted capture detail',
        description: 'Fetching the selected captured request from the runtime lane. The detail surface stays observation-only once the row loads.',
      },
      detailDegraded: {
        title: 'Capture detail is degraded',
        fallbackDescription: 'The selected captured request could not be loaded cleanly.',
      },
      timelinePlaceholder: {
        title: 'Compact timeline placeholder',
        description: 'Capture timeline summaries, handling notes, and replay bridge guidance appear after a persisted capture row is selected.',
      },
    },
    detail: {
      header: {
        eyebrow: 'Observation detail',
        title: 'Capture detail',
        roleChip: 'Inbound request',
      },
      bridge: {
        title: 'Observation bridge',
        description: 'Replay stays edit-first. Open Replay Draft creates a new request draft while the captured request remains observation-only.',
        openReplayDraft: 'Open Replay Draft',
        runReplayNow: 'Run Replay Now',
        readinessNote: 'Run Replay Now stays disabled in this slice. Real capture data now drives this route, but replay still opens a fresh editable draft first.',
      },
      requestSnapshot: {
        title: 'Request snapshot',
        description: 'Inbound request snapshots stay separate from outbound execution history and editable request drafts.',
        labels: {
          snapshotSource: 'Snapshot source',
          hostPath: 'Host/path',
          observedAt: 'Observed at',
          scope: 'Scope',
          headers: 'Headers',
        },
      },
      persistenceSummary: {
        title: 'Persistence summary',
        description: 'Stored capture headers and body previews remain bounded and redacted where needed before replay or deeper diagnostics are considered.',
        labels: {
          headersSummary: 'Headers summary',
          bodyHint: 'Body hint',
          storedSummary: 'Stored summary',
          previewPolicy: 'Preview policy',
        },
      },
      bodyPreview: {
        title: 'Body preview',
        labels: {
          responseStatus: 'Response status',
          previewPolicy: 'Preview policy',
        },
      },
      mockHandling: {
        title: 'Mock handling',
        description: 'Mock outcome family stays separate from connection, execution, and transport vocabulary.',
        outcomeFamilyLabel: 'Mock outcome family',
        labels: {
          summary: 'Summary',
          handlingSummary: 'Handling summary',
          rule: 'Rule',
          delay: 'Delay',
        },
      },
    },
    timelinePanel: {
      header: {
        eyebrow: 'Observation panel',
        title: 'Compact timeline',
        description: 'Compact summary blocks only. Unified timelines, diff viewers, and deep traces remain out of scope.',
        roleChip: 'Compact timeline',
      },
      tabs: {
        ariaLabel: 'Capture detail tabs',
        timeline: 'Timeline',
        deferredDetail: 'Deferred detail',
      },
      timelineSummary: {
        title: 'Timeline summary',
        description: 'Compact summary blocks only. Unified timelines, diff viewers, and deep traces remain out of scope for this slice.',
        ariaLabel: 'Capture timeline',
      },
      deferred: {
        title: 'Deferred runtime detail',
        emptyTitle: 'Deeper capture composition is deferred',
        emptyDescription: 'Persisted capture detail stops at bounded handling summaries while raw transport views, richer diagnostics, and replay execution remain out of scope.',
        labels: {
          mockOutcome: 'Mock outcome',
          handlingSummary: 'Handling summary',
          storedSummary: 'Stored summary',
          previewPolicy: 'Preview policy',
        },
      },
    },
    helpers: {
      openCaptureAction: 'Open capture {method} {path}',
      observationSourceLabel: 'Inbound request snapshot',
      storageSummaryWithPreview: 'Persisted capture keeps {count} header(s) and bounded request previews for observation and replay.',
      storageSummaryWithoutPreview: 'Persisted capture keeps {count} header(s) and no request-body preview for this inbound capture.',
      bodyPreviewPolicyWithPreview: 'Captured request body preview remains bounded before deeper diagnostics are added.',
      bodyPreviewPolicyWithoutPreview: 'No request body preview was persisted for this capture.',
      statusSummaryNoResponse: 'No response status summary',
      statusSummaryHttp: 'HTTP {statusCode}',
    },
  },
  historyRoute: {
    filters: {
      searchLabel: 'Search history',
      executionOutcomeFilterLabel: 'Execution outcome filter',
      listAriaLabel: 'History list',
    },
    outcomeFilterOptions: {
      all: 'All executions',
      succeeded: 'Succeeded',
      failed: 'Failed',
      timedOut: 'Timed out',
      cancelled: 'Cancelled',
      blocked: 'Blocked',
    },
    sidebar: {
      eyebrow: 'Execution observations',
      title: 'History list',
      roleChip: 'Runtime lane',
      selectedSummary: {
        title: 'Selected execution',
        labels: {
          transportOutcome: 'Transport outcome',
          tests: 'Tests',
          duration: 'Duration',
          executedAt: 'Executed at',
        },
      },
      health: {
        ready: 'History reads persisted execution summaries from the runtime lane. Select a row to inspect bounded result composition or open a replay draft into Workspace.',
        degraded: 'History observation is degraded. Persisted execution summaries may be unavailable until the runtime lane responds again.',
      },
    },
    empty: {
      loadingList: {
        title: 'Loading persisted execution history',
        description: 'Waiting for the runtime lane to return the latest execution summaries. Filtering stays local once the persisted list arrives.',
      },
      degraded: {
        title: 'History observation is degraded',
        fallbackDescription: 'Persisted execution summaries could not be loaded cleanly.',
      },
      noItems: {
        title: 'No history yet',
        description: 'Outbound request executions appear here after Run persists a bounded runtime summary into SQLite history storage.',
      },
      noFilteredItems: {
        title: 'No history rows match these filters',
        description: 'Adjust the search text or execution outcome filter to bring persisted history rows back into view.',
      },
      loadingDetail: {
        title: 'Loading persisted history detail',
        description: 'The runtime lane is loading the latest execution list before a detail row can be selected.',
      },
      noSelection: {
        title: 'No history selected',
        description: 'Pick an execution row to inspect the persisted request snapshot, bounded result composition, and compact stage summary. Replay still opens a separate authoring draft instead of mutating history detail.',
      },
      loadingPersistedDetail: {
        title: 'Loading persisted execution detail',
        description: 'Fetching the selected execution detail from the runtime lane. The result composition tabs stay observation-only once the row loads.',
      },
      detailDegraded: {
        title: 'Execution detail is degraded',
        fallbackDescription: 'The selected execution could not be loaded cleanly.',
      },
      timelinePlaceholder: {
        title: 'Compact timeline placeholder',
        description: 'Execution stage summaries and deferred notes appear after a persisted history row is selected.',
      },
    },
    detail: {
      header: {
        eyebrow: 'Observation detail',
        title: 'History detail',
        roleChip: 'Persisted execution',
      },
      bridge: {
        title: 'Observation boundary',
        description: 'History detail stays observation-only. Open Replay Draft creates a new editable request draft instead of turning this persisted execution record into live authoring state.',
        openReplayDraft: 'Open Replay Draft',
        runReplayNow: 'Run Replay Now',
        readinessNote: 'Run Replay Now stays disabled in this slice because replay remains edit-first, and persisted history keeps only bounded redacted summaries.',
      },
    },
    summaryCards: {
      executionSummary: {
        title: 'Execution summary',
        description: 'Execution outcome, transport outcome, and test summary remain separate vocabulary families.',
        labels: {
          executionOutcome: 'Execution outcome',
          transportOutcome: 'Transport outcome',
          duration: 'Duration',
          tests: 'Tests',
        },
      },
      requestSnapshot: {
        title: 'Request snapshot',
        description: 'History shows the persisted outbound request snapshot used during execution, not the live request draft currently open in Workspace.',
        labels: {
          requestLabel: 'Request label',
          snapshotSource: 'Snapshot source',
          linkedRequest: 'Linked request',
          placement: 'Placement',
          url: 'URL',
          requestInput: 'Request input',
        },
      },
    },
    resultTabs: {
      ariaLabel: 'History result tabs',
      response: 'Response',
      console: 'Console',
      tests: 'Tests',
      executionInfo: 'Execution Info',
    },
    resultPanels: {
      response: {
        title: 'Response summary',
        statusCodeNoPersistedCode: 'No persisted code',
        labels: {
          statusCode: 'Status code',
          duration: 'Duration',
          previewSize: 'Preview size',
          previewPolicy: 'Preview policy',
          headersSummary: 'Headers summary',
          bodyHint: 'Body hint',
        },
        boundedDetailTitle: 'Persisted response detail stays bounded',
        boundedDetailDescription: 'Saved history shows redacted runtime summaries. Rich JSON viewers, diff, and full raw payload inspection stay deferred for a later slice.',
      },
      console: {
        title: 'Console summary',
        noPersistedSummaryTitle: 'No persisted console summary',
        labels: {
          logLines: 'Log lines',
          warnings: 'Warnings',
          postResponseStage: 'Post-response stage',
          storedSummary: 'Stored summary',
          storedSummaryValue: 'Redacted summary only',
        },
        consolePreviewAriaLabel: 'Console preview',
      },
      tests: {
        title: 'Tests summary',
        noPersistedSummaryTitle: 'No persisted tests summary',
        labels: {
          assertions: 'Assertions',
          passed: 'Passed',
          failed: 'Failed',
          testsStage: 'Tests stage',
        },
        testsPreviewAriaLabel: 'Tests preview',
        deferredDetailTitle: 'Per-assertion drilldown is deferred',
        deferredDetailDescription: 'History stops at bounded persisted test summaries and does not add script execution or deep diagnostics composition yet.',
      },
      executionInfo: {
        title: 'Execution info',
        description: 'Execution metadata remains separate from request authoring and inbound capture observation state.',
        noExecutionErrorCode: 'No execution error code',
        noExecutionErrorSummary: 'No execution error was reported.',
        stageSummaryAriaLabel: 'Execution stage summary',
        labels: {
          executionId: 'Execution id',
          started: 'Started',
          completed: 'Completed',
          environment: 'Environment',
          source: 'Source',
          errorCode: 'Error code',
          errorSummary: 'Error summary',
          requestInput: 'Request input',
        },
        deferredDetailTitle: 'Advanced execution diagnostics are deferred',
        deferredDetailDescription: 'Cancellation controls, live stage streams, and diff viewers remain outside this history observation slice.',
      },
    },
    timelinePanel: {
      header: {
        eyebrow: 'Observation panel',
        title: 'Execution stage summary',
        description: 'Compact persisted stage summaries only. Unified timelines, diff viewers, and deep traces remain out of scope.',
        roleChip: 'Stage summary',
      },
      timelineSummary: {
        title: 'Compact timeline',
        description: 'History keeps stage summaries compact and human-readable rather than turning into a deep trace viewer.',
        ariaLabel: 'History timeline',
      },
      deferred: {
        title: 'Deferred runtime detail',
        description: 'Persisted history detail is intentionally bounded, and replay continues to use an explicit edit-first bridge into Workspace.',
        emptyTitle: 'Replay defaults to edit-first',
        emptyDescription: 'Open Replay Draft creates a new request-builder draft without turning history detail into editable state.',
      },
    },
    helpers: {
      openHistoryAction: 'Open history {label}',
      previewSizeNone: 'No persisted preview',
      previewSizeBytes: '{count} B preview',
      placementNone: 'No saved placement recorded',
      bodyModeJson: 'JSON body',
      bodyModeText: 'Text body',
      bodyModeForm: 'Form body',
      bodyModeMultipart: 'Multipart body',
      bodyModeNone: 'No body',
      authBearer: 'Bearer auth',
      authBasic: 'Basic auth',
      authApiKeyQuery: 'API key in query',
      authApiKeyHeader: 'API key in header',
      authNone: 'No auth',
      requestInputSummary: '{params} params · {headers} headers · {bodyMode} · {auth}',
      linkedRequestNone: 'No linked saved request',
      linkedRequestDraftPlacement: 'Draft save placement: {placement}',
      responsePreviewPolicyNone: 'No response preview was persisted for this execution.',
      responsePreviewPolicyBounded: 'Persisted response preview is bounded and redacted before deeper diagnostics are added.',
      stageStatusSkipped: 'Skipped',
    },
  },
  mocksRoute: {
    filters: {
      searchLabel: 'Search rules',
      stateFilterLabel: 'Rule state filter',
      listAriaLabel: 'Mock rules list',
      stateOptions: {
        all: 'All rules',
        enabled: 'Enabled',
        disabled: 'Disabled',
      },
    },
    sidebar: {
      eyebrow: 'Rule management',
      title: 'Mock rules',
      description: 'Persisted authored rules live here. Captures still owns runtime mock outcomes after evaluation.',
      resourceLaneChip: 'Resource lane',
      newRule: 'New Rule',
      selectedSummary: {
        title: 'Selected rule',
        labels: {
          methodSummary: 'Method summary',
          pathSummary: 'Path summary',
          responseSummary: 'Response summary',
          fixedDelay: 'Fixed delay',
        },
      },
    },
    empty: {
      loadingList: {
        title: 'Loading persisted rules',
        description: 'Waiting for the resource lane to return saved mock rules for this workspace.',
      },
      degraded: {
        title: 'Mock rules are degraded',
        description: 'Persisted rule data could not be refreshed cleanly. {reason}',
      },
      noItems: {
        title: 'No mock rules yet',
        description: 'Create a rule to persist matcher and static response scaffolding for inbound capture evaluation.',
      },
      noFilteredItems: {
        title: 'No rules match these filters',
        description: 'Adjust the search text or state filter to bring persisted rules back into view.',
      },
      loadingDetail: {
        title: 'Loading mock rule detail',
        description: 'The persisted rule list is loading before a detail row can be selected.',
      },
      noSelection: {
        title: 'No mock rule selected',
        description: 'Choose a persisted rule or start a new rule draft to edit matcher and static response fields.',
      },
      loadingPersistedDetail: {
        title: 'Loading persisted rule detail',
        description: 'Fetching the selected rule from the resource lane before editable details are shown.',
      },
      detailDegraded: {
        title: 'Mock rule detail is degraded',
        description: 'The selected rule could not be loaded cleanly. {reason}',
      },
    },
    detail: {
      header: {
        draftEyebrow: 'New rule draft',
        persistedEyebrow: 'Persisted rule detail',
        createTitle: 'Create mock rule',
        editTitle: 'Edit mock rule',
        authoredRuleChip: 'Authored rule',
      },
      boundary: {
        title: 'Persistence boundary',
        description: 'Create and Save update authored rule definitions only. Runtime mock outcomes remain in Captures.',
        actions: {
          createRule: 'Create rule',
          saveRule: 'Save rule',
          disableRule: 'Disable rule',
          enableRule: 'Enable rule',
          exportingRule: 'Exporting rule',
          exportRule: 'Export rule',
          cancelDraft: 'Cancel draft',
          deleteRule: 'Delete rule',
        },
        fallbackReadiness: 'Quick enable or disable updates persisted rule state only. Other field edits still require Create or Save.',
        mutationFailedTitle: 'Rule mutation failed',
      },
      summaryCards: {
        rule: {
          title: 'Rule summary',
          description: 'Enabled or Disabled here describes authored rule state, not runtime mock outcome.',
          labels: {
            name: 'Rule name',
            state: 'Rule state',
            priority: 'Priority',
            source: 'Source',
          },
        },
        evaluation: {
          title: 'Evaluation summary',
          description: 'Enabled rules are evaluated by priority, matcher specificity, and a stable tie-breaker.',
          labels: {
            matcherSummary: 'Matcher summary',
            responseSummary: 'Response summary',
            delayHint: 'Delay hint',
          },
        },
      },
      tabs: {
        ariaLabel: 'Mock rule detail tabs',
        overview: 'Overview',
        matchers: 'Matchers',
        response: 'Response',
        diagnostics: 'Diagnostics',
      },
      overview: {
        title: 'Overview',
        description: 'This editor stays inside the T013 MVP matcher and static response surface.',
        labels: {
          ruleName: 'Rule name',
          ruleEnabled: 'Rule enabled',
          priority: 'Priority',
          rulePriority: 'Rule priority',
          methodMatch: 'Method match',
          httpMethod: 'HTTP method',
          pathMatch: 'Path match',
          pathValue: 'Path value',
        },
        placeholders: {
          pathValue: '/webhooks/stripe',
        },
        methodModeOptions: {
          any: 'Any method',
          exact: 'Exact method',
        },
        pathModeOptions: {
          exact: 'Exact path',
          prefix: 'Path prefix',
        },
      },
      matchers: {
        labels: {
          operator: 'Operator',
          value: 'Value',
          remove: 'Remove',
        },
        operatorOptions: {
          exists: 'Exists',
          equals: 'Exact match',
          contains: 'Contains',
        },
        query: {
          title: 'Query matchers',
          description: 'Use lightweight exists, exact, and contains operators only.',
          addLabel: 'Add query matcher',
          labels: {
            key: 'Query matcher key',
          },
          emptyTitle: 'No query matchers',
          emptyDescription: 'Add lightweight exists, exact, or contains rows only. Script-assisted matching remains deferred.',
        },
        header: {
          title: 'Header matchers',
          description: 'Header matching remains bounded to exists, exact, and contains operators.',
          addLabel: 'Add header matcher',
          labels: {
            key: 'Header matcher key',
          },
          emptyTitle: 'No header matchers',
          emptyDescription: 'Add lightweight exists, exact, or contains rows only. Script-assisted matching remains deferred.',
        },
        body: {
          title: 'Body matcher',
          description: 'Regex, JSONPath, and script matchers remain deferred.',
          labels: {
            mode: 'Body matcher',
            value: 'Body match value',
          },
          modeOptions: {
            none: 'No body matcher',
            exact: 'Exact body text',
            contains: 'Contains text',
          },
        },
      },
      response: {
        responseCard: {
          title: 'Static response',
          description: 'Static status, headers, body, and fixed delay form the bounded MVP response surface.',
          labels: {
            status: 'Response status',
            fixedDelay: 'Fixed delay (ms)',
            fixedDelayAria: 'Fixed delay',
            body: 'Response body',
          },
        },
        headersCard: {
          title: 'Response headers',
          description: 'Static response headers stay bounded and predictable in this MVP surface.',
          addLabel: 'Add response header',
          emptyTitle: 'No static response headers',
          emptyDescription: 'Add static response headers only when the mock response needs them.',
          labels: {
            name: 'Response header name',
            value: 'Response header value',
            remove: 'Remove',
          },
        },
      },
      diagnostics: {
        title: 'Diagnostics and deferred work',
        description: 'Rules are evaluated by enabled state, explicit priority, matcher specificity, and a stable tie-breaker.',
        labels: {
          deferredNote: 'Deferred note',
          source: 'Source',
          currentState: 'Current state',
        },
        values: {
          deferredNote: 'Script-assisted matcher/response and advanced scenario state remain deferred.',
        },
        runtimeOutcomes: {
          title: 'Runtime outcomes stay in Captures',
          description: 'This route persists authored rule definitions only. Captures shows Mocked, Bypassed, No rule matched, and Blocked outcomes after evaluation.',
        },
      },
    },
    contextual: {
      empty: {
        title: 'Management notes placeholder',
        description: 'Persisted rule diagnostics, authored rule reminders, and evaluation guardrails appear after a rule is selected or a new draft is opened.',
      },
      header: {
        eyebrow: 'Contextual panel',
        title: 'Management notes',
        description: 'Authored mock rules stay separate from runtime capture outcomes. This panel stays focused on rule constraints and evaluation order.',
        guardrailsChip: 'Guardrails',
      },
      guardrails: {
        title: 'Evaluation guardrails',
        description: 'Only enabled rules are evaluated. Priority wins first, then matcher specificity, then a stable created-at tie-breaker.',
        labels: {
          methodSummary: 'Method summary',
          pathSummary: 'Path summary',
          responseSummary: 'Response summary',
        },
      },
      deferred: {
        title: 'Deferred capabilities',
        description: 'Script-assisted matcher/response authoring, scenario state, diff, and deeper runtime traces remain later-slice work.',
        labels: {
          persistence: 'Persistence',
          runtimeEvaluation: 'Runtime evaluation',
          captureDiagnostics: 'Capture diagnostics',
        },
        values: {
          persistence: 'Persisted JSON resource lane',
          runtimeEvaluation: 'Enabled for MVP static matching and response only',
          captureDiagnostics: 'Outcome and matched rule summary only',
        },
      },
    },
    helpers: {
      matcherRowExists: '{key} exists',
      matcherRowContains: '{key} contains {value}',
      matcherRowEquals: '{key} equals {value}',
      responseHeadersNone: 'No static response headers',
      responseHeadersCount: '{count} static response headers',
      methodAny: 'Method: any',
      methodExact: 'Method exact: {method}',
      pathPrefix: 'Path prefix: {path}',
      pathExact: 'Path exact: {path}',
      noQueryMatcher: 'No query matcher',
      noHeaderMatcher: 'No header matcher',
      noBodyMatcher: 'No body matcher',
      bodyContains: 'Body contains: {value}',
      bodyExact: 'Body exact: {value}',
      fixedDelayValue: 'Fixed delay: {delayMs} ms',
      fixedDelayNone: 'No fixed delay',
      responseSummary: 'Static {statusCode} response.',
      responseSummaryWithDelay: 'Static {statusCode} response with {delayMs} ms fixed delay.',
      saveDisabled: {
        saving: 'Persisting the current rule changes.',
        nameRequired: 'Rule name is required before saving.',
        pathRequired: 'Path value is required before saving.',
        bodyRequired: 'Body matcher value is required when a body matcher is enabled.',
        statusCodeRange: 'Response status code must stay between 100 and 599.',
        fixedDelayRange: 'Fixed delay must stay between 0 and 2000 ms.',
      },
      quickToggleDisabled: {
        createFirst: 'Create the rule first before using the quick enable or disable action.',
        updating: 'Updating persisted rule state.',
      },
      deleteDisabled: {
        discardDraft: 'Discard the draft instead of deleting it. Only persisted rules can be deleted.',
        deleting: 'Deleting the persisted rule.',
      },
      sourceLabels: {
        unsaved: 'Unsaved workspace rule',
        persisted: 'Persisted workspace rule',
      },
      exportSuccess: 'Exported {name} from the authored resource lane. Runtime mock outcomes remain excluded.',
      exportFailure: 'Mock rule export failed before a bundle could be downloaded.',
      degradedReasonFallback: 'Persisted mock rules could not be loaded cleanly.',
      openRuleAction: 'Open mock rule {name}',
      priorityChip: 'Priority {priority}',
      untitledRule: 'Untitled Mock Rule',
      missingPath: '(missing path)',
      missingText: '(missing text)',
    },
  },
} as const;

type ObservationCatalogShape<T> = {
  [K in keyof T]: T[K] extends string ? string : ObservationCatalogShape<T[K]>;
};

export const observationRouteMessagesKo: ObservationCatalogShape<typeof observationRouteMessagesEn> = {
  capturesRoute: {
    filters: {
      searchLabel: '캡처 검색',
      outcomeFilterLabel: 'Mock 결과 필터',
      listAriaLabel: '캡처 목록',
    },
    outcomeFilterOptions: {
      all: '모든 결과',
      mocked: 'Mocked',
      bypassed: 'Bypassed',
      noRuleMatched: 'No rule matched',
      blocked: 'Blocked',
    },
    sidebar: {
      eyebrow: '관측 피드',
      title: '캡처 목록',
      roleChip: '런타임 레인',
      selectedSummary: {
        title: '선택된 캡처',
        labels: {
          scope: '범위',
          observedAt: '관측 시각',
          bodyHint: '본문 힌트',
          previewPolicy: '미리보기 정책',
        },
      },
      health: {
        idle: '런타임 어댑터가 시작되고 저장된 캡처 목록이 조회되기 전까지 캡처 관측은 유휴 상태입니다.',
        connecting: '최신 저장 캡처 요약을 불러오면서 런타임 캡처 피드에 연결하고 있습니다.',
        connected: '저장된 인바운드 캡처 요약을 확인할 수 있습니다. 행을 선택해 살펴보거나 캡처 레코드를 바꾸지 않고 replay draft를 열 수 있습니다.',
        degraded: '캡처 관측 상태가 저하되었습니다. 새로고침과 깊은 진단은 제한되지만 기존 저장 요약은 계속 보일 수 있습니다.',
        offline: '캡처 관측이 오프라인입니다. 저장된 캡처 행은 계속 조회할 수 있지만 지금은 새로운 런타임 이벤트가 새로고침을 트리거하지 못합니다.',
      },
    },
    empty: {
      loadingList: {
        title: '저장된 캡처를 불러오는 중',
        description: '런타임 레인에서 최신 인바운드 캡처 요약을 돌려주길 기다리고 있습니다. 새 캡처가 들어오면 런타임 이벤트가 이 목록을 새로고칩니다.',
      },
      degraded: {
        title: '캡처 관측 상태가 저하되었습니다',
        fallbackDescription: '저장된 캡처 요약을 정상적으로 새로고치지 못했습니다.',
      },
      noItems: {
        title: '캡처가 아직 없습니다',
        description: '로컬 서버로 요청이 들어오고 런타임 레인이 제한된 캡처 요약을 저장하면 이곳에 표시됩니다.',
      },
      noFilteredItems: {
        title: '필터와 일치하는 캡처가 없습니다',
        description: '검색어 또는 Mock 결과 필터를 조정해 저장된 캡처 행을 다시 표시하세요.',
      },
      loadingDetail: {
        title: '저장된 캡처 상세를 불러오는 중',
        description: '세부 행을 선택하기 전에 런타임 레인이 최신 캡처 목록을 불러오고 있습니다.',
      },
      noSelection: {
        title: '선택된 캡처가 없습니다',
        description: '캡처 행을 선택하면 저장된 인바운드 요청 스냅샷, mock 결과 vocabulary, 압축된 타임라인 골격을 확인할 수 있습니다. Replay는 Workspace에서 별도의 authoring draft로 열립니다.',
      },
      loadingPersistedDetail: {
        title: '저장된 캡처 상세를 불러오는 중',
        description: '선택한 캡처 요청을 런타임 레인에서 가져오고 있습니다. 로드가 끝나면 이 상세 화면은 observation-only 상태를 유지합니다.',
      },
      detailDegraded: {
        title: '캡처 상세 상태가 저하되었습니다',
        fallbackDescription: '선택한 캡처 요청을 정상적으로 불러오지 못했습니다.',
      },
      timelinePlaceholder: {
        title: '압축 타임라인 placeholder',
        description: '저장된 캡처 행을 선택하면 캡처 타임라인 요약, 처리 메모, replay bridge 안내가 여기에 표시됩니다.',
      },
    },
    detail: {
      header: {
        eyebrow: '관측 상세',
        title: '캡처 상세',
        roleChip: '인바운드 요청',
      },
      bridge: {
        title: '관측 브리지',
        description: 'Replay는 edit-first 흐름을 유지합니다. Replay Draft 열기는 새 요청 draft를 만들고, 캡처된 요청은 observation-only 상태로 남습니다.',
        openReplayDraft: 'Replay Draft 열기',
        runReplayNow: '지금 Replay 실행',
        readinessNote: '이번 slice에서는 지금 Replay 실행이 비활성화됩니다. 이 route는 이제 실제 캡처 데이터를 사용하지만, replay는 여전히 먼저 새 편집 draft를 엽니다.',
      },
      requestSnapshot: {
        title: '요청 스냅샷',
        description: '인바운드 요청 스냅샷은 아웃바운드 실행 히스토리 및 편집 가능한 요청 draft와 분리된 상태를 유지합니다.',
        labels: {
          snapshotSource: '스냅샷 출처',
          hostPath: '호스트/경로',
          observedAt: '관측 시각',
          scope: '범위',
          headers: '헤더',
        },
      },
      persistenceSummary: {
        title: '영속화 요약',
        description: '저장된 캡처 헤더와 본문 미리보기는 replay나 더 깊은 진단을 고려하기 전에 필요한 범위에서 제한되고 redacted 상태를 유지합니다.',
        labels: {
          headersSummary: '헤더 요약',
          bodyHint: '본문 힌트',
          storedSummary: '저장 요약',
          previewPolicy: '미리보기 정책',
        },
      },
      bodyPreview: {
        title: '본문 미리보기',
        labels: {
          responseStatus: '응답 상태',
          previewPolicy: '미리보기 정책',
        },
      },
      mockHandling: {
        title: 'Mock 처리',
        description: 'Mock 결과 계열은 connection, execution, transport vocabulary와 분리된 상태를 유지합니다.',
        outcomeFamilyLabel: 'Mock 결과 계열',
        labels: {
          summary: '요약',
          handlingSummary: '처리 요약',
          rule: '규칙',
          delay: '지연',
        },
      },
    },
    timelinePanel: {
      header: {
        eyebrow: '관측 패널',
        title: '압축 타임라인',
        description: '압축된 요약 블록만 제공합니다. 통합 타임라인, diff 뷰어, 깊은 trace는 범위 밖입니다.',
        roleChip: '압축 타임라인',
      },
      tabs: {
        ariaLabel: '캡처 상세 탭',
        timeline: '타임라인',
        deferredDetail: '유예된 상세',
      },
      timelineSummary: {
        title: '타임라인 요약',
        description: '압축된 요약 블록만 제공합니다. 통합 타임라인, diff 뷰어, 깊은 trace는 이 slice의 범위 밖입니다.',
        ariaLabel: '캡처 타임라인',
      },
      deferred: {
        title: '유예된 런타임 상세',
        emptyTitle: '더 깊은 캡처 구성이 유예되었습니다',
        emptyDescription: '저장된 캡처 상세는 제한된 처리 요약까지만 제공하며, raw transport 뷰, richer diagnostics, replay execution은 범위 밖에 둡니다.',
        labels: {
          mockOutcome: 'Mock 결과',
          handlingSummary: '처리 요약',
          storedSummary: '저장 요약',
          previewPolicy: '미리보기 정책',
        },
      },
    },
    helpers: {
      openCaptureAction: '캡처 열기 {method} {path}',
      observationSourceLabel: '인바운드 요청 스냅샷',
      storageSummaryWithPreview: '이 저장 캡처는 헤더 {count}개와 관측 및 replay를 위한 제한된 요청 미리보기를 유지합니다.',
      storageSummaryWithoutPreview: '이 저장 캡처는 헤더 {count}개를 유지하며 이 인바운드 캡처에는 요청 본문 미리보기가 없습니다.',
      bodyPreviewPolicyWithPreview: '캡처된 요청 본문 미리보기는 더 깊은 진단 전에 제한된 상태로 유지됩니다.',
      bodyPreviewPolicyWithoutPreview: '이 캡처에는 요청 본문 미리보기가 저장되지 않았습니다.',
      statusSummaryNoResponse: '응답 상태 요약 없음',
      statusSummaryHttp: 'HTTP {statusCode}',
    },
  },
  historyRoute: {
    filters: {
      searchLabel: '히스토리 검색',
      executionOutcomeFilterLabel: '실행 결과 필터',
      listAriaLabel: '히스토리 목록',
    },
    outcomeFilterOptions: {
      all: '모든 실행',
      succeeded: 'Succeeded',
      failed: 'Failed',
      timedOut: 'Timed out',
      cancelled: 'Cancelled',
      blocked: 'Blocked',
    },
    sidebar: {
      eyebrow: '실행 관측',
      title: '히스토리 목록',
      roleChip: '런타임 레인',
      selectedSummary: {
        title: '선택된 실행',
        labels: {
          transportOutcome: '전송 결과',
          tests: '테스트',
          duration: '소요 시간',
          executedAt: '실행 시각',
        },
      },
      health: {
        ready: '히스토리는 런타임 레인에서 저장된 실행 요약을 읽습니다. 행을 선택해 제한된 결과 구성을 확인하거나 Workspace에서 replay draft를 열 수 있습니다.',
        degraded: '히스토리 관측 상태가 저하되었습니다. 런타임 레인이 다시 응답할 때까지 저장된 실행 요약을 불러오지 못할 수 있습니다.',
      },
    },
    empty: {
      loadingList: {
        title: '저장된 실행 히스토리를 불러오는 중',
        description: '런타임 레인에서 최신 실행 요약을 돌려주길 기다리고 있습니다. 저장 목록이 도착하면 필터링은 로컬에서 유지됩니다.',
      },
      degraded: {
        title: '히스토리 관측 상태가 저하되었습니다',
        fallbackDescription: '저장된 실행 요약을 정상적으로 불러오지 못했습니다.',
      },
      noItems: {
        title: '히스토리가 아직 없습니다',
        description: 'Run이 제한된 런타임 요약을 SQLite 히스토리 저장소에 기록하면 아웃바운드 실행이 여기에 표시됩니다.',
      },
      noFilteredItems: {
        title: '필터와 일치하는 히스토리 행이 없습니다',
        description: '검색어 또는 실행 결과 필터를 조정해 저장된 히스토리 행을 다시 표시하세요.',
      },
      loadingDetail: {
        title: '저장된 히스토리 상세를 불러오는 중',
        description: '세부 행을 선택하기 전에 런타임 레인이 최신 실행 목록을 불러오고 있습니다.',
      },
      noSelection: {
        title: '선택된 히스토리가 없습니다',
        description: '실행 행을 선택하면 저장된 요청 스냅샷, 제한된 결과 구성, 압축된 단계 요약을 확인할 수 있습니다. Replay는 히스토리 상세를 바꾸지 않고 별도의 authoring draft를 엽니다.',
      },
      loadingPersistedDetail: {
        title: '저장된 실행 상세를 불러오는 중',
        description: '선택한 실행 상세를 런타임 레인에서 가져오고 있습니다. 로드가 끝나면 결과 구성 탭은 observation-only 상태를 유지합니다.',
      },
      detailDegraded: {
        title: '실행 상세 상태가 저하되었습니다',
        fallbackDescription: '선택한 실행을 정상적으로 불러오지 못했습니다.',
      },
      timelinePlaceholder: {
        title: '압축 타임라인 placeholder',
        description: '저장된 히스토리 행을 선택하면 실행 단계 요약과 유예된 메모가 여기에 표시됩니다.',
      },
    },
    detail: {
      header: {
        eyebrow: '관측 상세',
        title: '히스토리 상세',
        roleChip: '저장된 실행',
      },
      bridge: {
        title: '관측 경계',
        description: '히스토리 상세는 observation-only 상태를 유지합니다. Replay Draft 열기는 이 저장된 실행 레코드를 live authoring state로 바꾸지 않고 새 편집 요청 draft를 만듭니다.',
        openReplayDraft: 'Replay Draft 열기',
        runReplayNow: '지금 Replay 실행',
        readinessNote: '이 slice에서는 지금 Replay 실행이 비활성화됩니다. Replay는 여전히 edit-first 흐름을 유지하며, 저장된 히스토리에는 제한되고 redacted된 요약만 남습니다.',
      },
    },
    summaryCards: {
      executionSummary: {
        title: '실행 요약',
        description: '실행 결과, 전송 결과, 테스트 요약은 서로 다른 vocabulary 계열로 유지됩니다.',
        labels: {
          executionOutcome: '실행 결과',
          transportOutcome: '전송 결과',
          duration: '소요 시간',
          tests: '테스트',
        },
      },
      requestSnapshot: {
        title: '요청 스냅샷',
        description: '히스토리는 현재 Workspace에 열려 있는 live request draft가 아니라, 실행에 사용된 저장된 아웃바운드 요청 스냅샷을 보여줍니다.',
        labels: {
          requestLabel: '요청 라벨',
          snapshotSource: '스냅샷 출처',
          linkedRequest: '연결된 요청',
          placement: '배치 위치',
          url: 'URL',
          requestInput: '요청 입력',
        },
      },
    },
    resultTabs: {
      ariaLabel: '히스토리 결과 탭',
      response: '응답',
      console: '콘솔',
      tests: '테스트',
      executionInfo: '실행 정보',
    },
    resultPanels: {
      response: {
        title: '응답 요약',
        statusCodeNoPersistedCode: '저장된 상태 코드 없음',
        labels: {
          statusCode: '상태 코드',
          duration: '소요 시간',
          previewSize: '미리보기 크기',
          previewPolicy: '미리보기 정책',
          headersSummary: '헤더 요약',
          bodyHint: '본문 힌트',
        },
        boundedDetailTitle: '저장된 응답 상세는 제한된 상태를 유지합니다',
        boundedDetailDescription: '저장된 히스토리는 redacted된 런타임 요약만 보여줍니다. 풍부한 JSON 뷰어, diff, 전체 raw payload 검사는 이후 slice로 유예됩니다.',
      },
      console: {
        title: '콘솔 요약',
        noPersistedSummaryTitle: '저장된 콘솔 요약이 없습니다',
        labels: {
          logLines: '로그 줄 수',
          warnings: '경고',
          postResponseStage: 'Post-response 단계',
          storedSummary: '저장 요약',
          storedSummaryValue: 'Redacted 요약만 제공',
        },
        consolePreviewAriaLabel: '콘솔 미리보기',
      },
      tests: {
        title: '테스트 요약',
        noPersistedSummaryTitle: '저장된 테스트 요약이 없습니다',
        labels: {
          assertions: 'assertion 수',
          passed: '성공',
          failed: '실패',
          testsStage: 'Tests 단계',
        },
        testsPreviewAriaLabel: '테스트 미리보기',
        deferredDetailTitle: 'assertion별 drilldown은 유예되었습니다',
        deferredDetailDescription: '히스토리는 제한된 저장 테스트 요약까지만 제공하며 아직 script 실행 또는 깊은 diagnostics 구성을 추가하지 않습니다.',
      },
      executionInfo: {
        title: '실행 정보',
        description: '실행 메타데이터는 요청 authoring 및 인바운드 캡처 관측 상태와 분리되어 있습니다.',
        noExecutionErrorCode: '실행 오류 코드 없음',
        noExecutionErrorSummary: '보고된 실행 오류가 없습니다.',
        stageSummaryAriaLabel: '실행 단계 요약',
        labels: {
          executionId: '실행 ID',
          started: '시작 시각',
          completed: '완료 시각',
          environment: '환경',
          source: '출처',
          errorCode: '오류 코드',
          errorSummary: '오류 요약',
          requestInput: '요청 입력',
        },
        deferredDetailTitle: '고급 실행 진단은 유예되었습니다',
        deferredDetailDescription: '취소 제어, live stage stream, diff 뷰어는 이 히스토리 관측 slice 범위 밖에 둡니다.',
      },
    },
    timelinePanel: {
      header: {
        eyebrow: '관측 패널',
        title: '실행 단계 요약',
        description: '압축된 저장 단계 요약만 제공합니다. 통합 타임라인, diff 뷰어, 깊은 trace는 범위 밖입니다.',
        roleChip: '단계 요약',
      },
      timelineSummary: {
        title: '압축 타임라인',
        description: '히스토리는 깊은 trace 뷰어로 바뀌지 않고 단계 요약을 압축되고 읽기 쉬운 형태로 유지합니다.',
        ariaLabel: '히스토리 타임라인',
      },
      deferred: {
        title: '유예된 런타임 상세',
        description: '저장된 히스토리 상세는 의도적으로 제한되며, replay는 계속 Workspace로 가는 명시적인 edit-first bridge를 사용합니다.',
        emptyTitle: 'Replay는 edit-first를 기본으로 유지합니다',
        emptyDescription: 'Replay Draft 열기는 히스토리 상세를 편집 가능한 상태로 바꾸지 않고 새 request-builder draft를 만듭니다.',
      },
    },
    helpers: {
      openHistoryAction: '히스토리 열기 {label}',
      previewSizeNone: '저장된 미리보기 없음',
      previewSizeBytes: '{count} B 미리보기',
      placementNone: '저장된 배치 위치 기록 없음',
      bodyModeJson: 'JSON 본문',
      bodyModeText: '텍스트 본문',
      bodyModeForm: '폼 본문',
      bodyModeMultipart: '멀티파트 본문',
      bodyModeNone: '본문 없음',
      authBearer: 'Bearer 인증',
      authBasic: 'Basic 인증',
      authApiKeyQuery: 'query의 API 키',
      authApiKeyHeader: 'header의 API 키',
      authNone: '인증 없음',
      requestInputSummary: '파라미터 {params}개 · 헤더 {headers}개 · {bodyMode} · {auth}',
      linkedRequestNone: '연결된 저장 요청 없음',
      linkedRequestDraftPlacement: 'Draft 저장 위치: {placement}',
      responsePreviewPolicyNone: '이 실행에는 응답 미리보기가 저장되지 않았습니다.',
      responsePreviewPolicyBounded: '저장된 응답 미리보기는 더 깊은 진단 전에 제한되고 redacted된 상태를 유지합니다.',
      stageStatusSkipped: '건너뜀',
    },
  },
  mocksRoute: {
    filters: {
      searchLabel: '규칙 검색',
      stateFilterLabel: '규칙 상태 필터',
      listAriaLabel: '모크 규칙 목록',
      stateOptions: {
        all: '모든 규칙',
        enabled: 'Enabled',
        disabled: 'Disabled',
      },
    },
    sidebar: {
      eyebrow: '규칙 관리',
      title: '모크 규칙',
      description: '저장된 authored rule은 이곳에서 관리합니다. 평가 이후의 런타임 mock outcome은 계속 Captures가 담당합니다.',
      resourceLaneChip: '리소스 레인',
      newRule: '새 규칙',
      selectedSummary: {
        title: '선택된 규칙',
        labels: {
          methodSummary: '메서드 요약',
          pathSummary: '경로 요약',
          responseSummary: '응답 요약',
          fixedDelay: '고정 지연',
        },
      },
    },
    empty: {
      loadingList: {
        title: '저장된 규칙을 불러오는 중',
        description: '이 workspace의 저장된 mock rule을 resource lane에서 돌려주길 기다리고 있습니다.',
      },
      degraded: {
        title: '모크 규칙 상태가 저하되었습니다',
        description: '저장된 규칙 데이터를 정상적으로 새로고치지 못했습니다. {reason}',
      },
      noItems: {
        title: '모크 규칙이 아직 없습니다',
        description: '인바운드 캡처 평가를 위한 matcher와 정적 응답 골격을 저장하려면 규칙을 새로 만드세요.',
      },
      noFilteredItems: {
        title: '필터와 일치하는 규칙이 없습니다',
        description: '검색어 또는 상태 필터를 조정해 저장된 규칙을 다시 표시하세요.',
      },
      loadingDetail: {
        title: '모크 규칙 상세를 불러오는 중',
        description: '상세 행을 선택하기 전에 저장된 규칙 목록을 불러오고 있습니다.',
      },
      noSelection: {
        title: '선택된 모크 규칙이 없습니다',
        description: '저장된 규칙을 선택하거나 새 draft를 시작해 matcher와 정적 응답 필드를 편집하세요.',
      },
      loadingPersistedDetail: {
        title: '저장된 규칙 상세를 불러오는 중',
        description: '편집 가능한 상세를 보여주기 전에 선택한 규칙을 resource lane에서 가져오고 있습니다.',
      },
      detailDegraded: {
        title: '모크 규칙 상세 상태가 저하되었습니다',
        description: '선택한 규칙을 정상적으로 불러오지 못했습니다. {reason}',
      },
    },
    detail: {
      header: {
        draftEyebrow: '새 규칙 draft',
        persistedEyebrow: '저장된 규칙 상세',
        createTitle: '모크 규칙 만들기',
        editTitle: '모크 규칙 편집',
        authoredRuleChip: '작성된 규칙',
      },
      boundary: {
        title: '영속화 경계',
        description: 'Create와 Save는 authored rule 정의만 갱신합니다. 런타임 mock outcome은 계속 Captures에 남습니다.',
        actions: {
          createRule: '규칙 만들기',
          saveRule: '규칙 저장',
          disableRule: '규칙 비활성화',
          enableRule: '규칙 활성화',
          exportingRule: '규칙 내보내는 중',
          exportRule: '규칙 내보내기',
          cancelDraft: 'draft 취소',
          deleteRule: '규칙 삭제',
        },
        fallbackReadiness: '빠른 활성화/비활성화는 저장된 규칙 상태만 갱신합니다. 다른 필드 편집은 여전히 Create 또는 Save가 필요합니다.',
        mutationFailedTitle: '규칙 변경에 실패했습니다',
      },
      summaryCards: {
        rule: {
          title: '규칙 요약',
          description: '여기의 Enabled/Disabled는 authored rule 상태를 뜻하며 런타임 mock outcome이 아닙니다.',
          labels: {
            name: '규칙 이름',
            state: '규칙 상태',
            priority: '우선순위',
            source: '출처',
          },
        },
        evaluation: {
          title: '평가 요약',
          description: '활성 규칙은 우선순위, matcher specificity, 안정적인 tie-breaker 순으로 평가됩니다.',
          labels: {
            matcherSummary: 'Matcher 요약',
            responseSummary: '응답 요약',
            delayHint: '지연 힌트',
          },
        },
      },
      tabs: {
        ariaLabel: '모크 규칙 상세 탭',
        overview: '개요',
        matchers: '매처',
        response: '응답',
        diagnostics: '진단',
      },
      overview: {
        title: '개요',
        description: '이 편집기는 T013 MVP matcher와 정적 응답 surface 안에 머뭅니다.',
        labels: {
          ruleName: '규칙 이름',
          ruleEnabled: '규칙 활성화',
          priority: '우선순위',
          rulePriority: '규칙 우선순위',
          methodMatch: '메서드 매칭',
          httpMethod: 'HTTP 메서드',
          pathMatch: '경로 매칭',
          pathValue: '경로 값',
        },
        placeholders: {
          pathValue: '/webhooks/stripe',
        },
        methodModeOptions: {
          any: '모든 메서드',
          exact: '정확한 메서드',
        },
        pathModeOptions: {
          exact: '정확한 경로',
          prefix: '경로 접두사',
        },
      },
      matchers: {
        labels: {
          operator: '연산자',
          value: '값',
          remove: '삭제',
        },
        operatorOptions: {
          exists: '존재',
          equals: '정확히 일치',
          contains: '포함',
        },
        query: {
          title: '쿼리 매처',
          description: '가벼운 exists, exact, contains 연산자만 사용합니다.',
          addLabel: '쿼리 매처 추가',
          labels: {
            key: '쿼리 매처 키',
          },
          emptyTitle: '쿼리 매처가 없습니다',
          emptyDescription: '가벼운 exists, exact, contains 행만 추가할 수 있습니다. 스크립트 기반 매칭은 아직 유예되어 있습니다.',
        },
        header: {
          title: '헤더 매처',
          description: '헤더 매칭은 exists, exact, contains 연산자로만 제한됩니다.',
          addLabel: '헤더 매처 추가',
          labels: {
            key: '헤더 매처 키',
          },
          emptyTitle: '헤더 매처가 없습니다',
          emptyDescription: '가벼운 exists, exact, contains 행만 추가할 수 있습니다. 스크립트 기반 매칭은 아직 유예되어 있습니다.',
        },
        body: {
          title: '본문 매처',
          description: 'Regex, JSONPath, 스크립트 매처는 아직 유예되어 있습니다.',
          labels: {
            mode: '본문 매처',
            value: '본문 매치 값',
          },
          modeOptions: {
            none: '본문 매처 없음',
            exact: '정확한 본문 텍스트',
            contains: '텍스트 포함',
          },
        },
      },
      response: {
        responseCard: {
          title: '정적 응답',
          description: '정적 상태, 헤더, 본문, 고정 지연이 이 bounded MVP 응답 surface를 구성합니다.',
          labels: {
            status: '응답 상태',
            fixedDelay: '고정 지연 (ms)',
            fixedDelayAria: '고정 지연',
            body: '응답 본문',
          },
        },
        headersCard: {
          title: '응답 헤더',
          description: '이 MVP surface에서는 정적 응답 헤더를 제한되고 예측 가능한 형태로 유지합니다.',
          addLabel: '응답 헤더 추가',
          emptyTitle: '정적 응답 헤더가 없습니다',
          emptyDescription: '모크 응답에 정말 필요할 때만 정적 응답 헤더를 추가하세요.',
          labels: {
            name: '응답 헤더 이름',
            value: '응답 헤더 값',
            remove: '삭제',
          },
        },
      },
      diagnostics: {
        title: '진단 및 유예된 작업',
        description: '규칙은 enabled state, 명시적 우선순위, matcher specificity, 안정적인 tie-breaker 순으로 평가됩니다.',
        labels: {
          deferredNote: '유예 메모',
          source: '출처',
          currentState: '현재 상태',
        },
        values: {
          deferredNote: '스크립트 기반 matcher/response와 고급 scenario state는 아직 유예되어 있습니다.',
        },
        runtimeOutcomes: {
          title: '런타임 outcome은 Captures에 남습니다',
          description: '이 route는 authored rule 정의만 저장합니다. 평가 이후의 Mocked, Bypassed, No rule matched, Blocked outcome은 Captures에서 확인합니다.',
        },
      },
    },
    contextual: {
      empty: {
        title: '관리 메모 placeholder',
        description: '저장된 규칙 진단, authored rule 메모, 평가 guardrail은 규칙을 선택하거나 새 draft를 열면 표시됩니다.',
      },
      header: {
        eyebrow: '컨텍스트 패널',
        title: '관리 메모',
        description: '작성된 mock rule은 런타임 캡처 outcome과 분리된 상태를 유지합니다. 이 패널은 규칙 제약과 평가 순서에 집중합니다.',
        guardrailsChip: '가드레일',
      },
      guardrails: {
        title: '평가 가드레일',
        description: '활성 규칙만 평가됩니다. 우선순위가 먼저 적용되고, 그 다음 matcher specificity, 마지막으로 안정적인 created-at tie-breaker가 적용됩니다.',
        labels: {
          methodSummary: '메서드 요약',
          pathSummary: '경로 요약',
          responseSummary: '응답 요약',
        },
      },
      deferred: {
        title: '유예된 기능',
        description: '스크립트 기반 matcher/response 작성, scenario state, diff, 더 깊은 런타임 trace는 이후 slice 작업으로 남아 있습니다.',
        labels: {
          persistence: '영속화',
          runtimeEvaluation: '런타임 평가',
          captureDiagnostics: '캡처 진단',
        },
        values: {
          persistence: '저장된 JSON 리소스 레인',
          runtimeEvaluation: 'MVP 정적 매칭 및 응답에만 활성화',
          captureDiagnostics: 'outcome 및 매칭된 규칙 요약만 제공',
        },
      },
    },
    helpers: {
      matcherRowExists: '{key} 존재',
      matcherRowContains: '{key}에 {value} 포함',
      matcherRowEquals: '{key}가 {value}와 정확히 일치',
      responseHeadersNone: '정적 응답 헤더 없음',
      responseHeadersCount: '정적 응답 헤더 {count}개',
      methodAny: '메서드: 전체 허용',
      methodExact: '정확한 메서드: {method}',
      pathPrefix: '경로 접두사: {path}',
      pathExact: '정확한 경로: {path}',
      noQueryMatcher: '쿼리 매처 없음',
      noHeaderMatcher: '헤더 매처 없음',
      noBodyMatcher: '본문 매처 없음',
      bodyContains: '본문 포함: {value}',
      bodyExact: '본문 정확히 일치: {value}',
      fixedDelayValue: '고정 지연: {delayMs} ms',
      fixedDelayNone: '고정 지연 없음',
      responseSummary: '정적 {statusCode} 응답.',
      responseSummaryWithDelay: '고정 지연 {delayMs} ms가 포함된 정적 {statusCode} 응답.',
      saveDisabled: {
        saving: '현재 규칙 변경 내용을 저장하는 중입니다.',
        nameRequired: '저장하려면 규칙 이름이 필요합니다.',
        pathRequired: '저장하려면 경로 값이 필요합니다.',
        bodyRequired: '본문 매처를 켠 경우 본문 매치 값이 필요합니다.',
        statusCodeRange: '응답 상태 코드는 100에서 599 사이여야 합니다.',
        fixedDelayRange: '고정 지연은 0에서 2000 ms 사이여야 합니다.',
      },
      quickToggleDisabled: {
        createFirst: '빠른 활성화/비활성화 작업을 쓰기 전에 먼저 규칙을 만들어야 합니다.',
        updating: '저장된 규칙 상태를 갱신하는 중입니다.',
      },
      deleteDisabled: {
        discardDraft: 'draft는 삭제 대신 취소하세요. 저장된 규칙만 삭제할 수 있습니다.',
        deleting: '저장된 규칙을 삭제하는 중입니다.',
      },
      sourceLabels: {
        unsaved: '저장되지 않은 workspace 규칙',
        persisted: '저장된 workspace 규칙',
      },
      exportSuccess: '{name} 규칙을 authored resource lane에서 내보냈습니다. 런타임 mock outcome은 포함되지 않습니다.',
      exportFailure: '번들을 다운로드하기 전에 모크 규칙 내보내기에 실패했습니다.',
      degradedReasonFallback: '저장된 모크 규칙을 정상적으로 불러오지 못했습니다.',
      openRuleAction: '모크 규칙 열기 {name}',
      priorityChip: '우선순위 {priority}',
      untitledRule: '이름 없는 모크 규칙',
      missingPath: '(경로 누락)',
      missingText: '(텍스트 누락)',
    },
  },
} as const;

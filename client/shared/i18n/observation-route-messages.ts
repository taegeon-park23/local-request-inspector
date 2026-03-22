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
} as const;

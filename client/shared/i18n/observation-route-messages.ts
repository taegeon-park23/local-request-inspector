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
} as const;

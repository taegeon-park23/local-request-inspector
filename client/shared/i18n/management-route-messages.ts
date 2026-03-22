export const managementRouteMessagesEn = {
  environmentsRoute: {
    sidebar: {
      eyebrow: 'Environment management',
      title: 'Environment list',
      summary: 'Persisted variables are managed here only. Request execution and environment selection wiring remain deferred.',
      newButton: 'New environment',
      searchLabel: 'Search environments',
      sortLabel: 'Sort environments',
    },
    sortOptions: {
      default: 'Default first',
      name: 'Name',
      updated: 'Recently updated',
    },
    valueTypeOptions: {
      plain: 'Plain text',
      number: 'Number string',
      boolean: 'Boolean string',
      json: 'JSON string',
    },
    empty: {
      loadingList: {
        title: 'Loading environments',
        description: 'Waiting for persisted environment summaries from the resource lane.',
      },
      degraded: {
        title: 'Environment management is degraded',
        fallbackDescription: 'Environment resources could not be loaded cleanly.',
      },
      noItems: {
        title: 'No environments yet',
        description: 'Create the first environment to store workspace-scoped variables and establish the default environment badge.',
      },
      noFilteredItems: {
        title: 'No environments match these filters',
        description: 'Adjust the search text or sort order to bring persisted environment rows back into view.',
      },
      loadingDetail: {
        title: 'Loading environment detail',
        description: 'Environment detail appears after the persisted list is available.',
      },
      noSelection: {
        title: 'No environment selected',
        description: 'Choose a persisted environment or start a new environment draft to edit metadata and variable rows.',
      },
      loadingPersistedDetail: {
        title: 'Loading persisted environment detail',
        description: 'Fetching the selected environment before editable variable rows are shown.',
      },
    },
    list: {
      defaultChip: 'Default',
      varsChip: '{count} vars',
      noDescription: 'No description yet',
    },
    validation: {
      nameRequired: 'Environment name is required before saving.',
      keyRequired: 'Every variable row requires a key before saving.',
      duplicatedKey: 'Variable key "{key}" is duplicated.',
    },
    detail: {
      draftEyebrow: 'New environment draft',
      persistedEyebrow: 'Persisted environment detail',
      createTitle: 'Create environment',
      editTitle: 'Edit environment',
      fallbackSummary: 'Create an environment before runtime resolution is connected elsewhere.',
      enabledChip: '{count} enabled',
      secretChip: '{count} secret',
      defaultChip: 'Default environment',
      management: {
        title: 'Management boundary',
        description: 'Save persists environment metadata and variable rows only.',
        createAction: 'Create environment',
        saveAction: 'Save environment',
        cancelDraft: 'Cancel draft',
        deleteAction: 'Delete environment',
        pendingSave: 'Persisting the environment resource.',
        draftDeleteGuard: 'Discard the draft instead of deleting it. Only persisted environments can be deleted.',
        pendingDelete: 'Deleting the persisted environment.',
        readinessNote: 'Secret rows stay write-only. Save applies replacement or clear operations without echoing secret raw values back into the UI.',
        mutationFailedTitle: 'Environment mutation failed',
        mutationFailedFallbackDescription: 'Environment mutation failed.',
      },
      summaryCard: {
        title: 'Environment summary',
        description: 'Default status stays unique within the workspace resource lane.',
        labels: {
          name: 'Environment name',
          default: 'Default',
          variableCount: 'Variable count',
          enabledVariables: 'Enabled variables',
          secretBackedVariables: 'Secret-backed variables',
        },
        values: {
          untitled: 'Untitled environment',
        },
      },
      secretPolicyCard: {
        title: 'Secret policy',
        description: 'Secret raw values never echo back out of the read model.',
        labels: {
          readModel: 'Read model',
          storedIndicator: 'Stored indicator',
          updatePolicy: 'Update policy',
          runtimeLinkage: 'Runtime linkage',
        },
        values: {
          readModel: 'Masked write-only secret rows',
          storedIndicator: 'hasStoredValue only',
          updatePolicy: 'Replacement value or explicit clear only',
          runtimeLinkage: 'Deferred beyond this route',
        },
      },
      metadataCard: {
        title: 'Environment metadata',
        description: 'Descriptions help operators separate local, staging, and shared defaults before selector wiring arrives.',
        labels: {
          name: 'Environment name',
          defaultEnvironment: 'Default environment',
          description: 'Environment description',
        },
      },
      variablesCard: {
        title: 'Variable rows',
        description: 'Secret rows remain masked, and valueType only documents intended interpretation in this slice.',
        addAction: 'Add variable',
        labels: {
          key: 'Variable key',
          valueType: 'Value type',
          description: 'Description',
          enabled: 'Variable enabled',
          secret: 'Secret variable',
          secretReplacementValue: 'Secret replacement value',
          variableValue: 'Variable value',
        },
        secretStatus: 'Stored secret: {status}',
        secretStatusAvailable: 'available',
        secretStatusEmpty: 'empty',
        clearStoredSecret: 'Clear stored secret',
        removeVariable: 'Remove variable',
      },
      defaultGuidanceCard: {
        title: 'Default environment guidance',
        description: 'One workspace environment remains default whenever at least one environment exists.',
        labels: {
          currentDefaultIntent: 'Current default intent',
          workspaceDefaultCount: 'Workspace default count',
          firstCreateBehavior: 'First-create behavior',
        },
        values: {
          currentDefaultIsThisDraft: 'This draft is marked as default.',
          currentDefaultIsAnother: 'Another environment remains or will remain default.',
          workspaceDefaultCountActive: '1 active default in list view',
          workspaceDefaultCountServer: 'Default is enforced server-side on save',
          firstCreateBehavior: 'The first persisted environment becomes default automatically.',
        },
      },
      secretHandlingCard: {
        title: 'Secret handling',
        description: 'Secret values stay write-only and are never re-hydrated into visible text inputs.',
        empty: {
          title: 'Secret rows remain masked',
          description: 'Read responses expose only hasStoredValue. Save accepts replacementValue or clearStoredValue, and later runtime resolution still stays outside this route.',
        },
      },
    },
  },
  scriptsRoute: {
    sidebar: {
      eyebrow: 'Saved scripts library',
      title: 'Scripts list',
      summary: 'Top-level Scripts manages standalone saved scripts and read-only starter templates. Request-stage attachment remains deferred.',
      newButton: 'New script',
      searchLabel: 'Search scripts',
      stageFilterLabel: 'Stage filter',
    },
    stageFilterOptions: {
      all: 'All stages',
      preRequest: 'Pre-request',
      postResponse: 'Post-response',
      tests: 'Tests',
    },
    empty: {
      loadingList: {
        title: 'Loading saved scripts',
        description: 'Waiting for the persisted script library before a detail row can be selected.',
      },
      degraded: {
        title: 'Scripts library is degraded',
        fallbackDescription: 'Saved scripts could not be loaded cleanly.',
      },
      noItems: {
        title: 'No saved scripts yet',
        description: 'Create a blank script or copy a system template into the standalone library.',
      },
      noFilteredItems: {
        title: 'No saved scripts match these filters',
        description: 'Adjust the search text or stage filter to bring persisted script rows back into view.',
      },
      loadingDetail: {
        title: 'Loading script detail',
        description: 'Saved script detail appears after the persisted list is available.',
      },
      noSelection: {
        title: 'No script selected',
        description: 'Choose a persisted script or start a blank or template draft to edit source code in the standalone library.',
      },
      loadingPersistedDetail: {
        title: 'Loading persisted script detail',
        description: 'Fetching the selected saved script before editable fields are shown.',
      },
      loadingTemplates: {
        title: 'Loading script templates',
        description: 'System starter templates are loading for standalone copy-first authoring.',
      },
      templatesDegraded: {
        title: 'Script templates are degraded',
        fallbackDescription: 'System templates could not be loaded cleanly.',
      },
    },
    list: {
      noDescription: 'No description yet',
      emptySource: 'Empty source',
      templateCopySuffix: 'copy',
      useTemplateAction: 'Use {name}',
    },
    detail: {
      draftEyebrow: 'New script draft',
      persistedEyebrow: 'Persisted script detail',
      createTitle: 'Create saved script',
      editTitle: 'Edit saved script',
      fallbackSummary: 'Saved scripts stay standalone in this route.',
      templateSeededChip: 'Template seeded',
      management: {
        title: 'Management boundary',
        description: 'Save persists standalone scripts only. Request-stage attachment, backlinks, and reference semantics remain deferred.',
        createAction: 'Create script',
        saveAction: 'Save script',
        cancelDraft: 'Cancel draft',
        deleteAction: 'Delete script',
        pendingSave: 'Persisting the saved script resource.',
        nameRequired: 'Script name is required before saving.',
        draftDeleteGuard: 'Discard the draft instead of deleting it. Only persisted scripts can be deleted.',
        pendingDelete: 'Deleting the persisted script.',
        readinessNote: 'Templates can seed a new saved script, but template CRUD, request linking, and Monaco-class editing remain deferred.',
        mutationFailedTitle: 'Script mutation failed',
        mutationFailedFallbackDescription: 'Script mutation failed.',
      },
      summaryCard: {
        title: 'Script summary',
        description: 'Saved scripts are workspace-scoped resources rather than runtime history artifacts.',
        labels: {
          name: 'Script name',
          type: 'Script type',
          templateSource: 'Template source',
          sourceLength: 'Source length',
        },
        values: {
          untitled: 'Untitled script',
          directAuthoring: 'Blank draft or direct authoring',
          sourceLength: '{count} characters',
        },
      },
      capabilityCard: {
        title: 'Capability guidance',
        description: 'Each stage keeps its existing bounded runtime semantics.',
        labels: {
          currentStage: 'Current stage',
          capabilitySummary: 'Capability summary',
          deferredNote: 'Deferred note',
        },
        values: {
          capabilitySummaryFallback: 'Stage capability guidance appears here.',
          deferredNoteFallback: 'Attachment, backlinks, and live reference behavior remain deferred.',
        },
      },
      editorCard: {
        title: 'Saved script editor',
        description: 'Textarea-based editing remains intentionally lightweight in this MVP.',
        labels: {
          name: 'Script name',
          stage: 'Script stage',
          description: 'Script description',
          source: 'Script source',
        },
      },
    },
  },
} as const;

type RouteCatalogShape<T> = {
  [K in keyof T]: T[K] extends string ? string : RouteCatalogShape<T[K]>;
};

export const managementRouteMessagesKo: RouteCatalogShape<typeof managementRouteMessagesEn> = {
  environmentsRoute: {
    sidebar: {
      eyebrow: '환경 관리',
      title: '환경 목록',
      summary: '여기서는 저장된 변수만 관리합니다. 요청 실행과 환경 선택 연결은 아직 유예된 범위입니다.',
      newButton: '새 환경',
      searchLabel: '환경 검색',
      sortLabel: '환경 정렬',
    },
    sortOptions: {
      default: '기본 우선',
      name: '이름순',
      updated: '최근 수정순',
    },
    valueTypeOptions: {
      plain: '일반 텍스트',
      number: '숫자 문자열',
      boolean: '불리언 문자열',
      json: 'JSON 문자열',
    },
    empty: {
      loadingList: {
        title: '환경을 불러오는 중',
        description: '리소스 레인에서 저장된 환경 요약을 기다리고 있습니다.',
      },
      degraded: {
        title: '환경 관리 상태가 저하되었습니다',
        fallbackDescription: '환경 리소스를 정상적으로 불러오지 못했습니다.',
      },
      noItems: {
        title: '아직 환경이 없습니다',
        description: '첫 번째 환경을 만들어 workspace 범위 변수를 저장하고 기본 환경 배지를 설정하세요.',
      },
      noFilteredItems: {
        title: '필터와 일치하는 환경이 없습니다',
        description: '검색어나 정렬 기준을 조정해 저장된 환경 행을 다시 표시하세요.',
      },
      loadingDetail: {
        title: '환경 상세를 불러오는 중',
        description: '저장된 목록이 준비되면 환경 상세가 표시됩니다.',
      },
      noSelection: {
        title: '선택된 환경이 없습니다',
        description: '저장된 환경을 선택하거나 새 환경 draft를 시작해 메타데이터와 변수 행을 편집하세요.',
      },
      loadingPersistedDetail: {
        title: '저장된 환경 상세를 불러오는 중',
        description: '선택한 환경을 가져온 뒤 편집 가능한 변수 행을 표시합니다.',
      },
    },
    list: {
      defaultChip: '기본',
      varsChip: '{count}개 변수',
      noDescription: '설명이 아직 없습니다',
    },
    validation: {
      nameRequired: '저장하기 전에 환경 이름이 필요합니다.',
      keyRequired: '모든 변수 행에는 저장 전에 key가 필요합니다.',
      duplicatedKey: '변수 key "{key}"가 중복되었습니다.',
    },
    detail: {
      draftEyebrow: '새 환경 draft',
      persistedEyebrow: '저장된 환경 상세',
      createTitle: '환경 만들기',
      editTitle: '환경 편집',
      fallbackSummary: '다른 곳에서 runtime resolution을 연결하기 전에 먼저 환경을 만드세요.',
      enabledChip: '{count}개 사용 중',
      secretChip: '{count}개 secret',
      defaultChip: '기본 환경',
      management: {
        title: '관리 경계',
        description: 'Save는 환경 메타데이터와 변수 행만 저장합니다.',
        createAction: '환경 만들기',
        saveAction: '환경 저장',
        cancelDraft: 'draft 취소',
        deleteAction: '환경 삭제',
        pendingSave: '환경 리소스를 저장하고 있습니다.',
        draftDeleteGuard: 'draft는 삭제 대신 취소하세요. 삭제는 저장된 환경에만 적용됩니다.',
        pendingDelete: '저장된 환경을 삭제하고 있습니다.',
        readinessNote: 'secret 행은 write-only로 유지됩니다. Save는 secret raw value를 다시 표시하지 않고 replacement나 clear만 적용합니다.',
        mutationFailedTitle: '환경 변경에 실패했습니다',
        mutationFailedFallbackDescription: '환경 변경에 실패했습니다.',
      },
      summaryCard: {
        title: '환경 요약',
        description: '기본 상태는 workspace 리소스 레인 안에서 하나만 유지됩니다.',
        labels: {
          name: '환경 이름',
          default: '기본 여부',
          variableCount: '변수 수',
          enabledVariables: '활성 변수',
          secretBackedVariables: 'secret 기반 변수',
        },
        values: {
          untitled: '이름 없는 환경',
        },
      },
      secretPolicyCard: {
        title: 'Secret 정책',
        description: 'secret raw value는 read model에서 다시 노출되지 않습니다.',
        labels: {
          readModel: '읽기 모델',
          storedIndicator: '저장 표시',
          updatePolicy: '업데이트 정책',
          runtimeLinkage: '런타임 연결',
        },
        values: {
          readModel: '마스킹된 write-only secret 행',
          storedIndicator: 'hasStoredValue만 사용',
          updatePolicy: 'replacement 값 또는 명시적 clear만 허용',
          runtimeLinkage: '이 route 밖에서 나중에 처리',
        },
      },
      metadataCard: {
        title: '환경 메타데이터',
        description: 'selector wiring이 들어오기 전에도 설명을 통해 local, staging, shared default를 구분할 수 있습니다.',
        labels: {
          name: '환경 이름',
          defaultEnvironment: '기본 환경',
          description: '환경 설명',
        },
      },
      variablesCard: {
        title: '변수 행',
        description: 'secret 행은 계속 마스킹되며, valueType은 이 slice에서 의도된 해석만 문서화합니다.',
        addAction: '변수 추가',
        labels: {
          key: '변수 key',
          valueType: '값 타입',
          description: '설명',
          enabled: '변수 활성화',
          secret: 'Secret 변수',
          secretReplacementValue: 'Secret replacement 값',
          variableValue: '변수 값',
        },
        secretStatus: '저장된 secret: {status}',
        secretStatusAvailable: '있음',
        secretStatusEmpty: '없음',
        clearStoredSecret: '저장된 secret 지우기',
        removeVariable: '변수 제거',
      },
      defaultGuidanceCard: {
        title: '기본 환경 가이드',
        description: 'workspace에 환경이 하나 이상 있으면 항상 하나는 기본 환경으로 유지됩니다.',
        labels: {
          currentDefaultIntent: '현재 기본 설정 의도',
          workspaceDefaultCount: 'Workspace 기본 개수',
          firstCreateBehavior: '첫 생성 동작',
        },
        values: {
          currentDefaultIsThisDraft: '이 draft가 기본 환경으로 표시됩니다.',
          currentDefaultIsAnother: '다른 환경이 기본 상태로 유지되거나 유지될 예정입니다.',
          workspaceDefaultCountActive: '목록에 활성 기본 환경 1개',
          workspaceDefaultCountServer: '기본 환경은 save 시 서버에서 강제됩니다',
          firstCreateBehavior: '처음 저장되는 환경은 자동으로 기본 환경이 됩니다.',
        },
      },
      secretHandlingCard: {
        title: 'Secret 처리',
        description: 'secret 값은 write-only로 유지되며 보이는 텍스트 입력으로 다시 hydrate되지 않습니다.',
        empty: {
          title: 'Secret 행은 계속 마스킹됩니다',
          description: 'read 응답은 hasStoredValue만 노출합니다. Save는 replacementValue 또는 clearStoredValue를 받고, 이후 runtime resolution도 여전히 이 route 밖에 남아 있습니다.',
        },
      },
    },
  },
  scriptsRoute: {
    sidebar: {
      eyebrow: '저장된 스크립트 라이브러리',
      title: '스크립트 목록',
      summary: 'Top-level Scripts는 독립 저장 스크립트와 읽기 전용 starter template를 관리합니다. request-stage attachment는 아직 유예되어 있습니다.',
      newButton: '새 스크립트',
      searchLabel: '스크립트 검색',
      stageFilterLabel: '단계 필터',
    },
    stageFilterOptions: {
      all: '모든 단계',
      preRequest: '사전 요청',
      postResponse: '응답 후',
      tests: '테스트',
    },
    empty: {
      loadingList: {
        title: '저장된 스크립트를 불러오는 중',
        description: '상세 행을 선택하기 전에 저장된 스크립트 라이브러리를 기다리고 있습니다.',
      },
      degraded: {
        title: '스크립트 라이브러리 상태가 저하되었습니다',
        fallbackDescription: '저장된 스크립트를 정상적으로 불러오지 못했습니다.',
      },
      noItems: {
        title: '아직 저장된 스크립트가 없습니다',
        description: '빈 스크립트를 만들거나 system template를 복사해 독립 라이브러리에 추가하세요.',
      },
      noFilteredItems: {
        title: '필터와 일치하는 저장 스크립트가 없습니다',
        description: '검색어나 단계 필터를 조정해 저장된 스크립트 행을 다시 표시하세요.',
      },
      loadingDetail: {
        title: '스크립트 상세를 불러오는 중',
        description: '저장된 목록이 준비되면 스크립트 상세가 표시됩니다.',
      },
      noSelection: {
        title: '선택된 스크립트가 없습니다',
        description: '저장된 스크립트를 선택하거나 빈 draft 또는 template draft를 시작해 독립 라이브러리에서 소스 코드를 편집하세요.',
      },
      loadingPersistedDetail: {
        title: '저장된 스크립트 상세를 불러오는 중',
        description: '선택한 저장 스크립트를 가져온 뒤 편집 가능한 필드를 표시합니다.',
      },
      loadingTemplates: {
        title: '스크립트 템플릿을 불러오는 중',
        description: '독립 copy-first 작성에 쓰이는 system starter template를 불러오고 있습니다.',
      },
      templatesDegraded: {
        title: '스크립트 템플릿 상태가 저하되었습니다',
        fallbackDescription: 'system template를 정상적으로 불러오지 못했습니다.',
      },
    },
    list: {
      noDescription: '설명이 아직 없습니다',
      emptySource: '소스가 비어 있습니다',
      templateCopySuffix: '복사본',
      useTemplateAction: '{name} 사용',
    },
    detail: {
      draftEyebrow: '새 스크립트 draft',
      persistedEyebrow: '저장된 스크립트 상세',
      createTitle: '저장 스크립트 만들기',
      editTitle: '저장 스크립트 편집',
      fallbackSummary: '저장된 스크립트는 이 route에서 독립적으로 유지됩니다.',
      templateSeededChip: '템플릿 기반',
      management: {
        title: '관리 경계',
        description: 'Save는 독립 스크립트만 저장합니다. request-stage attachment, backlink, reference semantics는 여전히 유예된 범위입니다.',
        createAction: '스크립트 만들기',
        saveAction: '스크립트 저장',
        cancelDraft: 'draft 취소',
        deleteAction: '스크립트 삭제',
        pendingSave: '저장된 스크립트 리소스를 저장하고 있습니다.',
        nameRequired: '저장하기 전에 스크립트 이름이 필요합니다.',
        draftDeleteGuard: 'draft는 삭제 대신 취소하세요. 삭제는 저장된 스크립트에만 적용됩니다.',
        pendingDelete: '저장된 스크립트를 삭제하고 있습니다.',
        readinessNote: '템플릿은 새 저장 스크립트의 시작점을 제공할 수 있지만, template CRUD, request linking, Monaco급 편집기는 여전히 유예된 범위입니다.',
        mutationFailedTitle: '스크립트 변경에 실패했습니다',
        mutationFailedFallbackDescription: '스크립트 변경에 실패했습니다.',
      },
      summaryCard: {
        title: '스크립트 요약',
        description: '저장된 스크립트는 runtime history artifact가 아니라 workspace 범위 리소스입니다.',
        labels: {
          name: '스크립트 이름',
          type: '스크립트 타입',
          templateSource: '템플릿 출처',
          sourceLength: '소스 길이',
        },
        values: {
          untitled: '이름 없는 스크립트',
          directAuthoring: '빈 draft 또는 직접 작성',
          sourceLength: '{count}자',
        },
      },
      capabilityCard: {
        title: 'Capability 가이드',
        description: '각 단계는 기존의 bounded runtime semantics를 그대로 유지합니다.',
        labels: {
          currentStage: '현재 단계',
          capabilitySummary: 'Capability 요약',
          deferredNote: '유예 메모',
        },
        values: {
          capabilitySummaryFallback: '여기에 단계별 capability 가이드가 표시됩니다.',
          deferredNoteFallback: 'attachment, backlink, live reference 동작은 계속 유예됩니다.',
        },
      },
      editorCard: {
        title: '저장 스크립트 편집기',
        description: '이 MVP에서는 textarea 기반 편집을 의도적으로 가볍게 유지합니다.',
        labels: {
          name: '스크립트 이름',
          stage: '스크립트 단계',
          description: '스크립트 설명',
          source: '스크립트 소스',
        },
      },
    },
  },
} as const;

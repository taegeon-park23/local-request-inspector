import { managementRouteMessagesEn, managementRouteMessagesKo } from '@client/shared/i18n/management-route-messages';

export const supportedLocales = ['en', 'ko'] as const;

export type LocaleCode = (typeof supportedLocales)[number];
export type MessageValues = Record<string, string | number>;

export const fallbackLocale: LocaleCode = 'en';
export const localeStorageKey = 'local-request-inspector.locale';

const enCatalog = {
  common: {
    locales: {
      en: 'English',
      ko: '한국어',
    },
    values: {
      yes: 'Yes',
      no: 'No',
      ready: 'Ready',
      notReady: 'Not ready',
      present: 'Present',
      missing: 'Missing',
    },
    copy: {
      copied: '{label} copied.',
      unavailable: '{label} is visible but clipboard access is unavailable in this environment.',
    },
  },
  shell: {
    breadcrumb: {
      root: 'Workbench',
    },
    status: {
      runtimeConnection: 'Runtime Connection',
    },
  },
  roles: {
    authoring: 'Authoring',
    observation: 'Observation',
    management: 'Management',
    placeholder: 'Placeholder',
  },
  shared: {
    sectionHeading: {
      eyebrow: 'Top-level section',
    },
  },
  sections: {
    workspace: {
      label: 'Workspace',
      breadcrumb: 'Workspace',
      summary: 'Request authoring, saved definitions, and active result observation.',
    },
    captures: {
      label: 'Captures',
      breadcrumb: 'Captures',
      summary: 'Inbound request observation with replay bridge and bounded handling detail.',
    },
    history: {
      label: 'History',
      breadcrumb: 'History',
      summary: 'Persisted execution observation with response, console, tests, and stage summary.',
    },
    mocks: {
      label: 'Mocks',
      breadcrumb: 'Mocks',
      summary: 'Persisted mock rule management with bounded matcher and static response editing.',
    },
    environments: {
      label: 'Environments',
      breadcrumb: 'Environments',
      summary: 'Persisted environment and secret management with default-environment guardrails.',
    },
    scripts: {
      label: 'Scripts',
      breadcrumb: 'Scripts',
      summary: 'Standalone saved script library with read-only starter templates.',
    },
    settings: {
      label: 'Settings',
      breadcrumb: 'Settings',
      summary: 'Read-only diagnostics hub for app shell, storage, and local command guidance.',
    },
  },
  routes: {
    workspace: {
      title: 'Workspace',
      contextChip: 'Resource lane',
      summary:
        'Workspace remains the authoring surface for saved requests, starter request drafts, replay drafts, and the lazy-loaded Scripts path. Save updates request definitions, while Run writes observation only into the right-hand result surface.',
    },
    captures: {
      title: 'Captures',
      contextChip: 'Replay bridge',
      summary:
        'Captures is an observation route for inbound traffic. It reads persisted capture summaries from the runtime lane and keeps replay as an explicit edit-first bridge into Workspace.',
    },
    history: {
      title: 'History',
      contextChip: 'Persisted execution',
      summary:
        'History is an observation route for persisted outbound executions. It reads redacted runtime summaries from SQLite without reusing active request-tab result state.',
    },
    mocks: {
      title: 'Mocks',
      contextChip: 'Authored rules',
      summary:
        'Mocks is the authored rule management route. It persists matcher and response definitions while captures shows runtime outcomes after evaluation.',
    },
    environments: {
      title: 'Environments',
      summary:
        'Environments persist workspace-scoped variables and secret placeholders only. Runtime resolution and request binding remain deferred.',
    },
    scripts: {
      title: 'Scripts',
      summary:
        'Scripts stores standalone saved stage snippets and read-only system templates. Request-bound attachment and live shared references remain outside this slice.',
    },
    settings: {
      title: 'Settings',
      summary:
        'Settings is intentionally read-only in this MVP. It surfaces diagnostics and route hints instead of introducing persisted preferences before ownership is clear.',
    },
  },
  settings: {
    sidebar: {
      eyebrow: 'Diagnostics-first settings',
      title: 'Runtime status',
      summary:
        'Settings stays read-only in this MVP and acts as a diagnostics hub for shell availability, storage readiness, and local command guidance.',
    },
    loadingRuntimeDiagnostics: {
      title: 'Loading runtime diagnostics',
      description: 'Waiting for app-shell and storage readiness status from the server.',
    },
    diagnosticsDegraded: {
      title: 'Diagnostics are degraded',
      fallbackDescription: 'Runtime diagnostics could not be loaded cleanly.',
    },
    page: {
      title: 'Settings',
      summary:
        'Settings is intentionally read-only in this MVP. It surfaces diagnostics and route hints instead of introducing persisted preferences before ownership is clear.',
    },
    cards: {
      connectionHealth: {
        title: 'Connection health',
        description:
          'Connection health still comes from the shell store so route diagnostics stay separate from runtime event transport state.',
        labels: {
          runtimeConnection: 'Runtime connection',
          appShellRoute: 'App shell route',
          storageReady: 'Storage ready',
        },
      },
      appShellAvailability: {
        title: 'App shell availability',
        description: 'The built shell route and Vite authoring route remain explicitly visible here.',
        labels: {
          builtShellAvailable: 'Built shell available',
          builtShellRoute: 'Built shell route',
          devClient: 'Dev client',
          note: 'Note',
        },
      },
      storageReadiness: {
        title: 'Storage readiness',
        description: 'Storage bootstrap remains separate from route-level preference persistence.',
        labels: {
          storageReady: 'Storage ready',
          versionManifest: 'Version manifest',
          resourceManifest: 'Resource manifest',
          runtimeDatabase: 'Runtime database',
        },
      },
      runtimeConnectionHealth: {
        title: 'Runtime connection health',
        description: 'This card combines server diagnostics with the live shell-store connection badge.',
        labels: {
          connectionState: 'Connection state',
          serveCommand: 'Serve command',
          devCommand: 'Dev command',
        },
      },
      localCommandCatalog: {
        title: 'Local command catalog',
        description: 'Commands are visible here so local verification and bootstrap work can be handed off cleanly.',
        copyAction: 'Copy command',
      },
      dataPathAndRouteHints: {
        title: 'Data path and route hints',
        description:
          'Paths and routes stay visible for diagnosis without turning settings into a mutation-heavy control panel.',
        copyAction: 'Copy path',
      },
      interfaceLanguage: {
        title: 'Interface language',
        description:
          'Locale selection persists locally and acts as the QA switch for later translation slices.',
        labels: {
          currentLocale: 'Current locale',
          fallbackLocale: 'Fallback locale',
          persistence: 'Persistence',
          coverage: 'First-slice coverage',
        },
        values: {
          persistence: 'Browser local storage',
          coverage: 'Shell chrome, section headers, and settings diagnostics copy',
        },
        helper:
          'English remains the fallback catalog. Korean is the first translated locale and should be used as the pattern for later surface-by-surface rollout.',
      },
      storagePaths: {
        title: 'Storage paths',
        description: 'These paths help operators confirm bootstrap state without adding mutation controls here.',
        labels: {
          dataRoot: 'Data root',
          versionManifest: 'Version manifest',
          resourceManifest: 'Resource manifest',
          runtimeDatabase: 'Runtime database',
        },
      },
      scopeBoundary: {
        title: 'Scope boundary',
        description:
          'This route deliberately avoids persisted settings mutation until ownership and preference shape are clearer.',
      },
    },
    empty: {
      loadingSettingsDiagnostics: {
        title: 'Loading settings diagnostics',
        description: 'Cards appear after app-shell and storage diagnostics return from the server.',
      },
      settingsDiagnosticsDegraded: {
        title: 'Settings diagnostics are degraded',
        fallbackDescription: 'Runtime diagnostics could not be loaded cleanly.',
      },
      readOnlyByDesign: {
        title: 'Read-only by design',
        description:
          'Use {environmentsLabel} for variable management and {scriptsLabel} for standalone script management. Settings currently aggregates diagnostics, command guidance, and route hints only.',
      },
      noDiagnosticsLoadedYet: {
        title: 'No diagnostics loaded yet',
        description: 'Route and path notes appear once runtime diagnostics are available.',
      },
    },
  },
  ...managementRouteMessagesEn,
} as const;

type CatalogShape<T> = {
  [K in keyof T]: T[K] extends string ? string : CatalogShape<T[K]>;
};

const koCatalog: CatalogShape<typeof enCatalog> = {
  common: {
    locales: {
      en: 'English',
      ko: '한국어',
    },
    values: {
      yes: '예',
      no: '아니오',
      ready: '준비됨',
      notReady: '준비되지 않음',
      present: '있음',
      missing: '없음',
    },
    copy: {
      copied: '{label} 항목을 복사했습니다.',
      unavailable: '{label} 항목은 표시되지만 현재 환경에서는 클립보드를 사용할 수 없습니다.',
    },
  },
  shell: {
    breadcrumb: {
      root: '워크벤치',
    },
    status: {
      runtimeConnection: '런타임 연결',
    },
  },
  roles: {
    authoring: '작성',
    observation: '관측',
    management: '관리',
    placeholder: '임시 영역',
  },
  shared: {
    sectionHeading: {
      eyebrow: '최상위 섹션',
    },
  },
  sections: {
    workspace: {
      label: '작업공간',
      breadcrumb: '작업공간',
      summary: '요청 작성, 저장된 정의 관리, 활성 결과 관측을 한 곳에서 처리합니다.',
    },
    captures: {
      label: '캡처',
      breadcrumb: '캡처',
      summary: '인바운드 요청 관측과 replay bridge 기반의 edit-first 흐름을 제공합니다.',
    },
    history: {
      label: '히스토리',
      breadcrumb: '히스토리',
      summary: '저장된 실행 이력에서 응답, 콘솔, 테스트, 단계 요약을 확인합니다.',
    },
    mocks: {
      label: '모크',
      breadcrumb: '모크',
      summary: '저장된 mock rule을 관리하고 matcher와 정적 응답을 편집합니다.',
    },
    environments: {
      label: '환경',
      breadcrumb: '환경',
      summary: '기본 환경 규칙과 함께 저장된 환경 변수 및 secret placeholder를 관리합니다.',
    },
    scripts: {
      label: '스크립트',
      breadcrumb: '스크립트',
      summary: '독립 저장 스크립트 라이브러리와 읽기 전용 starter template를 관리합니다.',
    },
    settings: {
      label: '설정',
      breadcrumb: '설정',
      summary: '앱 shell, storage, 로컬 명령 가이드를 위한 읽기 전용 진단 허브입니다.',
    },
  },
  routes: {
    workspace: {
      title: '작업공간',
      contextChip: '리소스 레인',
      summary:
        '작업공간은 저장된 요청, 새 요청 draft, replay draft, 지연 로드되는 Scripts 경로를 위한 작성 surface입니다. Save는 요청 정의를 갱신하고, Run은 오른쪽 결과 surface에만 관측 결과를 기록합니다.',
    },
    captures: {
      title: '캡처',
      contextChip: '리플레이 브리지',
      summary:
        '캡처는 인바운드 트래픽을 위한 관측 route입니다. runtime lane의 저장된 캡처 요약을 읽고, replay는 작업공간으로 이어지는 edit-first bridge로 유지합니다.',
    },
    history: {
      title: '히스토리',
      contextChip: '저장된 실행',
      summary:
        '히스토리는 저장된 아웃바운드 실행을 위한 관측 route입니다. active request-tab 결과 상태를 재사용하지 않고 SQLite의 redacted runtime summary를 읽습니다.',
    },
    mocks: {
      title: '모크',
      contextChip: '작성된 규칙',
      summary:
        '목은 작성된 rule 관리 route입니다. matcher와 response 정의를 저장하고, 캡처는 평가 이후의 runtime outcome을 표시합니다.',
    },
    environments: {
      title: '환경',
      summary:
        '환경은 workspace 범위 변수와 secret placeholder만 저장합니다. runtime resolution과 request binding은 아직 유예된 범위입니다.',
    },
    scripts: {
      title: '스크립트',
      summary:
        '스크립트는 독립 저장 stage snippet과 읽기 전용 system template를 보관합니다. request-bound attachment와 live shared reference는 이 범위 밖에 있습니다.',
    },
    settings: {
      title: '설정',
      summary:
        '설정은 이 MVP에서 의도적으로 읽기 전용입니다. ownership이 명확해지기 전까지 persisted preference 대신 diagnostics와 route hint를 보여줍니다.',
    },
  },
  settings: {
    sidebar: {
      eyebrow: '진단 중심 설정',
      title: '런타임 상태',
      summary:
        '설정은 이 MVP에서 읽기 전용으로 유지되며, shell 가용성, storage 준비 상태, 로컬 명령 가이드를 위한 진단 허브 역할을 합니다.',
    },
    loadingRuntimeDiagnostics: {
      title: '런타임 진단을 불러오는 중',
      description: '서버에서 app-shell 및 storage 준비 상태를 기다리고 있습니다.',
    },
    diagnosticsDegraded: {
      title: '진단 상태가 저하되었습니다',
      fallbackDescription: '런타임 진단을 정상적으로 불러오지 못했습니다.',
    },
    page: {
      title: '설정',
      summary:
        '설정은 이 MVP에서 의도적으로 읽기 전용입니다. ownership이 명확해지기 전까지 persisted preference 대신 diagnostics와 route hint를 보여줍니다.',
    },
    cards: {
      connectionHealth: {
        title: '연결 상태',
        description:
          '연결 상태는 여전히 shell store에서 오므로, route diagnostics가 runtime event transport 상태와 섞이지 않습니다.',
        labels: {
          runtimeConnection: '런타임 연결',
          appShellRoute: '앱 shell 경로',
          storageReady: '스토리지 준비 상태',
        },
      },
      appShellAvailability: {
        title: '앱 shell 가용성',
        description: '빌드된 shell 경로와 Vite authoring 경로를 여기서 명시적으로 확인할 수 있습니다.',
        labels: {
          builtShellAvailable: '빌드된 shell 사용 가능',
          builtShellRoute: '빌드된 shell 경로',
          devClient: '개발 클라이언트',
          note: '메모',
        },
      },
      storageReadiness: {
        title: '스토리지 준비 상태',
        description: 'storage bootstrap은 route-level preference persistence와 분리되어 유지됩니다.',
        labels: {
          storageReady: '스토리지 준비 상태',
          versionManifest: '버전 매니페스트',
          resourceManifest: '리소스 매니페스트',
          runtimeDatabase: '런타임 데이터베이스',
        },
      },
      runtimeConnectionHealth: {
        title: '런타임 연결 상태',
        description: '이 카드는 서버 진단과 live shell-store 연결 배지를 함께 보여줍니다.',
        labels: {
          connectionState: '연결 상태',
          serveCommand: 'Serve 명령',
          devCommand: '개발 명령',
        },
      },
      localCommandCatalog: {
        title: '로컬 명령 카탈로그',
        description: '로컬 검증과 bootstrap 작업을 명확히 handoff할 수 있도록 명령을 여기서 노출합니다.',
        copyAction: '명령 복사',
      },
      dataPathAndRouteHints: {
        title: '데이터 경로 및 라우트 힌트',
        description:
          '설정을 mutation-heavy 제어판으로 만들지 않으면서도 진단에 필요한 경로와 라우트를 보여줍니다.',
        copyAction: '경로 복사',
      },
      interfaceLanguage: {
        title: '인터페이스 언어',
        description:
          '언어 선택은 로컬에 저장되며, 이후 번역 작업을 검증하는 QA 스위치 역할도 합니다.',
        labels: {
          currentLocale: '현재 로케일',
          fallbackLocale: '기본 로케일',
          persistence: '저장 위치',
          coverage: '1차 적용 범위',
        },
        values: {
          persistence: '브라우저 로컬 스토리지',
          coverage: 'shell chrome, 섹션 헤더, 설정 진단 문구',
        },
        helper:
          'English 카탈로그는 fallback으로 유지됩니다. 한국어는 첫 번째 번역 로케일이며, 이후 surface-by-surface 확장의 기준 패턴으로 사용해야 합니다.',
      },
      storagePaths: {
        title: '스토리지 경로',
        description: '이 경로들은 여기서 mutation control을 추가하지 않고도 bootstrap 상태를 점검하는 데 도움을 줍니다.',
        labels: {
          dataRoot: '데이터 루트',
          versionManifest: '버전 매니페스트',
          resourceManifest: '리소스 매니페스트',
          runtimeDatabase: '런타임 데이터베이스',
        },
      },
      scopeBoundary: {
        title: '범위 경계',
        description:
          '이 route는 ownership과 preference shape가 더 명확해질 때까지 persisted settings mutation을 의도적으로 보류합니다.',
      },
    },
    empty: {
      loadingSettingsDiagnostics: {
        title: '설정 진단을 불러오는 중',
        description: 'app-shell 및 storage diagnostics가 반환되면 카드가 표시됩니다.',
      },
      settingsDiagnosticsDegraded: {
        title: '설정 진단 상태가 저하되었습니다',
        fallbackDescription: '런타임 진단을 정상적으로 불러오지 못했습니다.',
      },
      readOnlyByDesign: {
        title: '의도된 읽기 전용',
        description:
          '{environmentsLabel}에서는 변수 관리를, {scriptsLabel}에서는 독립 스크립트 관리를 수행하세요. 현재 설정은 diagnostics, 명령 가이드, route hint만 집계합니다.',
      },
      noDiagnosticsLoadedYet: {
        title: '아직 진단이 없습니다',
        description: '런타임 진단이 준비되면 경로와 route 정보가 표시됩니다.',
      },
    },
  },
  ...managementRouteMessagesKo,
};

type StringLeafKeys<T> = {
  [K in Extract<keyof T, string>]: T[K] extends string
    ? K
    : T[K] extends Record<string, unknown>
      ? `${K}.${StringLeafKeys<T[K]>}`
      : never;
}[Extract<keyof T, string>];

export type MessageKey = StringLeafKeys<typeof enCatalog>;

type MessageCatalog = CatalogShape<typeof enCatalog>;

export const localeMessages: Record<LocaleCode, MessageCatalog> = {
  en: enCatalog,
  ko: koCatalog,
};

export function isLocaleCode(value: string): value is LocaleCode {
  return supportedLocales.includes(value as LocaleCode);
}

function readCatalogValue(catalog: MessageCatalog, key: MessageKey) {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, catalog);
}

export function resolveMessageTemplate(locale: LocaleCode, key: MessageKey) {
  const localizedValue = readCatalogValue(localeMessages[locale], key);
  if (typeof localizedValue === 'string') {
    return localizedValue;
  }
  const fallbackValue = readCatalogValue(localeMessages[fallbackLocale], key);
  if (typeof fallbackValue === 'string') {
    return fallbackValue;
  }
  return key;
}

export function formatMessage(template: string, values?: MessageValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (token, key) => {
    const value = values[key];
    return value === undefined ? token : String(value);
  });
}

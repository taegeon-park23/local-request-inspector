export const workspaceRouteMessagesEn = {
  workspaceRoute: {
    explorer: {
      header: {
        eyebrow: 'Workspace explorer',
        title: 'Collections',
        summary:
          'Persisted collections, nested request groups, and saved requests stay visible here. Explorer actions handle preview, pin, create, run, rename, and delete without leaving the tree.',
        authoringChip: 'Authoring',
        resourceLaneChip: 'Resource lane',
      },
      actions: {
        newRequest: 'New Request',
        exportResources: 'Export Resources',
        exportingResources: 'Exporting resources',
        importResources: 'Import Resources',
        importResourcesInput: 'Import authored resources',
        previewingImport: 'Previewing import',
        importingResources: 'Importing resources',
        confirmImport: 'Confirm Import',
        cancelPreview: 'Cancel Preview',
        exportSingle: 'Export',
        openRequest: 'Open {name}',
        exportRequest: 'Export {name}',
        deleteRequest: 'Delete {name}',
        deleteRequestShort: 'Delete',
        createCollection: 'Create collection',
        createCollectionShort: 'New collection',
        renameCollection: 'Rename collection {name}',
        renameCollectionShort: 'Rename',
        deleteCollection: 'Delete collection {name}',
        deleteCollectionShort: 'Delete',
        createRequestGroup: 'Create request group in {name}',
        createRequestGroupShort: 'New group',
        runContainerShort: 'Run',
        runSelected: 'Run Selected',
        renameRequestGroup: 'Rename request group {name}',
        renameRequestGroupShort: 'Rename',
        deleteRequestGroup: 'Delete request group {name}',
        deleteRequestGroupShort: 'Delete',
        saveCollection: 'Create collection',
        saveRenamedCollection: 'Save rename',
        saveRequestGroup: 'Create group',
        saveRenamedRequestGroup: 'Save rename',
        cancelRequestGroup: 'Cancel',
      },
      notes: {
        boundary:
          'Export and import stay limited to authored request definitions, mock rules, and standalone saved scripts. Runtime history, captures, and execution artifacts remain outside this bundle.',
        navigationOnly:
          'Explorer actions handle preview, pin, create, run, rename, and delete directly in the tree. Import and export stay in the companion workspace panel.',
        previewAdvisory:
          'Preview is advisory only. Workspace changes before confirm can still change imported names or validation outcomes for {fileName}.',
      },
      status: {
        previewingFile:
          'Previewing authored resources from {fileName}. No changes will be written until you confirm import.',
        fileReadFailed: 'Selected file could not be read for import.',
        exportFailed: 'Resource export failed before a bundle could be downloaded.',
        workspaceResourcesDegraded: 'Workspace saved-resource data is degraded. Empty states are hidden until the resource routes respond again.',
        requestTreeDegraded: 'Saved request tree could not be loaded from the server.',
        savedRequestsDegraded: 'Saved request list could not be loaded from the server.',
        previewNoResources:
          'Preview found no saved-request, mock-rule, or saved-script resources in {fileName}. Nothing will be written until you choose a bundle with authored resources.',
        previewNoImportable:
          'Preview found no importable authored resources in {fileName}. {rejectedCount} resource(s) would be rejected and nothing will be written until you choose a different bundle.',
        previewReady:
          'Preview ready for {fileName}. Confirm import to write {acceptedSummary} with new identities.',
        previewReadyRejected:
          'Preview ready for {fileName}. Confirm import to write {acceptedSummary}; {rejectedCount} resource(s) would still be rejected and left unchanged.',
        importStarting:
          'Importing authored resources from {fileName}. Preview remains advisory until the write completes.',
        importCleared: 'Import preview cleared. No authored resources were written.',
        importFailed:
          'Resource import failed before the authored-resource transfer completed. Already-written resources, if any, were not rolled back automatically.',
        importSuccess:
          '{acceptedSummary}. Imported resources received new identities so existing saved resources were not overwritten.',
        importRejected:
          '{acceptedSummary}. {rejectedCount} resource(s) were rejected during validation and left unchanged.',
        acceptedSummary: '{count} authored resource(s) imported',
        exportCompleted: 'Exported {label} from the authored resource lane.',
        exportBundleLabel: '{requestCount} saved request definition(s), {mockRuleCount} mock rule(s), and {scriptCount} saved script(s)',
        exportSavedRequestLabel: 'saved request {name}',
        exportSingleFailed: 'Saved request export failed before a bundle could be downloaded.',
        requestDeleted: 'Deleted the saved request from the canonical saved tree. Open tabs were kept as detached drafts.',
        requestDeleteFailed: 'Saved request deletion failed before the canonical saved tree could be updated.',
        collectionCreated: 'Created collection {name} in the canonical saved tree.',
        collectionCreateFailed: 'Collection creation failed before the canonical saved tree could be updated.',
        collectionRenamed: 'Renamed collection to {name} in the canonical saved tree.',
        collectionRenameFailed: 'Collection rename failed before the canonical saved tree could be updated.',
        collectionDeleted: 'Deleted collection {name} from the canonical saved tree. Drafts that referenced it moved to the default save placement.',
        collectionDeleteFailed: 'Collection deletion failed before the canonical saved tree could be updated.',
        requestGroupCreated: 'Created request group {name} in the canonical saved tree.',
        requestGroupCreateFailed: 'Request group creation failed before the canonical saved tree could be updated.',
        requestGroupRenamed: 'Renamed request group to {name} in the canonical saved tree.',
        requestGroupRenameFailed: 'Request group rename failed before the canonical saved tree could be updated.',
        requestGroupDeleted: 'Deleted request group {name} from the canonical saved tree. Drafts that referenced it moved to the default save placement.',
        requestGroupDeleteFailed: 'Request group deletion failed before the canonical saved tree could be updated.',
        bundleCollectionCount: 'Collections in bundle: {count}',
        bundleRequestGroupCount: 'Request groups in bundle: {count}',
        bundleRequestCount: 'Saved requests in bundle: {count}',
        bundleMockRuleCount: 'Mock rules in bundle: {count}',
        bundleScriptCount: 'Saved scripts in bundle: {count}',
        createdCollections: 'Created collections: {count}',
        createdRequestGroups: 'Created request groups: {count}',
        createdRequests: 'Created requests: {count}',
        createdMockRules: 'Created mock rules: {count}',
        createdScripts: 'Created saved scripts: {count}',
        renamedOnImport: 'Renamed on import: {count}',
        rejectedDuringValidation: 'Rejected during validation: {count}',
        importedPreview: 'Imported preview: {names}',
        rejectedReasons: 'Rejected reasons: {reasons}',
        runtimeExcluded:
          'Runtime history, captures, and execution artifacts remain excluded.',
      },
      tree: {
        kindCollection: 'collection',
        kindRequestGroup: 'request group',
        requestGroupCount: '{count} request group(s)',
        requestCount: '{count} request(s)',
        deleteCollectionRequiresEmpty: 'Delete becomes available when the collection is empty.',
        deleteRequiresEmpty: 'Delete becomes available when the group is empty.',
        createCollectionHint: 'Collections own request groups and saved requests in the canonical explorer tree.',
        noRequestGroups: 'No request groups exist in this collection yet.',
      },
      fields: {
        collectionName: 'Collection name',
        requestGroupName: 'Request group name',
      },
      prompts: {
        renameCollection: 'Rename collection "{name}"',
        deleteCollection: 'Delete collection "{name}"?',
        renameRequestGroup: 'Rename request group "{name}"',
        deleteRequestGroup: 'Delete request group "{name}"?',
        deleteSavedRequest: 'Delete saved request "{name}"?',
      },
      selection: {
        current: 'Current selection: {path}',
        none: 'No saved request is selected in the explorer.',
      },
    },
    management: {
      ariaLabel: 'Saved resource manager',
      header: {
        eyebrow: 'Saved resource manager',
        title: 'Manage saved workspace resources',
        summary:
          'This companion panel keeps authored-resource transfer and focused rename/delete controls available while recursive explorer actions stay first-class in the tree.',
      },
      badges: {
        savedTree: 'Saved tree',
        mainSurface: 'Main surface',
      },
      sections: {
        transferTitle: 'Authored resource transfer',
        transferDescription:
          'Export or preview-import authored resources from the main surface without turning the explorer into a mutation lane.',
        collectionTitle: 'Collections',
        collectionDescription:
          'Review, rename, or delete empty collections here after creating them from the header or explorer.',
        requestGroupTitle: 'Request groups',
        requestGroupDescription:
          'Review, rename, or delete the currently selected request group here, including nested groups that appear with full tree paths.',
        requestTitle: 'Saved request actions',
        requestDescription:
          'Request creation stays in the tab strip and request editing stays in the builder. Export and delete the persisted saved request here when the active tab is saved-backed.',
      },
      fields: {
        manageCollection: 'Manage collection',
        manageRequestGroup: 'Manage request group',
      },
      actions: {
        exportSavedRequest: 'Export saved request',
        deleteSavedRequest: 'Delete saved request',
      },
      context: {
        labels: {
          selectedCollection: 'Selected collection',
          requestGroupCount: 'Request group count',
          selectedRequestGroup: 'Selected request group',
          requestCount: 'Saved request count',
          activeTab: 'Active tab',
          tabState: 'Tab state',
          savePlacement: 'Save placement',
        },
        values: {
          savedRequest: 'Saved request tab',
          detachedDraft: 'Detached draft',
          replayDraft: 'Replay draft',
          workingDraft: 'Working draft',
          noActiveTab: 'No active tab',
          noneSelected: 'None selected',
        },
      },
      state: {
        activePlacement: 'Active save placement: {path}',
        noActivePlacement: 'No active save placement is selected yet.',
        transferBoundary:
          'Import and export remain limited to authored request definitions, mock rules, and standalone saved scripts. Runtime history, captures, and execution artifacts remain excluded.',
        collectionCount: '{count} request group(s) exist in the selected collection tree.',
        collectionUnavailable: 'No collection is available to manage yet.',
        requestCount: '{count} saved request(s) belong to the selected request group.',
        requestGroupUnavailable: 'Select a collection first to manage request groups.',
        requestSelected: 'Managing saved request {name}.',
        requestDetached:
          'This tab was detached from the canonical saved tree after the persisted request was deleted. Save it again to create a new canonical request and restore saved-request actions.',
        requestDraft: 'This tab is still a working draft or replay draft. Save it first if you want it to rejoin the canonical saved tree.',
        requestUnavailable: 'Open a saved request tab to export or delete the persisted request definition.',
      },
    },
    tabShell: {
      empty:
        'No request tabs are open yet. Start a new draft or open a saved request from the workspace explorer.',
      newRequest: 'New Request',
      quickRequest: 'Quick Request',
      ariaLabel: 'Request tab strip',
      dirtyIndicator: '{title} has unsaved changes',
      pinAction: 'Pin',
      pinTab: 'Pin {title}',
      closeTab: 'Close {title}',
      sourcePreview: 'Preview',
      sourceQuick: 'Quick',
      sourceReplay: 'Replay',
      sourceDetached: 'Detached',
    },
    requestBuilder: {
      defaultTitle: 'Untitled Request',
      empty: {
        noSelectionTitle: 'No request tab selected',
        noSelectionDescription:
          'Open a saved request or create a draft to begin authoring. Response stays in the right-hand observation panel, while history, captures, and mocks remain separate observation or rule-management routes.',
        createDraftAction: 'Create Draft Request',
        preparingTitle: 'Preparing request draft',
        preparingDescription:
          'This tab is creating a fresh authoring context. Replay and other observation records are always copied into a new draft instead of being edited in place.',
      },
      header: {
        eyebrow: 'Request builder core',
        description:
          'This tab owns editable request state only. Save updates the request definition, while Run creates separate observation in the right-hand panel without mutating history or captures.',
      },
      badges: {
        savedRequest: 'Saved request',
        detachedDraft: 'Detached draft',
        newDraft: 'New draft',
        dirty: 'Dirty',
      },
      location: {
        unsavedDraft: 'Unsaved draft',
        defaultSavePlacement: 'Default save placement: {path}',
      },
      detached: {
        title: 'Detached draft',
        description: 'The saved request behind this tab was deleted. This draft still keeps your editable request state, but it no longer belongs to the canonical saved tree.',
        saveTarget: 'Save this draft again to restore a canonical saved request in {path}.',
        noSaveTarget: 'Choose a save placement and save this draft again to restore a canonical saved request.',
      },
      status: {
        saveUpToDate: 'Saved request definition is up to date.',
        saveAtTime: 'Saved request definition at {time}.',
        saveFallback: 'Save updates the request definition only.',
        runFallback: 'Run creates a separate observation record in the right-hand panel.',
        saveError: 'Failed to save request definition.',
        runError: 'Failed to run request.',
      },
      disabledReasons: {
        noDraftSave: 'Open a request tab before saving.',
        nameRequiredSave: 'Enter a request name before saving.',
        urlRequiredSave: 'Enter a request URL before saving.',
        savePending: 'Save is already in progress.',
        noDraftRun: 'Open a request tab before running.',
        urlRequiredRun: 'Enter a request URL before running.',
        malformedJsonRun: 'Fix malformed JSON body before running.',
        runPending: 'Run is already in progress.',
        linkedScriptMissing: 'Repair or detach the missing linked saved script in the {stageLabel} stage before running.',
        linkedScriptMismatch: 'Repair or detach the mismatched linked saved script in the {stageLabel} stage before running.',
      },
      failedRun: {
        requestSnapshotUnavailableTarget: 'request snapshot unavailable',
        inputSummary: '{paramCount} params · {headerCount} headers · {bodySummary} · {authSummary}',
        bodySummary: {
          none: 'No body',
          json: 'JSON body',
          text: 'Text body',
          formUrlencoded: 'Form body',
          multipartFormData: 'Multipart body',
        },
        authSummary: {
          none: 'No auth',
          bearer: 'Bearer auth',
          basic: 'Basic auth',
          apiKeyHeader: 'API key in header',
          apiKeyQuery: 'API key in query',
        },
        requestSnapshotSummary: '{method} {targetUrl} executed from the active workspace draft with {inputSummary}.',
        responseHeadersSummary: 'No response headers were captured.',
        responseBodyHint: 'No response payload is available for this failed run.',
        responsePreviewPolicy: 'No response preview is available because the run lane failed before transport completed.',
        consoleSummary: 'No console entries were captured because the run lane failed before bounded script diagnostics could be summarized.',
        testsSummary: 'No tests were recorded because the run lane failed before the tests stage could complete.',
        transportStageLabel: 'Transport',
        transportStageSummary: 'Transport failed before the run endpoint could return bounded diagnostics.',
      },
      fields: {
        requestName: 'Request name',
        saveCollection: 'Save collection',
        saveRequestGroup: 'Save request group',
        requestEnvironment: 'Request environment',
        requestMethod: 'Request method',
        requestUrl: 'Request URL',
      },
      placement: {
        selected: 'Request will save to {path}.',
        pendingCreate: 'First save will create {groupName} in {path}.',
        pendingOption: '{name} (created on first save)',
        unavailable: 'No canonical save placement is available yet.',
        noRequestGroups: 'Create a request group to enable saved placement.',
      },
      environment: {
        noEnvironment: 'No environment',
        missingReferenceOption: 'Missing environment reference',
        defaultBadge: 'Default environment',
        missingBadge: 'Missing environment',
        loading: 'Loading workspace environments for request-level selection.',
        degraded:
          'Environment list is degraded. Saved-environment validation may stay unavailable until the environments route responds again.',
        missing:
          'The selected environment reference is missing from this workspace. Choose another environment or No environment before saving or running.',
        selected:
          '{name} contributes {count} enabled variable(s) to this request at run time.',
        noneSelected: 'No environment is selected. This request runs with authored values only.',
      },
      commands: {
        save: 'Save',
        saving: 'Saving...',
        duplicate: 'Duplicate',
        run: 'Run',
        running: 'Running...',
        replayIntro:
          'Replay drafts still open in edit-first mode. Save creates or updates a request definition, while Run creates separate observation for this draft only.',
        defaultIntro:
          'Save updates the request definition. Run does not save automatically and does not clear unsaved authoring changes.',
        duplicateDeferred:
          'Duplicate stays deferred until saved-request copy semantics are added in a later slice.',
      },
      tabs: {
        params: 'Params',
        headers: 'Headers',
        body: 'Body',
        auth: 'Auth',
        scripts: 'Scripts',
      },
      paramsEditor: {
        title: 'Params',
        description:
          'Edit query params as request authoring inputs. Run applies only enabled rows, and save persists the authored definition as-is.',
        empty: 'No params yet. Add rows only if this request needs query input.',
        addAction: 'Add param',
        rowLabel: 'Param',
      },
      headersEditor: {
        title: 'Headers',
        description:
          'Edit request headers without coupling them to runtime history or captures. Save persists them, and Run applies enabled rows only to this execution.',
        empty: 'No headers yet. Add rows when this request needs explicit header values.',
        addAction: 'Add header',
        rowLabel: 'Header',
      },
      bodyEditor: {
        title: 'Body',
        description:
          'Choose a lightweight authoring mode. Save persists body inputs, while Run sends the current authored body without pulling observation state back into the draft.',
        modeLabel: 'Body mode',
        empty: 'No body content is attached to this request draft.',
        contentJsonLabel: 'Body content (JSON)',
        contentTextLabel: 'Body content (Text)',
        formTitle: 'Form body',
        formDescription:
          'Scaffold x-www-form-urlencoded request bodies as key/value rows. Save persists them, and Run encodes only enabled rows.',
        formEmpty: 'No form fields yet. Add rows to prepare encoded body inputs.',
        formAddAction: 'Add form field',
        formRowLabel: 'Form field',
        multipartTitle: 'Multipart body',
        multipartDescription:
          'Scaffold multipart rows only. Real file attachment UX is still deferred, but enabled rows are already preserved in the saved definition.',
        multipartEmpty:
          'No multipart rows yet. Add basic fields or file placeholders for later implementation.',
        multipartAddAction: 'Add multipart field',
        multipartRowLabel: 'Multipart field',
      },
      bodyModeOptions: {
        none: 'None',
        json: 'JSON',
        text: 'Text',
        formUrlencoded: 'x-www-form-urlencoded',
        multipartFormData: 'multipart/form-data',
      },
      authEditor: {
        title: 'Auth',
        description:
          'Auth stays lightweight here. Save persists authored auth fields, while Run applies them for this request only without reusing history or capture observation state.',
        typeLabel: 'Auth type',
        empty: 'No auth is attached to this request draft.',
        bearerToken: 'Bearer token',
        username: 'Username',
        password: 'Password',
        apiKeyName: 'API key name',
        apiKeyValue: 'API key value',
        apiKeyPlacement: 'API key placement',
      },
      authTypeOptions: {
        none: 'None',
        bearer: 'Bearer token',
        basic: 'Basic auth',
        apiKey: 'API key',
      },
      apiKeyPlacementOptions: {
        header: 'Header',
        query: 'Query',
      },
      loadingScripts: {
        title: 'Scripts',
        description:
          'Loading the stage-aware script editor on demand so Params, Headers, Body, and Auth stay responsive while the heavier authoring path initializes.',
        lazyPathTitle: 'Lazy editor path',
        lazyPathDescription:
          'This fallback explains the wait: the script editor bundle is loaded only when Scripts is active. Advanced editor assistance remains deferred even though bounded script execution already writes observation summaries elsewhere.',
      },
    },
    keyValueEditor: {
      labels: {
        enabled: '{rowLabel} row {index} enabled',
        key: '{rowLabel} row {index} key',
        value: '{rowLabel} row {index} value',
      },
      removeAction: 'Remove',
      removeAriaLabel: 'Remove {rowLabel} row {index}',
    },
    scriptsEditor: {
      header: {
        title: 'Scripts',
        description:
          'Scripts stays request-bound and draft-owned. This surface remains authoring-owned, while Run executes bounded stage-aware scripts and sends redacted summaries to observation panels and persisted history.',
      },
      stages: {
        preRequest: {
          label: 'Pre-request',
          ariaLabel: 'Pre-request',
          fieldAriaLabel: 'Pre-request script',
          guidanceAriaLabel: 'Pre-request guidance',
          eyebrow: 'Before transport',
          title: 'Prepare request inputs',
          description:
            'Use this stage for request-bound setup such as deriving headers, shaping body text, or preparing ad hoc values before send.',
          helperFirst:
            'Keep work scoped to request preparation rather than response inspection.',
          helperSecond:
            'Only bounded request mutation and explicit runtime helpers are available here. Broader capability expansion stays deferred.',
          helperThird:
            'Replay source cues remain metadata only and do not become script globals in this slice.',
          exampleLabel: 'Typical use',
        },
        postResponse: {
          label: 'Post-response',
          ariaLabel: 'Post-response',
          fieldAriaLabel: 'Post-response script',
          guidanceAriaLabel: 'Post-response guidance',
          eyebrow: 'After transport',
          title: 'Summarize response handling intent',
          description:
            'Use this stage for lightweight post-response diagnostics. Bounded console summaries and derived execution notes run after transport, while richer diagnostics stay deferred.',
          helperFirst:
            'Capture summary logic or redaction notes you want after a response arrives.',
          helperSecond:
            'Do not expect history or result-panel data to flow into this authoring state yet.',
          helperThird:
            'Richer diagnostics and execution-linked console output remain deferred.',
          exampleLabel: 'Typical use',
        },
        tests: {
          label: 'Tests',
          ariaLabel: 'Tests',
          fieldAriaLabel: 'Tests script',
          guidanceAriaLabel: 'Tests guidance',
          eyebrow: 'Assertions later',
          title: 'Plan request-bound assertions',
          description:
            'Use this stage for assertion authoring. Bounded pass/fail summaries flow into the result panel and persisted history, while richer diagnostics remain deferred.',
          helperFirst:
            'Keep assertions request-bound instead of coupling them to history or capture detail panels.',
          helperSecond: 'Reusable script templates and shared libraries remain deferred.',
          helperThird:
            'Editor assistance, Monaco, and richer diagnostics will arrive in later slices.',
          exampleLabel: 'Typical use',
        },
      },
      guidance: {
        tabListAriaLabel: 'Script stages',
        loadedOnDemand:
          'This editor path is loaded on demand so the rest of the request builder stays responsive when Scripts is not active, even after stage execution wiring landed.',
      },
      attach: {
        title: 'Attach from saved script',
        description: 'Choose one compatible saved script and either copy it into the active stage or keep the stage linked to the saved source.',
        selectLabel: 'Saved script',
        copyAction: 'Copy into stage',
        replaceAction: 'Replace with saved script',
        linkAction: 'Link to stage',
        relinkAction: 'Relink stage',
        detachAction: 'Detach to copy',
        openLibraryAction: 'Open Scripts library',
        previewLabel: 'Saved script preview',
        loading: 'Loading compatible saved scripts for this stage.',
        degraded: 'Saved script library is unavailable right now. Try again after the Scripts route responds.',
        empty: 'No saved scripts are compatible with this stage yet.',
        copiedBadge: 'Copied',
        copiedHint: 'Copied from saved script: {name}',
        linkedTitle: 'Linked saved script',
        linkedDescription: 'This stage is read-only because it currently follows a saved script reference.',
        linkedBadge: 'Linked',
        linkedBrokenBadge: 'Broken link',
        linkedNameLabel: 'Saved script',
        linkedPreviewLabel: 'Resolved source preview',
        linkedResolvedHint: 'This stage will run the current saved script source from {name}.',
        linkedMissingSummary: 'The linked saved script is missing. Repair the reference or detach it to an inline copy before running.',
        linkedMismatchSummary: 'The linked saved script no longer matches this stage type. Relink or detach it before running.',
        linkedSnapshotHint: 'Linked from snapshot name: {name}',
      },
      footer: {
        title: 'Deferred in later slices',
        description:
          'Reusable script management, richer diagnostics, broader capability surfaces, and Monaco or intellisense expansion remain explicitly later-slice work.',
      },
    },
    resultPanel: {
      tabs: {
        ariaLabel: 'Result panel tabs',
        response: 'Response',
        console: 'Console',
        tests: 'Tests',
        executionInfo: 'Execution Info',
      },
      empty: {
        waitingTitle: 'Observation panel is waiting for an active request tab',
        waitingDescription:
          'Open a request tab first. The center panel owns authoring state, while Save updates request definitions and Run sends bounded observation here without turning this panel into editable state.',
      },
      header: {
        eyebrow: 'Observation surface',
        title: 'Observation for {title}',
        description:
          'This right-hand panel is reserved for run observation only. Save never updates it, and request authoring stays in the center authoring surface.',
      },
      source: {
        replayDraft: 'Replay draft',
        draftRequestTab: 'Draft request tab',
        detachedDraft: 'Detached draft',
        savedRequest: 'Saved request',
        savedInCollection: 'Saved in {collectionName}',
        savedInCollectionRequestGroup: 'Saved in {collectionName} / {requestGroupName}',
      },
      detached: {
        title: 'Detached from the canonical saved tree',
        description: 'Past execution results stay available as historical snapshots, but this tab now behaves like a draft until you save it again.',
      },
      linkage: {
        noSavedPlacementRecorded: 'No saved placement recorded',
        draftSavePlacement: 'Draft save placement: {placement}',
        noLinkedSavedRequest: 'No linked saved request',
      },
      common: {
        durationMs: '{durationMs} ms',
        transportNoResponse: 'No response',
        workspaceRoot: 'Workspace',
      },
      summary: {
        title: '{tabLabel} summary',
        description:
          'Observation stays separate from the editable request draft. Run creates execution output here without clearing unsaved changes in the center authoring panel.',
        badges: {
          running: 'Running',
          noExecutionYet: 'No execution yet',
          latestAriaLabel: 'Latest execution outcome badges',
          testsReady: '{count} test result(s)',
          consoleReady: '{count} console line(s)',
        },
        labels: {
          activeRequest: 'Active request',
          method: 'Method',
          tabSource: 'Tab source',
          visibleSlot: 'Visible slot',
          runLane: 'Run lane',
        },
        values: {
          executionInProgress: 'Execution in progress',
          noExecutionYet: 'No execution yet',
        },
        preview: {
          testsTitle: 'Tests preview',
          testsDescription: 'Key assertion feedback is pinned here right after a run so you can triage without switching tabs.',
          testsAriaLabel: 'Tests preview',
          testsEmpty: 'No tests were recorded for the latest execution.',
          consoleTitle: 'Console preview',
          consoleDescription: 'Recent bounded console lines surface here immediately after execution to reduce first-feedback time.',
          consoleAriaLabel: 'Console preview',
          consoleEmpty: 'No console entries were recorded for the latest execution.',
        },
      },
      response: {
        title: 'Response detail',
        description:
          'Response detail belongs to the latest run for this active tab only. Preview stays bounded here, and truncation or redaction notes stay explicit instead of expanding the payload surface.',
        runningTitle: 'Running request',
        runningDescription:
          'The request is in flight. Response headers, bounded preview size, and body preview will appear here when the current run settles.',
        labels: {
          httpStatus: 'HTTP status',
          duration: 'Duration',
          previewSize: 'Preview size',
          previewPolicy: 'Preview policy',
          headersSummary: 'Headers summary',
          bodyHint: 'Body hint',
        },
        values: {
          noPreviewStored: 'No preview stored',
          previewPolicyFallback:
            'Preview is bounded before richer diagnostics and raw payload inspection are added.',
          previewSupportFallback:
            'Preview stays bounded in this observation surface while richer inspection remains deferred.',
          noBodyPreview: 'No response body preview was captured.',
        },
        empty: {
          title: 'Run this request to populate Response',
          description:
            'Save only updates the request definition. Use Run to execute the current draft and load response status, bounded preview metadata, headers, and body preview here.',
        },
      },
      console: {
        title: 'Console detail',
        description:
          'Console stays observation-only and shows bounded stage-aware output when scripts run. Missing entries are explained explicitly instead of being fabricated.',
        labels: {
          logLines: 'Log lines',
          warnings: 'Warnings',
          preRequestStage: 'Pre-request stage',
          postResponseStage: 'Post-response stage',
          summary: 'Summary',
        },
        noEntriesTitle: 'No console entries for this run',
        empty: {
          title: 'Console waits for an execution',
          description:
            'Run the current request to associate bounded pre-request and post-response console summaries with this tab. Empty stages stay explicitly explained here.',
        },
      },
      tests: {
        title: 'Tests detail',
        description:
          'Tests stays observation-only and shows bounded assertion summaries from the tests stage when present. Missing assertions stay explicit instead of being invented.',
        labels: {
          summary: 'Summary',
          entries: 'Entries',
          testsStage: 'Tests stage',
        },
        noEntriesTitle: 'No tests ran for this execution',
        empty: {
          title: 'Tests wait for an execution',
          description:
            'Run the current request to record bounded assertion summaries. If no tests script exists, the tests stage is skipped and explained here.',
        },
      },
      executionInfo: {
        title: 'Execution info',
        description:
          'Execution metadata belongs to the latest run and stays separate from saved request definitions, inbound captures, and persisted history.',
        startingTitle: 'Execution is starting',
        startingDescription:
          'A local run id, timing data, and a bounded request snapshot summary will appear here once the current request settles.',
        executionStageSummaryAriaLabel: 'Execution stage summary',
        labels: {
          executionId: 'Execution id',
          startedAt: 'Started at',
          completedAt: 'Completed at',
          outcome: 'Outcome',
          snapshotSource: 'Snapshot source',
          linkedRequest: 'Linked request',
          placement: 'Placement',
          environment: 'Environment',
          errorCode: 'Error code',
          errorSummary: 'Error summary',
          requestInput: 'Request input',
        },
        values: {
          savedRequestSnapshot: 'Saved request snapshot',
          adHocRequestSnapshot: 'Ad hoc request snapshot',
          runtimeRequestSnapshot: 'Runtime request snapshot',
          noEnvironmentSelected: 'No environment selected',
          noExecutionErrorCode: 'No execution error code',
          noExecutionErrorSummary: 'No execution error was reported.',
          requestSnapshotSummaryMissing: 'Request snapshot summary was not returned.',
        },
        environmentResolution: {
          title: 'Environment resolution',
          labels: {
            status: 'Status',
            resolvedPlaceholders: 'Resolved placeholders',
            unresolvedPlaceholders: 'Unresolved placeholders',
            affectedInputAreas: 'Affected input areas',
          },
          status: {
            notSelected: 'No environment selected',
            resolved: 'Resolved',
            missingEnvironment: 'Missing environment',
            unresolvedPlaceholders: 'Unresolved placeholders',
            invalidResolvedJson: 'Invalid resolved JSON',
          },
          areas: {
            url: 'URL',
            params: 'Params',
            headers: 'Headers',
            body: 'Body',
            auth: 'Auth',
            none: 'None',
          },
        },
        empty: {
          title: 'No execution info yet',
          description:
            'Use Run to create a fresh execution record for this tab. Save success does not populate execution info in this observation panel.',
        },
      },
      batch: {
        header: {
          eyebrow: 'Batch results',
          titleFallback: 'Workspace batch run',
          description:
            'Collection and group runs reuse this panel to show sequential results without changing the current shell layout.',
        },
        containerLabels: {
          collection: 'Collection batch run',
          requestGroup: 'Request group batch run',
        },
        status: {
          running: 'Running batch',
          noRunYet: 'No batch run yet',
          runningContainer: 'Running {name}...',
          collectionFailed: 'Collection batch run failed.',
          requestGroupFailed: 'Request group batch run failed.',
          noRequestsFound: 'No saved requests were found in this container.',
          noStepsRecorded: 'No batch steps were recorded.',
          noExecutionSelected: 'No batch execution selected.',
          noConsoleCaptured: 'No console output was captured for this batch run.',
          noTestsCaptured: 'No test results were captured for this batch run.',
          noOutputTitle: 'No console output',
          noOutputDescription:
            'This batch run completed without stored console entries or error summaries.',
        },
        badges: {
          batchRun: 'Batch run',
          latestAriaLabel: 'Latest batch run badges',
          steps: 'Steps {count}',
          issues: 'Issues {count}',
          succeeded: 'Succeeded {count}',
        },
        summary: {
          title: 'Batch summary · {tabLabel}',
          description: 'Batch execution summaries stay in the existing result surface.',
          labels: {
            scope: 'Scope',
            container: 'Container',
            order: 'Order',
            runLane: 'Run lane',
            requests: 'Requests',
          },
          values: {
            pendingSelection: 'Pending selection',
            depthFirst: 'Depth-first',
            executionInProgress: 'Batch execution in progress',
            noExecutionYet: 'No batch execution yet',
          },
          preview: {
            stepTitle: 'Step preview',
            stepDescription: 'Ordered request steps for this batch run.',
            stepAriaLabel: 'Batch step preview',
            consoleTitle: 'Console preview',
            consoleDescription: 'Console and failure highlights across the batch run.',
            consoleAriaLabel: 'Batch console preview',
          },
        },
        response: {
          title: 'Batch response summary',
          description: 'Aggregate outcomes and ordered request results.',
          runningTitle: 'Batch run in progress',
          runningDescription: 'Responses will appear here as each request completes.',
          emptyTitle: 'No batch execution yet',
          emptyDescription: 'Run a collection or request group to inspect aggregate results here.',
          labels: {
            started: 'Started',
            completed: 'Completed',
            succeeded: 'Succeeded',
            failed: 'Failed',
            blocked: 'Blocked',
            timedOut: 'Timed out',
          },
          stepsAriaLabel: 'Batch response steps',
        },
        console: {
          title: 'Batch console',
          description: 'Console logs and error summaries across ordered steps.',
          labels: {
            requestsWithLogs: 'Requests with logs',
            totalConsoleLines: 'Total console lines',
            failedOrBlocked: 'Failed or blocked',
            continueOnError: 'Continue on error',
          },
          values: {
            enabled: 'Enabled',
            disabled: 'Disabled',
          },
          emptyTitle: 'No batch execution yet',
          emptyDescription: 'Run a collection or request group to inspect console details here.',
        },
        tests: {
          title: 'Batch tests',
          description: 'Per-step test summaries for the current batch run.',
          labels: {
            steps: 'Steps',
            succeeded: 'Succeeded',
            failed: 'Failed',
            timedOut: 'Timed out',
          },
          emptyTitle: 'No batch execution yet',
          emptyDescription: 'Run a collection or request group to inspect test summaries here.',
        },
        executionInfo: {
          title: 'Batch execution info',
          description: 'Container metadata and run identifiers for the latest batch execution.',
          preparingTitle: 'Preparing batch execution',
          preparingDescription: 'Execution metadata will appear here once the first request starts.',
          emptyTitle: 'No batch execution yet',
          emptyDescription: 'Run a collection or request group to inspect execution metadata here.',
          labels: {
            batchExecutionId: 'Batch execution ID',
            containerType: 'Container type',
            containerId: 'Container ID',
            startedAt: 'Started at',
            completedAt: 'Completed at',
            duration: 'Duration',
            executionOrder: 'Execution order',
            continueOnError: 'Continue on error',
          },
          values: {
            enabled: 'Enabled',
            disabled: 'Disabled',
          },
          stepsAriaLabel: 'Batch execution steps',
        },
      },
    },
  },
} as const;

type CatalogShape<T> = {
  [K in keyof T]: T[K] extends string ? string : CatalogShape<T[K]>;
};

export const workspaceRouteMessagesKo: CatalogShape<typeof workspaceRouteMessagesEn> = {
  workspaceRoute: {
    explorer: {
      header: {
        eyebrow: '작업공간 탐색기',
        title: '컬렉션',
        summary:
          '지속된 컬렉션, 중첩 요청 그룹, 저장된 요청을 여기에서 함께 봅니다. explorer 액션으로 트리를 벗어나지 않고 preview, pin, 생성, 실행, 이름 변경, 삭제를 처리합니다.',
        authoringChip: '작성',
        resourceLaneChip: '리소스 레인',
      },
      actions: {
        newRequest: '새 요청',
        exportResources: '리소스 내보내기',
        exportingResources: '리소스를 내보내는 중',
        importResources: '리소스 가져오기',
        importResourcesInput: '작성 리소스 가져오기',
        previewingImport: '가져오기 미리보기 중',
        importingResources: '리소스를 가져오는 중',
        confirmImport: '가져오기 확정',
        cancelPreview: '미리보기 취소',
        exportSingle: '내보내기',
        openRequest: '{name} 열기',
        exportRequest: '{name} 내보내기',
        deleteRequest: '{name} 삭제',
        deleteRequestShort: '삭제',
        createCollection: '컬렉션 생성',
        createCollectionShort: '새 컬렉션',
        renameCollection: '컬렉션 {name} 이름 변경',
        renameCollectionShort: '이름 변경',
        deleteCollection: '컬렉션 {name} 삭제',
        deleteCollectionShort: '삭제',
        createRequestGroup: '{name}에 요청 그룹 생성',
        createRequestGroupShort: '새 그룹',
        runContainerShort: '실행',
        runSelected: '선택 실행',
        renameRequestGroup: '요청 그룹 {name} 이름 변경',
        renameRequestGroupShort: '이름 변경',
        deleteRequestGroup: '요청 그룹 {name} 삭제',
        deleteRequestGroupShort: '삭제',
        saveCollection: '컬렉션 생성',
        saveRenamedCollection: '이름 저장',
        saveRequestGroup: '그룹 생성',
        saveRenamedRequestGroup: '이름 저장',
        cancelRequestGroup: '취소',
      },
      notes: {
        boundary:
          '내보내기와 가져오기는 작성된 요청 정의, mock rule, 그리고 독립 저장 스크립트에만 한정됩니다. 런타임 히스토리, 캡처, 실행 artifact는 이 번들 범위 밖에 있습니다.',
        navigationOnly:
          'explorer 액션으로 트리 안에서 preview, pin, 생성, 실행, 이름 변경, 삭제를 직접 처리합니다. 가져오기와 내보내기만 보조 workspace 패널에 남습니다.',
        previewAdvisory:
          '미리보기는 참고용입니다. 확정 전에 작업공간이 바뀌면 {fileName}의 가져오기 이름이나 검증 결과가 달라질 수 있습니다.',
      },
      status: {
        previewingFile:
          '{fileName}의 작성 리소스를 미리 보는 중입니다. 가져오기를 확정하기 전까지는 어떤 변경도 기록되지 않습니다.',
        fileReadFailed: '가져오기를 위해 선택한 파일을 읽을 수 없습니다.',
        exportFailed: '번들을 다운로드하기 전에 리소스 내보내기에 실패했습니다.',
        workspaceResourcesDegraded: '워크스페이스 저장 리소스 데이터가 저하되었습니다. 리소스 경로가 다시 응답할 때까지 빈 상태를 정상처럼 숨기지 않습니다.',
        requestTreeDegraded: '저장 요청 트리를 서버에서 불러오지 못했습니다.',
        savedRequestsDegraded: '저장 요청 목록을 서버에서 불러오지 못했습니다.',
        previewNoResources:
          '{fileName}에서 저장 요청, mock rule, 또는 저장 스크립트 리소스를 찾지 못했습니다. 작성 리소스가 포함된 번들을 선택하기 전까지는 아무것도 기록되지 않습니다.',
        previewNoImportable:
          '{fileName}에서 가져올 수 있는 작성 리소스를 찾지 못했습니다. {rejectedCount}개 리소스가 거부될 예정이며 다른 번들을 선택하기 전까지는 아무것도 기록되지 않습니다.',
        previewReady:
          '{fileName} 미리보기가 준비되었습니다. 새 식별자로 {acceptedSummary}를 기록하려면 가져오기를 확정하세요.',
        previewReadyRejected:
          '{fileName} 미리보기가 준비되었습니다. {acceptedSummary}를 기록하려면 가져오기를 확정하세요. {rejectedCount}개 리소스는 계속 거부되어 변경되지 않습니다.',
        importStarting:
          '{fileName}에서 작성 리소스를 가져오는 중입니다. 쓰기가 완료될 때까지 미리보기는 참고용으로 유지됩니다.',
        importCleared: '가져오기 미리보기를 지웠습니다. 작성 리소스는 기록되지 않았습니다.',
        importFailed:
          '작성 리소스 전송이 완료되기 전에 가져오기에 실패했습니다. 이미 기록된 리소스가 있다면 자동으로 롤백되지 않습니다.',
        importSuccess:
          '{acceptedSummary}. 가져온 리소스는 새 식별자를 받아 기존 저장 리소스를 덮어쓰지 않았습니다.',
        importRejected:
          '{acceptedSummary}. {rejectedCount}개 리소스는 검증 중 거부되어 변경되지 않았습니다.',
        acceptedSummary: '작성 리소스 {count}개를 가져왔습니다',
        exportCompleted: '작성 리소스 레인에서 {label} 항목을 내보냈습니다.',
        exportBundleLabel: '저장 요청 {requestCount}개, mock rule {mockRuleCount}개, 저장 스크립트 {scriptCount}개',
        exportSavedRequestLabel: '저장 요청 {name}',
        exportSingleFailed: '번들을 다운로드하기 전에 저장 요청 내보내기에 실패했습니다.',
        requestDeleted: '저장 요청을 기준 저장 트리에서 삭제했습니다. 열려 있던 탭은 분리된 draft로 유지했습니다.',
        requestDeleteFailed: '기준 저장 트리를 갱신하기 전에 저장 요청 삭제에 실패했습니다.',
        collectionCreated: '기준 저장 트리에 컬렉션 {name}을 만들었습니다.',
        collectionCreateFailed: '기준 저장 트리를 갱신하기 전에 컬렉션 생성에 실패했습니다.',
        collectionRenamed: '기준 저장 트리에서 컬렉션 이름을 {name}(으)로 바꿨습니다.',
        collectionRenameFailed: '기준 저장 트리를 갱신하기 전에 컬렉션 이름 변경에 실패했습니다.',
        collectionDeleted: '기준 저장 트리에서 컬렉션 {name}을 삭제했습니다. 이 컬렉션을 가리키던 draft는 기본 저장 위치로 이동했습니다.',
        collectionDeleteFailed: '기준 저장 트리를 갱신하기 전에 컬렉션 삭제에 실패했습니다.',
        requestGroupCreated: '기준 저장 트리에 요청 그룹 {name}을 만들었습니다.',
        requestGroupCreateFailed: '기준 저장 트리를 갱신하기 전에 요청 그룹 생성에 실패했습니다.',
        requestGroupRenamed: '기준 저장 트리에서 요청 그룹 이름을 {name}(으)로 바꿨습니다.',
        requestGroupRenameFailed: '기준 저장 트리를 갱신하기 전에 요청 그룹 이름 변경에 실패했습니다.',
        requestGroupDeleted: '기준 저장 트리에서 요청 그룹 {name}을 삭제했습니다. 이 그룹을 가리키던 draft는 기본 저장 위치로 이동했습니다.',
        requestGroupDeleteFailed: '기준 저장 트리를 갱신하기 전에 요청 그룹 삭제에 실패했습니다.',
        bundleCollectionCount: '번들 안의 컬렉션: {count}',
        bundleRequestGroupCount: '번들 안의 요청 그룹: {count}',
        bundleRequestCount: '번들 안의 저장 요청: {count}',
        bundleMockRuleCount: '번들 안의 mock rule: {count}',
        bundleScriptCount: '번들 안의 저장 스크립트: {count}',
        createdCollections: '생성된 컬렉션: {count}',
        createdRequestGroups: '생성된 요청 그룹: {count}',
        createdRequests: '생성된 요청: {count}',
        createdMockRules: '생성된 mock rule: {count}',
        createdScripts: '생성된 저장 스크립트: {count}',
        renamedOnImport: '가져오기 중 이름 변경: {count}',
        rejectedDuringValidation: '검증 중 거부: {count}',
        importedPreview: '가져오기 미리보기: {names}',
        rejectedReasons: '거부 사유: {reasons}',
        runtimeExcluded:
          '런타임 히스토리, 캡처, 실행 artifact는 계속 제외됩니다.',
      },
      tree: {
        kindCollection: '컬렉션',
        kindRequestGroup: '요청 그룹',
        requestGroupCount: '요청 그룹 {count}개',
        requestCount: '요청 {count}개',
        deleteCollectionRequiresEmpty: '컬렉션이 비어 있어야 삭제할 수 있습니다.',
        deleteRequiresEmpty: '그룹이 비어 있어야 삭제할 수 있습니다.',
        createCollectionHint: '컬렉션은 기준 탐색기 트리에서 요청 그룹과 저장 요청을 소유합니다.',
        noRequestGroups: '이 컬렉션에는 아직 요청 그룹이 없습니다.',
      },
      fields: {
        collectionName: '컬렉션 이름',
        requestGroupName: '요청 그룹 이름',
      },
      prompts: {
        renameCollection: '컬렉션 "{name}" 이름 변경',
        deleteCollection: '컬렉션 "{name}"을(를) 삭제할까요?',
        renameRequestGroup: '요청 그룹 "{name}" 이름 변경',
        deleteRequestGroup: '요청 그룹 "{name}"을(를) 삭제할까요?',
        deleteSavedRequest: '저장 요청 "{name}"을(를) 삭제할까요?',
      },
      selection: {
        current: '현재 선택: {path}',
        none: '탐색기에서 선택된 저장 요청이 없습니다.',
      },
    },
    management: {
      ariaLabel: '저장 리소스 관리자',
      header: {
        eyebrow: '저장 리소스 관리자',
        title: '저장된 작업공간 리소스 관리',
        summary:
          '이 보조 패널은 authored-resource 전송과 집중된 이름 변경/삭제 제어를 제공하고, 재귀 explorer 액션은 트리 안에서 1급 동작으로 유지됩니다.',
      },
      badges: {
        savedTree: '저장 트리',
        mainSurface: '메인 surface',
      },
      sections: {
        transferTitle: '작성 리소스 전송',
        transferDescription:
          '탐색기를 변경 레인으로 쓰지 않고 메인 surface에서 작성 리소스를 내보내거나 미리 본 뒤 가져옵니다.',
        collectionTitle: '컬렉션',
        collectionDescription:
          '컬렉션은 header나 explorer에서 만들고, 여기서는 선택된 컬렉션의 이름 변경과 삭제를 정리합니다.',
        requestGroupTitle: '요청 그룹',
        requestGroupDescription:
          '현재 선택된 요청 그룹을 여기에서 검토, 이름 변경, 삭제할 수 있고, 중첩 그룹도 전체 경로와 함께 선택할 수 있습니다.',
        requestTitle: '저장 요청 동작',
        requestDescription:
          '요청 생성은 탭 스트립에 남고, 요청 편집은 빌더에 남습니다. 활성 탭이 저장 요청일 때만 여기서 내보내기와 삭제를 수행합니다.',
      },
      fields: {
        manageCollection: '관리할 컬렉션',
        manageRequestGroup: '관리할 요청 그룹',
      },
      actions: {
        exportSavedRequest: '저장 요청 내보내기',
        deleteSavedRequest: '저장 요청 삭제',
      },
      context: {
        labels: {
          selectedCollection: '선택된 컬렉션',
          requestGroupCount: '요청 그룹 수',
          selectedRequestGroup: '선택된 요청 그룹',
          requestCount: '저장 요청 수',
          activeTab: '활성 탭',
          tabState: '탭 상태',
          savePlacement: '저장 위치',
        },
        values: {
          savedRequest: '저장 요청 탭',
          detachedDraft: '분리된 draft',
          replayDraft: '리플레이 draft',
          workingDraft: '작업 중 draft',
          noActiveTab: '활성 탭 없음',
          noneSelected: '선택 없음',
        },
      },
      state: {
        activePlacement: '활성 저장 위치: {path}',
        noActivePlacement: '아직 선택된 활성 저장 위치가 없습니다.',
        transferBoundary:
          '가져오기와 내보내기는 작성된 요청 정의, mock rule, 그리고 독립 저장 스크립트에만 한정됩니다. 런타임 히스토리, 캡처, 실행 artifact는 계속 제외됩니다.',
        collectionCount: '선택한 컬렉션 트리에는 요청 그룹이 {count}개 있습니다.',
        collectionUnavailable: '아직 관리할 컬렉션이 없습니다.',
        requestCount: '선택한 요청 그룹에는 저장 요청이 {count}개 있습니다.',
        requestGroupUnavailable: '요청 그룹을 관리하려면 먼저 컬렉션을 선택하세요.',
        requestSelected: '저장 요청 {name}을 관리하는 중입니다.',
        requestDetached:
          '이 탭은 저장 요청이 삭제되면서 정규 저장 트리에서 분리된 draft입니다. 다시 저장하면 새 정규 요청으로 복귀할 수 있습니다.',
        requestDraft: '이 탭은 아직 작업 중 draft 또는 replay draft입니다. 정규 저장 트리에 다시 합류하려면 먼저 저장하세요.',
        requestUnavailable: '저장 요청 정의를 내보내거나 삭제하려면 저장 요청 탭을 여세요.',
      },
    },
    tabShell: {
      empty:
        '아직 열린 요청 탭이 없습니다. 새 draft를 시작하거나 작업공간 탐색기에서 저장된 요청을 여세요.',
      newRequest: '새 요청',
      quickRequest: '빠른 요청',
      ariaLabel: '요청 탭 스트립',
      dirtyIndicator: '{title}에 저장되지 않은 변경이 있습니다',
      pinAction: '고정',
      pinTab: '{title} 고정',
      closeTab: '{title} 닫기',
      sourcePreview: '미리보기',
      sourceQuick: '빠른',
      sourceReplay: '리플레이',
      sourceDetached: '분리됨',
    },
    requestBuilder: {
      defaultTitle: '제목 없는 요청',
      empty: {
        noSelectionTitle: '선택된 요청 탭이 없습니다',
        noSelectionDescription:
          '작성하려면 저장된 요청을 열거나 draft를 만드세요. 응답은 오른쪽 관측 패널에 유지되고, 히스토리·캡처·모크는 별도의 관측 또는 규칙 관리 경로로 남습니다.',
        createDraftAction: '요청 초안 만들기',
        preparingTitle: '요청 draft를 준비하는 중',
        preparingDescription:
          '이 탭은 새로운 작성 컨텍스트를 만들고 있습니다. replay와 다른 관측 기록은 항상 새 draft로 복사되며 제자리에서 편집되지 않습니다.',
      },
      header: {
        eyebrow: '요청 빌더 핵심',
        description:
          '이 탭은 편집 가능한 요청 상태만 소유합니다. Save는 요청 정의를 갱신하고, Run은 히스토리나 캡처를 바꾸지 않은 채 오른쪽 패널에 별도 관측을 만듭니다.',
      },
      badges: {
        savedRequest: '저장된 요청',
        detachedDraft: '분리된 draft',
        newDraft: '새 draft',
        dirty: '변경됨',
      },
      location: {
        unsavedDraft: '저장되지 않은 draft',
        defaultSavePlacement: '기본 저장 위치: {path}',
      },
      detached: {
        title: '분리된 draft',
        description: '이 탭 뒤에 있던 저장 요청이 삭제되었습니다. 편집 가능한 요청 상태는 유지되지만, 이제 정규 저장 트리에 속하지 않습니다.',
        saveTarget: '{path} 위치에 다시 저장하면 정규 저장 요청으로 복귀합니다.',
        noSaveTarget: '저장 위치를 선택한 뒤 다시 저장하면 정규 저장 요청으로 복귀합니다.',
      },
      status: {
        saveUpToDate: '저장된 요청 정의가 최신 상태입니다.',
        saveAtTime: '{time}에 요청 정의를 저장했습니다.',
        saveFallback: 'Save는 요청 정의만 갱신합니다.',
        runFallback: 'Run은 오른쪽 패널에 별도 관측 기록을 만듭니다.',
        saveError: '요청 정의 저장에 실패했습니다.',
        runError: '요청 실행에 실패했습니다.',
      },
      disabledReasons: {
        noDraftSave: '저장하려면 요청 탭을 먼저 여세요.',
        nameRequiredSave: '저장 전에 요청 이름을 입력하세요.',
        urlRequiredSave: '저장 전에 요청 URL을 입력하세요.',
        savePending: '저장이 이미 진행 중입니다.',
        noDraftRun: '실행하려면 요청 탭을 먼저 여세요.',
        urlRequiredRun: '실행 전에 요청 URL을 입력하세요.',
        malformedJsonRun: '실행 전에 잘못된 JSON 본문을 수정하세요.',
        runPending: '실행이 이미 진행 중입니다.',
        linkedScriptMissing: '실행 전에 {stageLabel} 단계의 누락된 연결 저장 스크립트를 복구하거나 분리하세요.',
        linkedScriptMismatch: '실행 전에 {stageLabel} 단계의 유형이 맞지 않는 연결 저장 스크립트를 복구하거나 분리하세요.',
      },
      failedRun: {
        requestSnapshotUnavailableTarget: '요청 스냅샷을 사용할 수 없음',
        inputSummary: '파라미터 {paramCount}개 · 헤더 {headerCount}개 · {bodySummary} · {authSummary}',
        bodySummary: {
          none: '본문 없음',
          json: 'JSON 본문',
          text: '텍스트 본문',
          formUrlencoded: '폼 본문',
          multipartFormData: '멀티파트 본문',
        },
        authSummary: {
          none: '인증 없음',
          bearer: 'Bearer 인증',
          basic: 'Basic 인증',
          apiKeyHeader: '헤더 API 키',
          apiKeyQuery: '쿼리 API 키',
        },
        requestSnapshotSummary: '활성 Workspace draft에서 {method} {targetUrl} 요청을 {inputSummary} 구성으로 실행했습니다.',
        responseHeadersSummary: '응답 헤더가 기록되지 않았습니다.',
        responseBodyHint: '이 실패한 실행에는 응답 payload를 사용할 수 없습니다.',
        responsePreviewPolicy: 'transport가 완료되기 전에 실행 경로가 실패했기 때문에 응답 미리보기를 사용할 수 없습니다.',
        consoleSummary: '제한된 스크립트 진단을 요약하기 전에 실행 경로가 실패했기 때문에 콘솔 항목이 기록되지 않았습니다.',
        testsSummary: 'tests 단계가 완료되기 전에 실행 경로가 실패했기 때문에 테스트가 기록되지 않았습니다.',
        transportStageLabel: '전송',
        transportStageSummary: 'run endpoint가 제한된 진단을 반환하기 전에 transport가 실패했습니다.',
      },
      fields: {
        requestName: '요청 이름',
        saveCollection: '저장 컬렉션',
        saveRequestGroup: '저장 요청 그룹',
        requestEnvironment: '요청 환경',
        requestMethod: '요청 메서드',
        requestUrl: '요청 URL',
      },
      placement: {
        selected: '{path} 위치에 저장됩니다.',
        pendingCreate: '첫 저장 시 {path}에 {groupName} 그룹이 생성됩니다.',
        pendingOption: '{name} (첫 저장 시 생성)',
        unavailable: '아직 정규 저장 위치를 선택할 수 없습니다.',
        noRequestGroups: '저장 위치를 사용하려면 요청 그룹을 먼저 만드세요.',
      },
      environment: {
        noEnvironment: '환경 없음',
        missingReferenceOption: '누락된 환경 참조',
        defaultBadge: '기본 환경',
        missingBadge: '누락된 환경',
        loading: '요청 단위 선택을 위해 작업공간 환경을 불러오는 중입니다.',
        degraded:
          '환경 목록 상태가 저하되었습니다. environments route가 다시 응답하기 전까지 저장된 환경 검증이 불가능할 수 있습니다.',
        missing:
          '선택한 환경 참조가 이 작업공간에 없습니다. 저장하거나 실행하기 전에 다른 환경이나 환경 없음을 선택하세요.',
        selected:
          '{name} 환경이 이 요청의 실행 시점에 활성 변수 {count}개를 제공합니다.',
        noneSelected: '환경을 선택하지 않았습니다. 이 요청은 작성된 값만으로 실행됩니다.',
      },
      commands: {
        save: '저장',
        saving: '저장 중...',
        duplicate: '복제',
        run: '실행',
        running: '실행 중...',
        replayIntro:
          'Replay draft는 여전히 edit-first 모드로 열립니다. Save는 요청 정의를 만들거나 갱신하고, Run은 이 draft에 대해서만 별도 관측을 만듭니다.',
        defaultIntro:
          'Save는 요청 정의를 갱신합니다. Run은 자동 저장하지 않으며, 작성 중인 변경도 지우지 않습니다.',
        duplicateDeferred:
          'Duplicate는 저장된 요청 복제 의미가 추가되는 이후 slice로 미뤄져 있습니다.',
      },
      tabs: {
        params: '파라미터',
        headers: '헤더',
        body: '본문',
        auth: '인증',
        scripts: '스크립트',
      },
      paramsEditor: {
        title: '파라미터',
        description:
          '쿼리 파라미터를 요청 작성 입력으로 편집합니다. Run은 활성 행만 적용하고, Save는 작성된 정의를 그대로 저장합니다.',
        empty: '아직 파라미터가 없습니다. 이 요청에 쿼리 입력이 필요할 때만 행을 추가하세요.',
        addAction: '파라미터 추가',
        rowLabel: '파라미터',
      },
      headersEditor: {
        title: '헤더',
        description:
          '요청 헤더를 런타임 히스토리나 캡처에 묶지 않고 편집합니다. Save는 헤더를 저장하고, Run은 활성 행만 이번 실행에 적용합니다.',
        empty: '아직 헤더가 없습니다. 이 요청에 명시적 헤더 값이 필요할 때 행을 추가하세요.',
        addAction: '헤더 추가',
        rowLabel: '헤더',
      },
      bodyEditor: {
        title: '본문',
        description:
          '가벼운 작성 모드를 선택합니다. Save는 본문 입력을 저장하고, Run은 관측 상태를 draft로 되돌리지 않은 채 현재 작성된 본문을 보냅니다.',
        modeLabel: '본문 모드',
        empty: '이 요청 draft에는 본문 내용이 연결되어 있지 않습니다.',
        contentJsonLabel: '본문 내용 (JSON)',
        contentTextLabel: '본문 내용 (텍스트)',
        formTitle: '폼 본문',
        formDescription:
          'x-www-form-urlencoded 본문을 키/값 행으로 작성합니다. Save는 이를 저장하고, Run은 활성 행만 인코딩합니다.',
        formEmpty: '아직 폼 필드가 없습니다. 인코딩된 본문 입력을 준비하려면 행을 추가하세요.',
        formAddAction: '폼 필드 추가',
        formRowLabel: '폼 필드',
        multipartTitle: '멀티파트 본문',
        multipartDescription:
          '멀티파트 행만 작성합니다. 실제 파일 첨부 UX는 아직 유예되었지만, 활성 행은 저장된 정의에 이미 보존됩니다.',
        multipartEmpty:
          '아직 멀티파트 행이 없습니다. 이후 구현을 위해 기본 필드나 파일 placeholder를 추가하세요.',
        multipartAddAction: '멀티파트 필드 추가',
        multipartRowLabel: '멀티파트 필드',
      },
      bodyModeOptions: {
        none: '없음',
        json: 'JSON',
        text: '텍스트',
        formUrlencoded: 'x-www-form-urlencoded',
        multipartFormData: 'multipart/form-data',
      },
      authEditor: {
        title: '인증',
        description:
          '여기서 인증은 가볍게 유지됩니다. Save는 작성된 인증 필드를 저장하고, Run은 히스토리나 캡처 관측 상태를 재사용하지 않고 이번 요청에만 적용합니다.',
        typeLabel: '인증 타입',
        empty: '이 요청 draft에는 인증이 연결되어 있지 않습니다.',
        bearerToken: 'Bearer 토큰',
        username: '사용자 이름',
        password: '비밀번호',
        apiKeyName: 'API 키 이름',
        apiKeyValue: 'API 키 값',
        apiKeyPlacement: 'API 키 위치',
      },
      authTypeOptions: {
        none: '없음',
        bearer: 'Bearer 토큰',
        basic: 'Basic 인증',
        apiKey: 'API 키',
      },
      apiKeyPlacementOptions: {
        header: '헤더',
        query: '쿼리',
      },
      loadingScripts: {
        title: '스크립트',
        description:
          '무거운 작성 경로가 초기화되는 동안에도 파라미터·헤더·본문·인증이 반응성을 유지하도록 단계 인식 스크립트 편집기를 필요할 때만 로드합니다.',
        lazyPathTitle: '지연 편집기 경로',
        lazyPathDescription:
          '이 fallback은 대기 이유를 설명합니다. Scripts가 활성화될 때만 스크립트 편집기 번들을 불러옵니다. 고급 편집 보조 기능은 여전히 유예되어 있지만, 제한된 스크립트 실행은 다른 곳에 관측 요약을 기록합니다.',
      },
    },
    keyValueEditor: {
      labels: {
        enabled: '{rowLabel} {index}행 사용',
        key: '{rowLabel} {index}행 키',
        value: '{rowLabel} {index}행 값',
      },
      removeAction: '제거',
      removeAriaLabel: '{rowLabel} {index}행 제거',
    },
    scriptsEditor: {
      header: {
        title: '스크립트',
        description:
          '스크립트는 요청 단위이면서 draft 소유 상태로 유지됩니다. 이 surface는 작성용으로 남고, Run은 단계 인식 스크립트를 제한적으로 실행해 redacted 요약을 관측 패널과 저장된 히스토리에 보냅니다.',
      },
      stages: {
        preRequest: {
          label: '사전 요청',
          ariaLabel: '사전 요청',
          fieldAriaLabel: '사전 요청 스크립트',
          guidanceAriaLabel: '사전 요청 가이드',
          eyebrow: '전송 전',
          title: '요청 입력 준비',
          description:
            '전송 전에 헤더를 계산하거나 본문을 다듬고 임시 값을 준비하는 등 요청 단위 설정에 이 단계를 사용합니다.',
          helperFirst:
            '응답 검토보다 요청 준비 범위에만 작업을 머무르게 하세요.',
          helperSecond:
            '여기서는 제한된 요청 변경과 명시적 런타임 helper만 사용할 수 있습니다. 더 넓은 capability 확장은 유예됩니다.',
          helperThird:
            'Replay 출처 정보는 메타데이터로만 남고, 이 slice에서 스크립트 전역 값이 되지 않습니다.',
          exampleLabel: '사용 예시',
        },
        postResponse: {
          label: '응답 후',
          ariaLabel: '응답 후',
          fieldAriaLabel: '응답 후 스크립트',
          guidanceAriaLabel: '응답 후 가이드',
          eyebrow: '전송 후',
          title: '응답 처리 의도 요약',
          description:
            '가벼운 응답 후 진단에 이 단계를 사용합니다. 제한된 콘솔 요약과 파생 실행 메모는 전송 뒤에 실행되고, 더 풍부한 진단은 계속 유예됩니다.',
          helperFirst:
            '응답이 도착한 뒤 남기고 싶은 요약 로직이나 redaction 메모를 기록하세요.',
          helperSecond:
            '히스토리나 결과 패널 데이터가 이 작성 상태로 아직 흘러들어오지 않는다고 가정하세요.',
          helperThird:
            '더 풍부한 진단과 실행 연결 콘솔 출력은 계속 유예됩니다.',
          exampleLabel: '사용 예시',
        },
        tests: {
          label: '테스트',
          ariaLabel: '테스트',
          fieldAriaLabel: '테스트 스크립트',
          guidanceAriaLabel: '테스트 가이드',
          eyebrow: '나중에 단언',
          title: '요청 단위 단언 계획',
          description:
            '단언 작성을 위해 이 단계를 사용합니다. 제한된 pass/fail 요약은 결과 패널과 저장된 히스토리로 흘러가고, 더 풍부한 진단은 계속 유예됩니다.',
          helperFirst:
            '단언을 히스토리나 캡처 상세 패널에 묶지 말고 요청 단위로 유지하세요.',
          helperSecond:
            '재사용 가능한 스크립트 템플릿과 공유 라이브러리는 아직 유예된 범위입니다.',
          helperThird:
            '편집기 보조 기능, Monaco, 더 풍부한 진단은 이후 slice에서 들어옵니다.',
          exampleLabel: '사용 예시',
        },
      },
      guidance: {
        tabListAriaLabel: '스크립트 단계',
        loadedOnDemand:
          '이 편집기 경로는 필요할 때만 로드되므로, Scripts가 비활성일 때는 단계 실행 연결이 들어온 이후에도 나머지 요청 빌더가 반응성을 유지합니다.',
      },
      attach: {
        title: '저장 스크립트 연결',
        description: '호환되는 저장 스크립트 하나를 골라 현재 단계로 복사하거나, 저장 소스에 계속 연결된 상태로 유지합니다.',
        selectLabel: '저장 스크립트',
        copyAction: '단계로 복사',
        replaceAction: '저장 스크립트로 교체',
        linkAction: '단계에 연결',
        relinkAction: '단계 다시 연결',
        detachAction: '복사본으로 분리',
        openLibraryAction: 'Scripts 라이브러리 열기',
        previewLabel: '저장 스크립트 미리보기',
        loading: '이 단계와 호환되는 저장 스크립트를 불러오는 중입니다.',
        degraded: '지금은 저장 스크립트 라이브러리를 불러올 수 없습니다. Scripts 경로가 다시 응답하면 다시 시도하세요.',
        empty: '아직 이 단계와 호환되는 저장 스크립트가 없습니다.',
        copiedBadge: '복사됨',
        copiedHint: '저장 스크립트에서 복사됨: {name}',
        linkedTitle: '연결된 저장 스크립트',
        linkedDescription: '이 단계는 저장 스크립트 참조를 따르기 때문에 읽기 전용입니다.',
        linkedBadge: '연결됨',
        linkedBrokenBadge: '연결 깨짐',
        linkedNameLabel: '저장 스크립트',
        linkedPreviewLabel: '현재 소스 미리보기',
        linkedResolvedHint: '이 단계는 실행 시 {name}의 현재 저장 소스를 사용합니다.',
        linkedMissingSummary: '연결된 저장 스크립트를 찾을 수 없습니다. 실행 전에 참조를 복구하거나 인라인 복사본으로 분리하세요.',
        linkedMismatchSummary: '연결된 저장 스크립트가 이 단계 타입과 더 이상 맞지 않습니다. 실행 전에 다시 연결하거나 분리하세요.',
        linkedSnapshotHint: '연결 당시 이름 스냅샷: {name}',
      },
      footer: {
        title: '나중 slice에서 처리',
        description:
          '재사용 가능한 스크립트 관리, 더 풍부한 진단, 더 넓은 capability surface, Monaco나 intellisense 확장은 명시적으로 이후 slice 작업으로 남아 있습니다.',
      },
    },
    resultPanel: {
      tabs: {
        ariaLabel: '결과 패널 탭',
        response: '응답',
        console: '콘솔',
        tests: '테스트',
        executionInfo: '실행 정보',
      },
      empty: {
        waitingTitle: '활성 요청 탭을 기다리는 관측 패널',
        waitingDescription:
          '먼저 요청 탭을 여세요. 가운데 패널은 작성 상태를 소유하고, Save는 요청 정의를 갱신하며, Run은 이 패널을 편집 상태로 바꾸지 않은 채 제한된 관측 결과만 여기로 보냅니다.',
      },
      header: {
        eyebrow: '관측 surface',
        title: '{title}에 대한 관측',
        description:
          '오른쪽 패널은 실행 관측 전용입니다. Save는 이 패널을 갱신하지 않으며, 요청 작성은 가운데 작성 surface에 남습니다.',
      },
      source: {
        replayDraft: '리플레이 draft',
        draftRequestTab: 'draft 요청 탭',
        detachedDraft: '분리된 draft',
        savedRequest: '저장된 요청',
        savedInCollection: '{collectionName}에 저장됨',
        savedInCollectionRequestGroup: '{collectionName} / {requestGroupName}에 저장됨',
      },
      detached: {
        title: '정규 저장 트리에서 분리됨',
        description: '기존 실행 결과는 과거 스냅샷으로 남아 있지만, 이 탭은 다시 저장할 때까지 draft처럼 동작합니다.',
      },
      linkage: {
        noSavedPlacementRecorded: '저장 위치 기록이 없습니다',
        draftSavePlacement: 'draft 저장 위치: {placement}',
        noLinkedSavedRequest: '연결된 저장 요청이 없습니다',
      },
      common: {
        durationMs: '{durationMs}ms',
        transportNoResponse: '응답 없음',
        workspaceRoot: '워크스페이스',
      },
      summary: {
        title: '{tabLabel} 요약',
        description:
          '관측 결과는 편집 가능한 요청 draft와 분리되어 유지됩니다. Run은 가운데 작성 패널의 미저장 변경을 지우지 않고 이곳에 실행 결과를 만듭니다.',
        badges: {
          running: '실행 중',
          noExecutionYet: '아직 실행 없음',
          latestAriaLabel: '최신 실행 결과 배지',
          testsReady: '테스트 결과 {count}개',
          consoleReady: '콘솔 줄 {count}개',
        },
        labels: {
          activeRequest: '활성 요청',
          method: '메서드',
          tabSource: '탭 출처',
          visibleSlot: '표시 슬롯',
          runLane: '실행 레인',
        },
        values: {
          executionInProgress: '실행이 진행 중입니다',
          noExecutionYet: '아직 실행이 없습니다',
        },
        preview: {
          testsTitle: '테스트 미리보기',
          testsDescription: '핵심 assertion 피드백을 실행 직후 여기에 고정해 탭을 전환하지 않아도 바로 판단할 수 있게 합니다.',
          testsAriaLabel: '테스트 미리보기',
          testsEmpty: '최신 실행에서는 테스트가 기록되지 않았습니다.',
          consoleTitle: '콘솔 미리보기',
          consoleDescription: '최근 제한된 콘솔 줄을 실행 직후 여기에 노출해 첫 피드백 시간을 줄입니다.',
          consoleAriaLabel: '콘솔 미리보기',
          consoleEmpty: '최신 실행에서는 콘솔 항목이 기록되지 않았습니다.',
        },
      },
      response: {
        title: '응답 상세',
        description:
          '응답 상세는 이 활성 탭의 최신 실행에만 속합니다. 미리보기는 여기에서 제한적으로 유지되며, 잘림이나 redaction 메모도 payload surface를 확장하지 않고 명시적으로 남습니다.',
        runningTitle: '요청을 실행하는 중',
        runningDescription:
          '요청이 진행 중입니다. 현재 실행이 끝나면 응답 헤더, 제한된 미리보기 크기, 본문 미리보기가 여기 표시됩니다.',
        labels: {
          httpStatus: 'HTTP 상태',
          duration: '소요 시간',
          previewSize: '미리보기 크기',
          previewPolicy: '미리보기 정책',
          headersSummary: '헤더 요약',
          bodyHint: '본문 힌트',
        },
        values: {
          noPreviewStored: '저장된 미리보기가 없습니다',
          previewPolicyFallback:
            '더 풍부한 진단과 raw payload 확인이 추가되기 전까지 미리보기는 제한적으로 유지됩니다.',
          previewSupportFallback:
            '이 관측 surface에서는 미리보기가 제한적으로 유지되며, 더 풍부한 검사는 이후 slice로 남아 있습니다.',
          noBodyPreview: '응답 본문 미리보기가 기록되지 않았습니다.',
        },
        empty: {
          title: '응답을 채우려면 이 요청을 실행하세요',
          description:
            'Save는 요청 정의만 갱신합니다. 현재 draft를 실행해 응답 상태, 제한된 미리보기 메타데이터, 헤더, 본문 미리보기를 여기에 채우세요.',
        },
      },
      console: {
        title: '콘솔 상세',
        description:
          '콘솔은 관측 전용으로 유지되며, 스크립트가 실행되면 제한된 단계 인식 출력을 보여줍니다. 누락된 항목도 추측하지 않고 명시적으로 설명합니다.',
        labels: {
          logLines: '로그 줄 수',
          warnings: '경고',
          preRequestStage: '사전 요청 단계',
          postResponseStage: '응답 후 단계',
          summary: '요약',
        },
        noEntriesTitle: '이번 실행에는 콘솔 항목이 없습니다',
        empty: {
          title: '콘솔은 실행을 기다립니다',
          description:
            '현재 요청을 실행하면 이 탭과 연결된 제한된 사전 요청 및 응답 후 콘솔 요약이 기록됩니다. 비어 있는 단계도 여기에서 명시적으로 설명됩니다.',
        },
      },
      tests: {
        title: '테스트 상세',
        description:
          '테스트는 관측 전용으로 유지되며, 존재할 때만 tests 단계의 제한된 assertion 요약을 보여줍니다. 누락된 assertion도 만들어내지 않고 명시적으로 남깁니다.',
        labels: {
          summary: '요약',
          entries: '항목 수',
          testsStage: '테스트 단계',
        },
        noEntriesTitle: '이번 실행에서는 테스트가 수행되지 않았습니다',
        empty: {
          title: '테스트는 실행을 기다립니다',
          description:
            '현재 요청을 실행해 제한된 assertion 요약을 기록하세요. tests script가 없으면 tests 단계는 건너뛰고 그 이유를 여기에서 설명합니다.',
        },
      },
      executionInfo: {
        title: '실행 정보',
        description:
          '실행 메타데이터는 최신 실행에 속하며 저장된 요청 정의, 인바운드 캡처, 저장된 히스토리와 분리되어 유지됩니다.',
        startingTitle: '실행을 시작하는 중',
        startingDescription:
          '현재 요청이 완료되면 로컬 실행 ID, 타이밍 데이터, 제한된 요청 스냅샷 요약이 여기에 표시됩니다.',
        executionStageSummaryAriaLabel: '실행 단계 요약',
        labels: {
          executionId: '실행 ID',
          startedAt: '시작 시각',
          completedAt: '완료 시각',
          outcome: '결과',
          snapshotSource: '스냅샷 출처',
          linkedRequest: '연결된 요청',
          placement: '위치',
          environment: '환경',
          errorCode: '오류 코드',
          errorSummary: '오류 요약',
          requestInput: '요청 입력',
        },
        values: {
          savedRequestSnapshot: '저장 요청 스냅샷',
          adHocRequestSnapshot: '임시 요청 스냅샷',
          runtimeRequestSnapshot: '런타임 요청 스냅샷',
          noEnvironmentSelected: '선택된 환경이 없습니다',
          noExecutionErrorCode: '실행 오류 코드가 없습니다',
          noExecutionErrorSummary: '보고된 실행 오류가 없습니다.',
          requestSnapshotSummaryMissing: '요청 스냅샷 요약이 반환되지 않았습니다.',
        },
        environmentResolution: {
          title: '환경 해석',
          labels: {
            status: '상태',
            resolvedPlaceholders: '해석된 placeholder',
            unresolvedPlaceholders: '미해결 placeholder',
            affectedInputAreas: '영향받은 입력 영역',
          },
          status: {
            notSelected: '환경 미선택',
            resolved: '해석 완료',
            missingEnvironment: '환경 참조 누락',
            unresolvedPlaceholders: '미해결 placeholder',
            invalidResolvedJson: '해석 후 JSON 오류',
          },
          areas: {
            url: 'URL',
            params: '파라미터',
            headers: '헤더',
            body: '본문',
            auth: '인증',
            none: '없음',
          },
        },
        empty: {
          title: '아직 실행 정보가 없습니다',
          description:
            '이 탭에 대한 새 실행 기록을 만들려면 Run을 사용하세요. Save 성공만으로는 이 관측 패널의 실행 정보가 채워지지 않습니다.',
        },
      },
      batch: {
        header: {
          eyebrow: '배치 결과',
          titleFallback: '워크스페이스 배치 실행',
          description:
            '컬렉션과 그룹 실행은 현재 셸 레이아웃을 바꾸지 않고 이 패널에서 순차 결과를 보여줍니다.',
        },
        containerLabels: {
          collection: '컬렉션 배치 실행',
          requestGroup: '요청 그룹 배치 실행',
        },
        status: {
          running: '배치 실행 중',
          noRunYet: '아직 배치 실행이 없습니다',
          runningContainer: '{name} 실행 중...',
          collectionFailed: '컬렉션 배치 실행에 실패했습니다.',
          requestGroupFailed: '요청 그룹 배치 실행에 실패했습니다.',
          noRequestsFound: '이 컨테이너에서 저장 요청을 찾지 못했습니다.',
          noStepsRecorded: '기록된 배치 단계가 없습니다.',
          noExecutionSelected: '선택된 배치 실행이 없습니다.',
          noConsoleCaptured: '이 배치 실행에서는 콘솔 출력이 기록되지 않았습니다.',
          noTestsCaptured: '이 배치 실행에서는 테스트 결과가 기록되지 않았습니다.',
          noOutputTitle: '콘솔 출력이 없습니다',
          noOutputDescription:
            '이 배치 실행은 저장된 콘솔 항목이나 오류 요약 없이 완료되었습니다.',
        },
        badges: {
          batchRun: '배치 실행',
          latestAriaLabel: '최신 배치 실행 배지',
          steps: '단계 {count}개',
          issues: '이슈 {count}개',
          succeeded: '성공 {count}개',
        },
        summary: {
          title: '배치 요약 · {tabLabel}',
          description: '배치 실행 요약은 기존 결과 surface에 유지됩니다.',
          labels: {
            scope: '범위',
            container: '컨테이너',
            order: '순서',
            runLane: '실행 레인',
            requests: '요청 수',
          },
          values: {
            pendingSelection: '선택 대기 중',
            depthFirst: '깊이 우선',
            executionInProgress: '배치 실행 진행 중',
            noExecutionYet: '아직 배치 실행이 없습니다',
          },
          preview: {
            stepTitle: '단계 미리보기',
            stepDescription: '이 배치 실행의 순서화된 요청 단계입니다.',
            stepAriaLabel: '배치 단계 미리보기',
            consoleTitle: '콘솔 미리보기',
            consoleDescription: '배치 실행 전반의 콘솔과 실패 하이라이트입니다.',
            consoleAriaLabel: '배치 콘솔 미리보기',
          },
        },
        response: {
          title: '배치 응답 요약',
          description: '집계 결과와 순서화된 요청 결과입니다.',
          runningTitle: '배치 실행 진행 중',
          runningDescription: '각 요청이 완료되면 응답이 여기에 표시됩니다.',
          emptyTitle: '아직 배치 실행이 없습니다',
          emptyDescription: '컬렉션이나 요청 그룹을 실행해 집계 결과를 여기서 확인하세요.',
          labels: {
            started: '시작',
            completed: '완료',
            succeeded: '성공',
            failed: '실패',
            blocked: '차단',
            timedOut: '시간 초과',
          },
          stepsAriaLabel: '배치 응답 단계',
        },
        console: {
          title: '배치 콘솔',
          description: '순서화된 단계 전반의 콘솔 로그와 오류 요약입니다.',
          labels: {
            requestsWithLogs: '로그가 있는 요청 수',
            totalConsoleLines: '총 콘솔 줄 수',
            failedOrBlocked: '실패 또는 차단',
            continueOnError: '오류 후 계속',
          },
          values: {
            enabled: '사용',
            disabled: '사용 안 함',
          },
          emptyTitle: '아직 배치 실행이 없습니다',
          emptyDescription: '컬렉션이나 요청 그룹을 실행해 콘솔 세부를 여기서 확인하세요.',
        },
        tests: {
          title: '배치 테스트',
          description: '현재 배치 실행의 단계별 테스트 요약입니다.',
          labels: {
            steps: '단계',
            succeeded: '성공',
            failed: '실패',
            timedOut: '시간 초과',
          },
          emptyTitle: '아직 배치 실행이 없습니다',
          emptyDescription: '컬렉션이나 요청 그룹을 실행해 테스트 요약을 여기서 확인하세요.',
        },
        executionInfo: {
          title: '배치 실행 정보',
          description: '최신 배치 실행의 컨테이너 메타데이터와 실행 식별자입니다.',
          preparingTitle: '배치 실행을 준비하는 중',
          preparingDescription: '첫 요청이 시작되면 실행 메타데이터가 여기에 표시됩니다.',
          emptyTitle: '아직 배치 실행이 없습니다',
          emptyDescription: '컬렉션이나 요청 그룹을 실행해 실행 메타데이터를 여기서 확인하세요.',
          labels: {
            batchExecutionId: '배치 실행 ID',
            containerType: '컨테이너 유형',
            containerId: '컨테이너 ID',
            startedAt: '시작 시각',
            completedAt: '완료 시각',
            duration: '소요 시간',
            executionOrder: '실행 순서',
            continueOnError: '오류 후 계속',
          },
          values: {
            enabled: '사용',
            disabled: '사용 안 함',
          },
          stepsAriaLabel: '배치 실행 단계',
        },
      },
    },
  },
};


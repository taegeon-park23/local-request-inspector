import { SectionPlaceholder } from '@client/features/shared-section-placeholder';

export function WorkspacePlaceholder() {
  return (
    <SectionPlaceholder
      title="Workspace"
      summary="Workspace section scaffold for the persistent shell."
      sidebarLabel="Workspace sidebar and explorer content will land in a later slice."
      detailLabel="Workspace contextual result and detail content will land in a later slice."
    />
  );
}

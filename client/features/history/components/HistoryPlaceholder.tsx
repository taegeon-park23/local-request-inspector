import { SectionPlaceholder } from '@client/features/shared-section-placeholder';

export function HistoryPlaceholder() {
  return (
    <SectionPlaceholder
      title="History"
      summary="History section scaffold for the persistent shell."
      sidebarLabel="History sidebar and explorer content will land in a later slice."
      detailLabel="History contextual result and detail content will land in a later slice."
    />
  );
}

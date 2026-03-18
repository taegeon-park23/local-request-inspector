import { SectionPlaceholder } from '@client/features/shared-section-placeholder';

export function CapturesPlaceholder() {
  return (
    <SectionPlaceholder
      title="Captures"
      summary="Captures section scaffold for the persistent shell."
      sidebarLabel="Captures sidebar and explorer content will land in a later slice."
      detailLabel="Captures contextual result and detail content will land in a later slice."
    />
  );
}

import { SectionPlaceholder } from '@client/features/shared-section-placeholder';

export function MocksPlaceholder() {
  return (
    <SectionPlaceholder
      title="Mocks"
      summary="Mocks section scaffold for the persistent shell."
      sidebarLabel="Mocks sidebar and explorer content will land in a later slice."
      detailLabel="Mocks contextual result and detail content will land in a later slice."
    />
  );
}

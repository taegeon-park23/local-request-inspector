import { SectionPlaceholder } from '@client/features/shared-section-placeholder';

export function SettingsPlaceholder() {
  return (
    <SectionPlaceholder
      title="Settings"
      summary="Settings section scaffold for the persistent shell."
      sidebarLabel="Settings sidebar and explorer content will land in a later slice."
      detailLabel="Settings contextual result and detail content will land in a later slice."
    />
  );
}

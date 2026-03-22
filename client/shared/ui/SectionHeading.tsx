import type { ReactNode } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { AppIcon, type AppIconName } from '@client/shared/ui/AppIcon';

interface SectionHeadingProps {
  title: string;
  summary: ReactNode;
  icon: AppIconName;
  eyebrow?: string;
  children?: ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  summary,
  icon,
  eyebrow,
  children,
  className,
}: SectionHeadingProps) {
  const { t } = useI18n();
  const resolvedClassName = ['section-placeholder__header', className].filter(Boolean).join(' ');
  const resolvedEyebrow = eyebrow ?? t('shared.sectionHeading.eyebrow');

  return (
    <header className={resolvedClassName}>
      <div className="section-placeholder__title-row">
        <span className="section-placeholder__title-icon" aria-hidden="true">
          <AppIcon name={icon} size={24} />
        </span>
        <div className="section-placeholder__title-copy">
          <p className="section-placeholder__eyebrow">{resolvedEyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>
      <p>{summary}</p>
      {children}
    </header>
  );
}

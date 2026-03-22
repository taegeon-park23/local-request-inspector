import type { ReactNode } from 'react';
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
  eyebrow = 'Top-level section',
  children,
  className,
}: SectionHeadingProps) {
  const resolvedClassName = ['section-placeholder__header', className].filter(Boolean).join(' ');

  return (
    <header className={resolvedClassName}>
      <div className="section-placeholder__title-row">
        <span className="section-placeholder__title-icon" aria-hidden="true">
          <AppIcon name={icon} size={24} />
        </span>
        <div className="section-placeholder__title-copy">
          <p className="section-placeholder__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>
      <p>{summary}</p>
      {children}
    </header>
  );
}

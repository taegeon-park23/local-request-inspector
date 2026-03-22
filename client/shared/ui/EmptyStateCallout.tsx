import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from '@client/shared/ui/AppIcon';

interface EmptyStateCalloutProps {
  title: string;
  description: ReactNode;
  children?: ReactNode;
  tone?: 'default' | 'muted';
  className?: string;
  icon?: AppIconName;
}

export function EmptyStateCallout({
  title,
  description,
  children,
  tone = 'muted',
  className,
  icon = 'pending',
}: EmptyStateCalloutProps) {
  const classNames = [
    'shared-empty-callout',
    tone === 'muted' ? 'shared-empty-callout--muted' : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classNames}>
      <div className="shared-empty-callout__title-row">
        <span className="shared-empty-callout__icon" aria-hidden="true">
          <AppIcon name={icon} size={18} />
        </span>
        <h3>{title}</h3>
      </div>
      <p>{description}</p>
      {children}
    </section>
  );
}

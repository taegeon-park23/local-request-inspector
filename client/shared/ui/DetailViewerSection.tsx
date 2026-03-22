import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from '@client/shared/ui/AppIcon';

interface DetailViewerSectionProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: 'default' | 'muted';
  className?: string;
  icon?: AppIconName;
}

export function DetailViewerSection({
  title,
  description,
  children,
  actions,
  tone = 'default',
  className,
  icon,
}: DetailViewerSectionProps) {
  const classNames = [
    'shared-detail-viewer-section',
    tone === 'muted' ? 'shared-detail-viewer-section--muted' : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classNames}>
      <header className="shared-detail-viewer-section__header">
        <div className="shared-detail-viewer-section__title-block">
          <div className="shared-detail-viewer-section__title-row">
            {icon ? (
              <span className="shared-detail-viewer-section__title-icon" aria-hidden="true">
                <AppIcon name={icon} size={18} />
              </span>
            ) : null}
            <h3>{title}</h3>
          </div>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="shared-detail-viewer-section__actions">{actions}</div> : null}
      </header>
      {children ? <div className="shared-detail-viewer-section__body">{children}</div> : null}
    </section>
  );
}

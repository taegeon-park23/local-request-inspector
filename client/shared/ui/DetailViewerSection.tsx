import type { ReactNode } from 'react';

interface DetailViewerSectionProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: 'default' | 'muted';
  className?: string;
}

export function DetailViewerSection({
  title,
  description,
  children,
  actions,
  tone = 'default',
  className,
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
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="shared-detail-viewer-section__actions">{actions}</div> : null}
      </header>
      {children ? <div className="shared-detail-viewer-section__body">{children}</div> : null}
    </section>
  );
}

import type { ReactNode } from 'react';

interface EmptyStateCalloutProps {
  title: string;
  description: ReactNode;
  children?: ReactNode;
  tone?: 'default' | 'muted';
  className?: string;
}

export function EmptyStateCallout({
  title,
  description,
  children,
  tone = 'muted',
  className,
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
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </section>
  );
}

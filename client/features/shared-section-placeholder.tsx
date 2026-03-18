import type { ReactNode } from 'react';

interface SectionPlaceholderProps {
  title: string;
  summary: string;
  sidebarLabel: string;
  detailLabel: string;
  children?: ReactNode;
}

export function SectionPlaceholder({
  title,
  summary,
  sidebarLabel,
  detailLabel,
  children,
}: SectionPlaceholderProps) {
  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <h2>{title} explorer</h2>
        <p>{sidebarLabel}</p>
      </section>
      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <header className="section-placeholder__header">
          <p className="section-placeholder__eyebrow">Top-level section</p>
          <h1>{title}</h1>
        </header>
        <p>{summary}</p>
        <p>This section is intentionally a placeholder in S1 and does not include feature-specific business logic yet.</p>
        {children}
      </section>
      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        <h2>{title} detail</h2>
        <p>{detailLabel}</p>
      </aside>
    </>
  );
}

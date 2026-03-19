import type { ReactNode } from 'react';

export interface KeyValueMetaItem {
  label: string;
  value: ReactNode;
}

interface KeyValueMetaListProps {
  items: KeyValueMetaItem[];
}

export function KeyValueMetaList({ items }: KeyValueMetaListProps) {
  return (
    <dl className="shared-key-value-meta-list">
      {items.map((item) => (
        <div key={item.label} className="shared-key-value-meta-list__row">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

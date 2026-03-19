function normalizeValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface StatusBadgeProps {
  kind:
    | 'connection'
    | 'mockOutcome'
    | 'executionOutcome'
    | 'transportOutcome'
    | 'testSummary'
    | 'neutral';
  value: string;
}

export function StatusBadge({ kind, value }: StatusBadgeProps) {
  const normalizedValue = normalizeValue(value);
  const classNames = [
    'shared-status-badge',
    `shared-status-badge--${kind}`,
    `shared-status-badge--${kind}-${normalizedValue}`,
  ].join(' ');

  return (
    <span className={classNames} data-kind={kind} data-value={value}>
      {value}
    </span>
  );
}

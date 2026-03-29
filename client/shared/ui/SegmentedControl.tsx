interface SegmentedControlOption<TValue extends string> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps<TValue extends string> {
  ariaLabel: string;
  value: TValue;
  options: readonly SegmentedControlOption<TValue>[];
  onChange: (value: TValue) => void;
  className?: string;
}

export function SegmentedControl<TValue extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<TValue>) {
  const resolvedClassName = ['segmented-control', className].filter(Boolean).join(' ');

  return (
    <div className={resolvedClassName} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={isActive ? 'segmented-control__option segmented-control__option--active' : 'segmented-control__option'}
            aria-pressed={isActive}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

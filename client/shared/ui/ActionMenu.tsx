import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { IconLabel } from '@client/shared/ui/IconLabel';
import type { AppIconName } from '@client/shared/ui/AppIcon';

export interface ActionMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: AppIconName;
  shortcut?: string;
  disabled?: boolean;
}

interface ActionMenuProps {
  ariaLabel: string;
  triggerLabel: string;
  triggerIcon?: AppIconName;
  items: readonly ActionMenuItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  footer?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  triggerClassName?: string;
}

export function ActionMenu({
  ariaLabel,
  triggerLabel,
  triggerIcon = 'command',
  items,
  isOpen,
  onOpenChange,
  footer,
  align = 'end',
  className,
  triggerClassName,
}: ActionMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const resolvedClassName = ['shared-action-menu', className].filter(Boolean).join(' ');
  const resolvedTriggerClassName = [
    'workspace-button workspace-button--secondary shared-action-menu__trigger',
    triggerClassName,
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={rootRef} className={resolvedClassName}>
      <button
        type="button"
        className={resolvedTriggerClassName}
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => onOpenChange(!isOpen)}
      >
        <IconLabel icon={triggerIcon}>{triggerLabel}</IconLabel>
      </button>
      {isOpen ? (
        <div
          id={menuId}
          className={align === 'start'
            ? 'shared-action-menu__surface shared-action-menu__surface--start'
            : 'shared-action-menu__surface shared-action-menu__surface--end'}
          aria-label={ariaLabel}
        >
          <div className="shared-action-menu__list">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="shared-action-menu__item"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect();
                  onOpenChange(false);
                }}
              >
                <span className="shared-action-menu__item-copy">
                  {item.icon ? <IconLabel icon={item.icon}>{item.label}</IconLabel> : item.label}
                </span>
                {item.shortcut ? <span className="shared-action-menu__shortcut">{item.shortcut}</span> : null}
              </button>
            ))}
          </div>
          {footer ? <div className="shared-action-menu__footer">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

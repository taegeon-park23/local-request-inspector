import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from '@client/shared/ui/AppIcon';

interface IconLabelProps {
  icon: AppIconName;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
  iconSize?: number;
}

export function IconLabel({
  icon,
  children,
  className,
  iconClassName,
  iconSize = 18,
}: IconLabelProps) {
  const resolvedClassName = ['app-icon-label', className].filter(Boolean).join(' ');

  return (
    <span className={resolvedClassName}>
      <AppIcon name={icon} size={iconSize} className={iconClassName} />
      <span>{children}</span>
    </span>
  );
}

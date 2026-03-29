import type { ReactNode } from 'react';

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({
  children,
  className,
}: DialogFooterProps) {
  const resolvedClassName = ['shared-dialog-footer', className].filter(Boolean).join(' ');

  return (
    <footer className={resolvedClassName}>
      {children}
    </footer>
  );
}

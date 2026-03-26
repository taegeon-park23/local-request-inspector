import type { SVGProps } from 'react';

export type AppIconName =
  | 'workspace'
  | 'captures'
  | 'history'
  | 'mocks'
  | 'environments'
  | 'scripts'
  | 'settings'
  | 'connection'
  | 'params'
  | 'headers'
  | 'body'
  | 'auth'
  | 'code'
  | 'response'
  | 'console'
  | 'tests'
  | 'info'
  | 'timeline'
  | 'pending'
  | 'overview'
  | 'matchers'
  | 'diagnostics'
  | 'search'
  | 'new'
  | 'add'
  | 'save'
  | 'run'
  | 'replay'
  | 'duplicate'
  | 'import'
  | 'export'
  | 'delete'
  | 'enable'
  | 'disable'
  | 'copy'
  | 'template'
  | 'database'
  | 'shield'
  | 'command'
  | 'paths'
  | 'summary'
  | 'warning'
  | 'pin'
  | 'maximize'
  | 'minimize';

interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  name: AppIconName;
  size?: number;
  title?: string;
  decorative?: boolean;
}

function resolveCanonicalName(name: AppIconName) {
  switch (name) {
    case 'workspace':
    case 'overview':
      return 'dashboard';
    case 'captures':
      return 'inbox';
    case 'history':
      return 'history';
    case 'mocks':
    case 'matchers':
      return 'tune';
    case 'environments':
    case 'database':
      return 'database';
    case 'scripts':
    case 'code':
    case 'template':
      return 'code';
    case 'settings':
    case 'diagnostics':
      return 'settings';
    case 'connection':
      return 'connection';
    case 'params':
      return 'sliders';
    case 'headers':
    case 'summary':
      return 'list';
    case 'body':
      return 'article';
    case 'auth':
    case 'shield':
      return 'shield';
    case 'response':
      return 'response';
    case 'console':
    case 'command':
      return 'terminal';
    case 'tests':
    case 'enable':
      return 'check-circle';
    case 'disable':
      return 'minus-circle';
    case 'info':
      return 'info';
    case 'timeline':
      return 'timeline';
    case 'pending':
      return 'hourglass';
    case 'search':
      return 'search';
    case 'new':
    case 'add':
      return 'add';
    case 'save':
      return 'save';
    case 'run':
      return 'play';
    case 'replay':
      return 'replay';
    case 'duplicate':
    case 'copy':
      return 'copy';
    case 'import':
      return 'upload';
    case 'export':
      return 'download';
    case 'delete':
      return 'delete';
    case 'paths':
      return 'route';
    case 'warning':
      return 'warning';
    case 'pin':
      return 'pin';
    case 'maximize':
      return 'maximize';
    case 'minimize':
      return 'minimize';
    default:
      return name;
  }
}

function renderIcon(name: ReturnType<typeof resolveCanonicalName>) {
  switch (name) {
    case 'dashboard':
      return (
        <>
          <rect x="4" y="5" width="16" height="14" rx="3" />
          <path d="M10 5v14" />
          <path d="M4 10.5h6" />
        </>
      );
    case 'inbox':
      return (
        <>
          <path d="M5 8.5 7.25 5h9.5L19 8.5V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
          <path d="M5 12.5h4l2 3h2l2-3h4" />
        </>
      );
    case 'history':
      return (
        <>
          <path d="M7 7.5H3.5V4" />
          <path d="M4.25 8.25a8 8 0 1 0 2.3-2.7" />
          <path d="M12 8.25V12l3 2" />
        </>
      );
    case 'tune':
      return (
        <>
          <path d="M4 7h7" />
          <path d="M15 7h5" />
          <circle cx="13" cy="7" r="2" />
          <path d="M4 12h3" />
          <path d="M11 12h9" />
          <circle cx="9" cy="12" r="2" />
          <path d="M4 17h10" />
          <path d="M18 17h2" />
          <circle cx="16" cy="17" r="2" />
        </>
      );
    case 'database':
      return (
        <>
          <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
          <path d="M5 6.5v11c0 1.4 3.15 2.5 7 2.5s7-1.1 7-2.5v-11" />
          <path d="M5 12c0 1.4 3.15 2.5 7 2.5s7-1.1 7-2.5" />
        </>
      );
    case 'code':
      return (
        <>
          <path d="m9 8-4 4 4 4" />
          <path d="m15 8 4 4-4 4" />
          <path d="m13.5 5-3 14" />
        </>
      );
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 4.5v2.25" />
          <path d="M12 17.25V19.5" />
          <path d="m6.7 6.7 1.6 1.6" />
          <path d="m15.7 15.7 1.6 1.6" />
          <path d="M4.5 12h2.25" />
          <path d="M17.25 12h2.25" />
          <path d="m6.7 17.3 1.6-1.6" />
          <path d="m15.7 8.3 1.6-1.6" />
        </>
      );
    case 'connection':
      return (
        <>
          <path d="M4.5 10.5a10.5 10.5 0 0 1 15 0" />
          <path d="M7.5 13.5a6.3 6.3 0 0 1 9 0" />
          <path d="M10.5 16.5a2.1 2.1 0 0 1 3 0" />
          <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </>
      );
    case 'sliders':
      return (
        <>
          <path d="M5 7h14" />
          <path d="M5 12h14" />
          <path d="M5 17h14" />
          <circle cx="9" cy="7" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="11" cy="17" r="2" />
        </>
      );
    case 'list':
      return (
        <>
          <path d="M8 7.5h11" />
          <path d="M8 12h11" />
          <path d="M8 16.5h11" />
          <circle cx="5.25" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="5.25" cy="12" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="5.25" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case 'article':
      return (
        <>
          <rect x="5" y="4.5" width="14" height="15" rx="2.5" />
          <path d="M9 9h6" />
          <path d="M9 12h6" />
          <path d="M9 15h4" />
        </>
      );
    case 'shield':
      return (
        <>
          <path d="M12 4.5 18.5 7v4.75c0 3.6-2.5 6.35-6.5 7.75-4-1.4-6.5-4.15-6.5-7.75V7Z" />
          <path d="m10.25 12 1.35 1.35L14.75 10.2" />
        </>
      );
    case 'response':
      return (
        <>
          <rect x="4.5" y="6" width="15" height="12" rx="3" />
          <path d="M8 12h8" />
          <path d="m13 9 3 3-3 3" />
        </>
      );
    case 'terminal':
      return (
        <>
          <rect x="4.5" y="5.5" width="15" height="13" rx="2.5" />
          <path d="m8 10 2.5 2-2.5 2" />
          <path d="M13 15h3.5" />
        </>
      );
    case 'check-circle':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="m9.25 12.25 1.9 1.9 3.6-4.05" />
        </>
      );
    case 'minus-circle':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M8.75 12h6.5" />
        </>
      );
    case 'info':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 10.25v5" />
          <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case 'timeline':
      return (
        <>
          <path d="M7.5 6v12" />
          <path d="M16.5 8v10" />
          <circle cx="7.5" cy="6" r="1.5" />
          <circle cx="16.5" cy="8" r="1.5" />
          <circle cx="7.5" cy="12" r="1.5" />
          <circle cx="16.5" cy="18" r="1.5" />
          <path d="M9 11.1 15 8.9" />
          <path d="M9 12.9 15 17.1" />
        </>
      );
    case 'hourglass':
      return (
        <>
          <path d="M8 5.5h8" />
          <path d="M8 18.5h8" />
          <path d="M9 5.5c0 2.5 1.5 3.6 3 5 1.5-1.4 3-2.5 3-5" />
          <path d="M9 18.5c0-2.5 1.5-3.6 3-5 1.5 1.4 3 2.5 3 5" />
        </>
      );
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="5.5" />
          <path d="m15.2 15.2 3.3 3.3" />
        </>
      );
    case 'add':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 8.5v7" />
          <path d="M8.5 12h7" />
        </>
      );
    case 'save':
      return (
        <>
          <path d="M6 4.5h10l2 2v13H6Z" />
          <path d="M8.5 4.5v4h6v-4" />
          <rect x="8.5" y="12.5" width="7" height="4" rx="1.5" />
        </>
      );
    case 'play':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="m10 8.75 5 3.25-5 3.25Z" fill="currentColor" stroke="none" />
        </>
      );
    case 'replay':
      return (
        <>
          <path d="M7.5 8H4V4.5" />
          <path d="M4.6 9.4A7.5 7.5 0 1 1 6 16.75" />
          <path d="m7.5 16.75-1.75 1.75" />
        </>
      );
    case 'copy':
      return (
        <>
          <rect x="8" y="8" width="10" height="11" rx="2" />
          <rect x="5.5" y="5" width="10" height="11" rx="2" />
        </>
      );
    case 'upload':
      return (
        <>
          <path d="M12 15.5V6.75" />
          <path d="m8.5 10.25 3.5-3.5 3.5 3.5" />
          <path d="M6 18.5h12" />
        </>
      );
    case 'download':
      return (
        <>
          <path d="M12 6.5v8.75" />
          <path d="m8.5 11.75 3.5 3.5 3.5-3.5" />
          <path d="M6 18.5h12" />
        </>
      );
    case 'delete':
      return (
        <>
          <path d="M7.5 7h9" />
          <path d="M9 7V5.5h6V7" />
          <path d="M8.25 7l.8 11h5.9l.8-11" />
          <path d="M10.5 10.25v4.75" />
          <path d="M13.5 10.25v4.75" />
        </>
      );
    case 'route':
      return (
        <>
          <circle cx="6.25" cy="7" r="1.5" />
          <circle cx="17.75" cy="17" r="1.5" />
          <path d="M7.75 7h4.5a3.5 3.5 0 0 1 0 7h-1.5a3.5 3.5 0 0 0 0 7" />
        </>
      );
    case 'warning':
      return (
        <>
          <path d="M12 5.25 19.5 18.5h-15Z" />
          <path d="M12 10v4.5" />
          <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case 'pin':
      return (
        <>
          <path d="M9.5 5.5h5l1.25 3.25H8.25Z" />
          <path d="M12 8.75v7.5" />
          <path d="m12 16.25-1.75 2.25" />
        </>
      );
    case 'maximize':
      return (
        <>
          <path d="M9 5.5H5.5V9" />
          <path d="m5.5 5.5 5 5" />
          <path d="M15 18.5h3.5V15" />
          <path d="m18.5 18.5-5-5" />
          <path d="M15 5.5h3.5V9" />
          <path d="m18.5 5.5-5 5" />
          <path d="M9 18.5H5.5V15" />
          <path d="m5.5 18.5 5-5" />
        </>
      );
    case 'minimize':
      return (
        <>
          <path d="M9 9H5.5V5.5" />
          <path d="m5.5 5.5 3.5 3.5" />
          <path d="M15 15h3.5v3.5" />
          <path d="m18.5 18.5-3.5-3.5" />
          <path d="M15 9h3.5V5.5" />
          <path d="m18.5 5.5-3.5 3.5" />
          <path d="M9 15H5.5v3.5" />
          <path d="m5.5 18.5 3.5-3.5" />
        </>
      );
    default:
      return null;
  }
}

export function AppIcon({
  name,
  size = 20,
  className,
  title,
  decorative = true,
  ...props
}: AppIconProps) {
  const resolvedClassName = ['app-icon', className].filter(Boolean).join(' ');

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={resolvedClassName}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={decorative ? 'true' : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={!decorative && title ? title : undefined}
      {...props}
    >
      {renderIcon(resolveCanonicalName(name))}
    </svg>
  );
}

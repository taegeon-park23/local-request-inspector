import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { appSections } from '@client/app/router/sections';
import { useShellStore } from '@client/app/providers/shell-store';
import { useI18n } from '@client/app/providers/useI18n';
import { AppIcon } from '@client/shared/ui/AppIcon';
import { StatusBadge } from '@client/shared/ui/StatusBadge';

function resolveCurrentSection(pathname: string) {
  return appSections.find((section) => pathname === section.path || pathname.startsWith(`${section.path}/`)) ?? appSections[0]!;
}

export function AppShell() {
  const location = useLocation();
  const runtimeConnectionHealth = useShellStore((state) => state.runtimeConnectionHealth);
  const { t } = useI18n();
  const brandIconUrl = `${import.meta.env.BASE_URL}favicon.svg`;
  const currentSection = resolveCurrentSection(location.pathname);

  return (
    <div className="shell-layout" data-testid="app-shell">
      <header className="shell-topbar" aria-label="Top bar">
        <div className="shell-topbar__brand-mark">
          <img className="shell-topbar__brand-icon" src={brandIconUrl} alt="" />
        </div>
        <div className="shell-topbar__breadcrumb" aria-label="Current section breadcrumb">
          <span className="shell-topbar__breadcrumb-root">{t('shell.breadcrumb.root')}</span>
          <span className="shell-topbar__breadcrumb-separator" aria-hidden="true">/</span>
          <span className="shell-topbar__breadcrumb-current">
            <AppIcon name={currentSection.icon} size={18} />
            <span>{t(`sections.${currentSection.id}.breadcrumb`)}</span>
          </span>
        </div>
        <div className="shell-topbar__status">
          <div className="shell-topbar__status-copy">
            <AppIcon name="connection" size={18} />
            <span className="shell-topbar__status-label">{t('shell.status.runtimeConnection')}</span>
          </div>
          <StatusBadge kind="connection" value={runtimeConnectionHealth} />
        </div>
      </header>
      <div className="shell-body">
        <nav className="shell-nav" aria-label="Navigation rail">
          <ul>
            {appSections.map((section) => (
              <li key={section.path}>
                <NavLink
                  to={section.path}
                  data-section-role={section.role}
                  className={({ isActive }) =>
                    isActive ? 'shell-nav__link shell-nav__link--active' : 'shell-nav__link'
                  }
                >
                  <span className="shell-nav__icon" aria-hidden="true">
                    <AppIcon name={section.icon} size={18} />
                  </span>
                  <span className="shell-nav__copy">
                    <span className="shell-nav__title-row">
                      <span className="shell-nav__title">{t(`sections.${section.id}.label`)}</span>
                      <span className="shell-nav__role" data-role={section.role}>
                        {t(`roles.${section.role}`)}
                      </span>
                    </span>
                    <small className="shell-nav__summary">{t(`sections.${section.id}.summary`)}</small>
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

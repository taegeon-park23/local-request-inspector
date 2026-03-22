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
  const navRailCollapsed = useShellStore((state) => state.navRailCollapsed);
  const toggleNavRailCollapsed = useShellStore((state) => state.toggleNavRailCollapsed);
  const { t } = useI18n();
  const brandIconUrl = `${import.meta.env.BASE_URL}favicon.svg`;
  const currentSection = resolveCurrentSection(location.pathname);
  const navToggleLabel = navRailCollapsed ? t('shell.navigation.expand') : t('shell.navigation.collapse');

  return (
    <div
      className={navRailCollapsed ? 'shell-layout shell-layout--nav-collapsed' : 'shell-layout'}
      data-testid="app-shell"
      data-nav-collapsed={navRailCollapsed ? 'true' : 'false'}
    >
      <header className="shell-topbar" aria-label="Top bar">
        <div className="shell-topbar__brand-mark">
          <img className="shell-topbar__brand-icon" src={brandIconUrl} alt="" />
        </div>
        <div className="shell-topbar__breadcrumb" aria-label="Current section breadcrumb">
          <span className="shell-topbar__breadcrumb-root">{t('shell.breadcrumb.root')}</span>
          <span className="shell-topbar__breadcrumb-separator" aria-hidden="true">/</span>
          <span className="shell-topbar__breadcrumb-current">
            <AppIcon name={currentSection.icon} size={16} />
            <span>{t(`sections.${currentSection.id}.breadcrumb`)}</span>
          </span>
        </div>
        <div className="shell-topbar__status">
          <div className="shell-topbar__status-copy">
            <AppIcon name="connection" size={16} />
            <span className="shell-topbar__status-label">{t('shell.status.runtimeConnection')}</span>
          </div>
          <StatusBadge kind="connection" value={runtimeConnectionHealth} />
        </div>
      </header>
      <div className="shell-body">
        <nav
          className={navRailCollapsed ? 'shell-nav shell-nav--collapsed' : 'shell-nav'}
          aria-label="Navigation rail"
          data-collapsed={navRailCollapsed ? 'true' : 'false'}
        >
          <button
            type="button"
            className="workspace-button workspace-button--ghost shell-nav__toggle"
            onClick={toggleNavRailCollapsed}
            aria-label={navToggleLabel}
            aria-expanded={!navRailCollapsed}
            title={navToggleLabel}
          >
            <span className="shell-nav__toggle-glyph" aria-hidden="true" />
            <span className="shell-nav__toggle-text">{navToggleLabel}</span>
          </button>
          <ul>
            {appSections.map((section) => {
              const sectionLabel = t(`sections.${section.id}.label`);
              return (
                <li key={section.path}>
                  <NavLink
                    to={section.path}
                    data-section-role={section.role}
                    aria-label={sectionLabel}
                    title={navRailCollapsed ? sectionLabel : undefined}
                    className={({ isActive }) =>
                      isActive ? 'shell-nav__link shell-nav__link--active' : 'shell-nav__link'
                    }
                  >
                    <span className="shell-nav__icon" aria-hidden="true">
                      <AppIcon name={section.icon} size={18} />
                    </span>
                    <span className={navRailCollapsed ? 'shell-nav__copy shell-nav__copy--hidden' : 'shell-nav__copy'}>
                      <span className="shell-nav__title-row">
                        <span className="shell-nav__title">{sectionLabel}</span>
                        <span className="shell-nav__role" data-role={section.role}>
                          {t(`roles.${section.role}`)}
                        </span>
                      </span>
                      <small className="shell-nav__summary">{t(`sections.${section.id}.summary`)}</small>
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

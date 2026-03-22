import { NavLink, Outlet } from 'react-router-dom';
import { appSections } from '@client/app/router/sections';
import { useShellStore } from '@client/app/providers/shell-store';
import { StatusBadge } from '@client/shared/ui/StatusBadge';

export function AppShell() {
  const runtimeConnectionHealth = useShellStore((state) => state.runtimeConnectionHealth);
  const brandIconUrl = `${import.meta.env.BASE_URL}favicon.svg`;

  return (
    <div className="shell-layout" data-testid="app-shell">
      <header className="shell-topbar" aria-label="Top bar">
        <div className="shell-topbar__brand">
          <div className="shell-topbar__brand-row">
            <img className="shell-topbar__brand-icon" src={brandIconUrl} alt="" />
            <div className="shell-topbar__brand-copy">
              <p className="shell-topbar__eyebrow">Local Request Inspector</p>
              <h1>Local API Workbench shell</h1>
              <p className="shell-topbar__supporting">
                Shell-first authoring and observation surfaces stay split while Material 3 tokens provide a shared visual foundation.
              </p>
            </div>
          </div>
          <div className="shell-topbar__legend" aria-label="Surface roles">
            <span className="shell-topbar__legend-chip shell-topbar__legend-chip--authoring">Authoring</span>
            <span className="shell-topbar__legend-chip shell-topbar__legend-chip--observation">Observation</span>
            <span className="shell-topbar__legend-chip shell-topbar__legend-chip--management">Management</span>
          </div>
        </div>
        <div className="shell-topbar__status">
          <span className="shell-topbar__status-label">Runtime connection</span>
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
                  data-section-role={section.role.toLowerCase()}
                  className={({ isActive }) =>
                    isActive ? 'shell-nav__link shell-nav__link--active' : 'shell-nav__link'
                  }
                >
                  <span className="shell-nav__monogram" aria-hidden="true">
                    {section.label.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="shell-nav__copy">
                    <span className="shell-nav__title-row">
                      <span className="shell-nav__title">{section.label}</span>
                      <span className="shell-nav__role" data-role={section.role.toLowerCase()}>
                        {section.role}
                      </span>
                    </span>
                    <small className="shell-nav__summary">{section.summary}</small>
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


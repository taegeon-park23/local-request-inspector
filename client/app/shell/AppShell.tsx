import { NavLink, Outlet } from 'react-router-dom';
import { appSections } from '@client/app/router/sections';
import { useShellStore } from '@client/app/providers/shell-store';

export function AppShell() {
  const runtimeConnectionHealth = useShellStore((state) => state.runtimeConnectionHealth);

  return (
    <div className="shell-layout" data-testid="app-shell">
      <header className="shell-topbar" aria-label="Top bar">
        <div>
          <p className="shell-topbar__eyebrow">Local Request Inspector</p>
          <h1>Local API Workbench shell</h1>
        </div>
        <p className="shell-health">Runtime connection: {runtimeConnectionHealth}</p>
      </header>
      <div className="shell-body">
        <nav className="shell-nav" aria-label="Navigation rail">
          <ul>
            {appSections.map((section) => (
              <li key={section.path}>
                <NavLink
                  to={section.path}
                  className={({ isActive }) =>
                    isActive ? 'shell-nav__link shell-nav__link--active' : 'shell-nav__link'
                  }
                >
                  <span>{section.label}</span>
                  <small>{section.path}</small>
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


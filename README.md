# Local Request Inspector

Bounded local-first request workspace with a legacy prototype at `/` and a newer React shell at `/app`.

## Quick start

```bash
npm install
npm run bootstrap:storage
npm run dev:app
```

- Server-backed legacy prototype: `http://localhost:5671/`
- Vite client shell during development: `http://localhost:5173/`
- Built React shell from the server: `http://localhost:5671/app`

## Common commands

```bash
npm run dev:app
npm run dev:server
npm run dev:client
npm run build:client
npm run serve:app
npm run check
npm run check:app
npm run test:node
npm run test:ui
```

- `dev:app`: runs the server lane and Vite client lane together.
- `build:client`: builds the React shell for the `/app` entrypoint.
- `serve:app`: serves the legacy `/` route and, when built, the `/app` shell.
- `check`: runs lint, typecheck, Node seam tests, and the app-shell readiness check.
- `test:node`: plain Node seam verification lane for storage and bundle helpers.
- `test:ui`: Vitest UI/component lane.

## Route roles

- `/`: legacy prototype and compatibility surface
- `/app`: built React shell served by `server.js`
- `/api/*`: storage-backed authored/runtime data API
- `/events`: runtime events stream used by the React shell

## Known limitations

- `npm run test:ui` now clears config-load friction, but some sandboxed Windows environments still fail during the Vite TypeScript transform stage with `vite:esbuild spawn EPERM`.
- `npm run test:node` is the stable fallback verification lane for low-level storage/runtime seams.
- `npm run build:client` now avoids the earlier config-load blocker, but some sandboxed Windows environments can still fail later during Vite HTML transform with `vite:build-html spawn EPERM`.
- If `/app` shows a fallback page, the built client shell is missing. Run `npm run build:client` and reload the server route.

# Learning Issues Log

## Issue Entry Rule (Use For Every New Issue)

Capture the following fields every time:

- Symptom
- Root Cause
- Change Made
- Verification Result
- Lesson/Topic Context

## Issue Template

```md
## YYYY-MM-DD - Short Issue Title

### Symptom
-

### Root Cause
-

### Change Made
-

### Verification Result
-

### Lesson/Topic Context
-
```

## Quick Notes (Fast Reference)

### Global Prefix `exclude` in NestJS
- Location: `main.ts` inside `app.setGlobalPrefix('v1', { exclude: [...] })`.
- What it does: skips applying the global prefix for matched routes.
- Current behavior in this project:
  - `exclude: [{ path: '', method: RequestMethod.GET }]`
  - `GET /` stays as `/` (no `/v1` prefix).
  - Other routes still use `/v1/...`.
- Why useful: keeps a simple root endpoint for uptime checks while preserving API versioning.

### Local Health Check vs Versioned API
- Local/dev convenience:
  - Keep `GET /` unversioned for quick browser check (`localhost:8000`).
- API design consistency:
  - Keep actual business endpoints versioned under `/v1`.
- Production option:
  - You can point load balancer or monitoring probes to `/` (or a dedicated `/health`) without changing core API versioning.

### Reading the NestApplication Object (`console.log(app)`)
When you log the `app` object in `main.ts`, here is what the key fields mean:

| Field | Meaning |
|---|---|
| `globalPrefix: 'v1'` | Your API prefix is active |
| `globalPrefixOptions: { exclude: [...] }` | Your exclude rule is registered |
| `globalPipes: [ [ValidationPipe] ]` | Validation pipe is active |
| `isInitialized: true` | App bootstrapped successfully |
| `isListening: true` | Server is running and accepting requests |
| `_connectionKey: '6::::8000'` | Listening on port 8000 |
| `httpAdapter: ExpressAdapter` | Nest is using Express under the hood |
| `modules: ModulesContainer(2)` | 2 modules loaded (AppModule + InternalCoreModule) |
| `_controllers: [Map]` | Controllers are registered |

- One-line summary: app started cleanly, Express on port 8000, v1 prefix and validation pipe active, exclude rule for `GET /` in place.
- Note: remove `console.log(app)` after debugging — it is not needed in normal runs.

### InternalCoreModule
- A built-in NestJS module registered automatically — you never define or import it yourself.
- Marked `_isGlobal: true`, so its providers are available everywhere without importing.
- Has `_distance: Infinity` (max number), meaning it is destroyed last during shutdown.

| Provider | Purpose |
|---|---|
| `ModuleRef` | Dynamically retrieve providers at runtime |
| `ApplicationConfig` | Holds global prefix, pipes, guards, interceptors config |
| `Reflector` | Reads decorator metadata (used by guards, interceptors) |
| `ExternalContextCreator` | Creates execution contexts for guards/interceptors |
| `ModulesContainer` | Registry of all loaded modules |
| `HttpAdapterHost` | Exposes the underlying HTTP adapter (Express here) |
| `LazyModuleLoader` | Loads modules lazily on demand |

- One-line summary: Nest's internal plumbing module — always present, globally available, powers core features like DI, routing, and configuration.

## 2026-05-17 - Jest globals not recognized in spec files

### Symptom
- Editor showed errors in `app.controller.spec.ts`:
  - `Cannot find name 'describe'`
  - `Cannot find name 'beforeEach'`
  - `Cannot find name 'it'`
  - `Cannot find name 'expect'`

### Root Cause
- `@types/jest` was installed but TypeScript was not told to load it.
- No `types` array in `tsconfig.json` meant TS did not automatically include Jest globals.
- With `module: node16` TypeScript is stricter about explicit type resolution.

### Change Made
- Added `"types": ["jest"]` to `compilerOptions` in `tsconfig.json`.

### Verification
- Ran `npx tsc --noEmit` — no errors on the spec file.

### Lesson/Topic Context
- When using `module: node16`, always explicitly declare test runner types in `tsconfig.json` via `"types": ["jest"]`.
- `@types/jest` installed alone is not enough — TypeScript needs `"types"` to include it.

## 2026-05-16 - Build succeeded but dist output missing

### Symptom
- Running `npm run build` completed with exit code 0.
- Running production start failed with:
  - `Error: Cannot find module '.../dist/main'`

### Root Cause
- `deleteOutDir` in Nest compiler settings removed the `dist` folder at build start.
- TypeScript incremental build cache (`tsconfig.build.tsbuildinfo`) incorrectly treated project as up to date and skipped emitting files.
- Result: build command looked successful, but `dist/main.js` was not recreated.

### Resolution
- Updated build config in `tsconfig.build.json`:
  - Added:
    - `"compilerOptions": { "incremental": false }`
- Kept normal `tsconfig.json` unchanged for general dev behavior.

### Verification
- Ran two consecutive builds.
- Confirmed `dist/main.js` exists after both builds.
- Confirmed production start path `node dist/main` is now valid.

### Learning Note
- A green build is not always enough; always verify expected output artifacts exist (for example, `dist/main.js`) before running production start.

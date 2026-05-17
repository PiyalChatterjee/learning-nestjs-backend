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

### Query Params: Pipes vs ES Defaults + Type Annotations

Use this route as an example:

```ts
@Get()
findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
) {}
```

| Approach | What it does | Runtime safety |
|---|---|---|
| `DefaultValuePipe(1)` | If `page` is missing/undefined, injects `1` | Yes (Nest runtime) |
| `ParseIntPipe` | Converts string input (for example `'2'`) to number `2`; rejects invalid values | Yes (throws 400 for bad input) |
| `page = 1` (ES default) | Default only in JS function logic | No validation/conversion |
| `page: number` (TS type) | Compile-time type hint/check | No runtime effect |

- Key rule: HTTP query params arrive as strings at runtime, even if TypeScript says `number`.
- `page: number = 1` does not parse `'2'` to `2` and does not reject `'abc'`.
- `DefaultValuePipe + ParseIntPipe` gives both defaulting and safe runtime conversion/validation.
- Use ES defaults/types for developer clarity, and use pipes for actual request data safety.

Example of the risky version:

```ts
@Get()
findAll(@Query('page') page: number = 1) {
  // page can still be a string at runtime without ParseIntPipe
}
```

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

## 2026-05-17 - Stale DTO diagnostics after filename mismatch

### Symptom
- Editor showed many decorator/type errors for `create-user.dtos.ts`, including:
  - `Unable to resolve signature of property decorator...`
  - `Property 'x' has no initializer...`

### Root Cause
- Diagnostics were attached to a non-existent/old filename (`create-user.dtos.ts`) while current project file is `create-user.dto.ts`.
- Language service state was stale relative to current file structure.

### Change Made
- Verified actual files used by controller imports and checked diagnostics directly on:
  - `src/modules/users/dtos/create-user.dto.ts`
  - `src/modules/users/dtos/update-user.dto.ts`
  - `src/modules/users/users.controller.ts`
- No code changes required for DTO validation decorators.

### Verification
- Workspace diagnostics report `No errors found` for all active users module DTO/controller files.

### Lesson/Topic Context
- If errors reference a filename that no longer exists, first verify real file paths and imports before changing code.
- Stale language service diagnostics can mimic config/decorator failures.

## 2026-05-17 - UsersController spec failed after service injection

### Symptom
- `UsersController` unit test failed to compile testing module after adding constructor injection.

### Root Cause
- `UsersController` now depends on `UsersService`, but `users.controller.spec.ts` did not provide `UsersService` in the testing module.

### Change Made
- Updated `src/modules/users/users.controller.spec.ts`:
  - Imported `UsersService`.
  - Added a provider mock:
    - `{ provide: UsersService, useValue: {} }`

### Verification
- Ran the users controller spec file.
- Result: 1 passed, 0 failed.

### Lesson/Topic Context
- In NestJS unit tests, every constructor-injected dependency must be provided in `Test.createTestingModule(...)`.
- Use a lightweight mock (`useValue`) when behavior is not under test.

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

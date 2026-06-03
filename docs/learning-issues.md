# Learning Issues Log

## Quick Notes (Fast Reference)

### Exception Handlers Summary
1. **NotFound (404)** - `not-found.helper.ts` - Resource existence checks
2. **Conflict (409)** - `unique-constraint.helper.ts` - Database constraint violations
3. **BadRequest (400)** - `bad-request.helper.ts` - Validation errors, email format, password strength
4. **RequestTimeout (408)** - `request-timeout.helper.ts` - ECONNABORTED, ETIMEDOUT, deadlocks
5. **Unauthorized (401)** - `unauthorized.helper.ts` - JWT validation, missing/invalid tokens, auth failures
   - `assertTokenExists()` - Validates token presence
   - `assertUserAuthenticated()` - Validates user auth status
6. **Forbidden (403)** - `forbidden.helper.ts` - Permission/role checks, resource ownership
   - `assertUserHasRole()` - Role validation
   - `assertResourceOwnership()` - Owner check
   - `assertMinimumRoleLevel()` - Role hierarchy (admin > moderator > user)
7. **Service Unavailable (503)** - `service-unavailable.helper.ts` - DB/service down (ECONNREFUSED, ENOTFOUND, pool exhausted)
8. **Internal Server Error (500)** - `internal-error.helper.ts` - Unexpected errors with logging
   - `throwIfUnexpectedError()` - Logs details, returns generic message
   - `handleAsyncError()` - Wraps async ops with error handling
   - `logAndRethrow()` - Logs while preserving exception type

### Integration Status
✅ **UsersService** - All 6 methods wrapped (create, getAll, getById, update, patch, delete)
✅ **PostsService** - All 6 methods wrapped (getAll, getById, create, update, patch, delete)
✅ **TagsService** - All 4 methods wrapped (create, getAll, getWithPosts, delete)
✅ **MetaOptionsService** - 1 method wrapped (create)
✅ **AuthService** - Enhanced login & isAuthenticated with auth exceptions

### Transactions and Bulk Operations (Decision Note)
- Transactions are not required for every CRUD operation.
- Use transactions when multiple writes must succeed or fail together (all-or-nothing), such as bulk create/update flows.
- Single-record operations that perform one save/remove typically do not need explicit manual transactions.
- Bulk endpoints are realistic in production (admin/import/moderation workflows), but can be added incrementally after core single-item endpoints are stable.
- Keep database unique constraints in place; transactions help atomicity, while constraints protect against race-condition duplicates.

### Pagination Architecture Review (Discussion Summary)
- Identified high-priority production gaps in the first pagination rollout:
  - no explicit stable ordering guarantee
  - no max page size guard
  - empty dataset pagination edge case
  - pagination links not preserving non-pagination query params
  - missing behavior-focused tests
- Implemented immediately:
  - max `limit` cap
  - deterministic default ordering (`id DESC`) + explicit order in list services
  - empty-result-safe metadata (`totalPages` minimum 1)
  - query-preserving pagination links
  - provider behavior tests for cap, ordering, links, and empty result
- Deferred architectural decisions:
  - cursor/keyset pagination for high-volume endpoints (offset pagination remains acceptable at current scale)
  - reverse-proxy-aware absolute link strategy if deployed behind load balancer/CDN

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

---

## 2026-06-03 - Sign-In Proxy Provider Wiring for Email Lookup

### Symptom
- Sign-in flow previously failed during user lookup (`findOneByEmail`) and later returned inconsistent behavior.

### Root Cause
- Sign-in path depended on `UsersService` for email lookup in a circular module graph, creating unstable dependency resolution for the lookup path.

### Change Made
- Refactored sign-in to use the proxy provider directly:
  - `SignInProvider` now injects `FindOneUserByEmailProvider` and calls `findOneByEmail(...)` directly.
- Updated module exports:
  - `UsersModule` now exports `FindOneUserByEmailProvider` so `AuthModule` can consume it.
- Kept `UsersService.findOneByEmail` aligned to proxy usage (delegates to `FindOneUserByEmailProvider`) to preserve architecture consistency.

### Verification
- `POST /v1/auth/sign-in` with valid credentials returned:
  - `201`
  - `{"message":"Sign-in successful"}`

### Lesson/Topic Context
- When a dedicated provider encapsulates a lookup concern, inject that provider directly in auth flows rather than routing through a larger service with circular dependencies.

---

## 2026-06-03 - Undefined Provider During Sign-In Email Lookup

### Symptom
- Sign-in flow failed with:
  - `Failed to fetch user [user-find-by-email]: Cannot read properties of undefined (reading 'findOneByEmail')`

### Root Cause
- `UsersService` was calling `findOneUserByEmailProvider.findOneByEmail(...)`, but in the circular `AuthModule` <-> `UsersModule` graph this dependency could resolve as undefined when not explicitly injected with a deferred reference.

### Change Made
- Updated `src/modules/users/provider/users.service.ts`:
  - Added explicit `@Inject(forwardRef(() => FindOneUserByEmailProvider))` on the `findOneUserByEmailProvider` constructor dependency.

### Verification
- TypeScript diagnostics for `users.service.ts`: no errors.
- Runtime sign-in API should now resolve `findOneUserByEmailProvider` correctly after restart/reload.

### Lesson/Topic Context
- In circular module graphs, make constructor injection explicit on cross-feature or lazily-resolved dependencies to avoid runtime `undefined` references.

---

## 2026-06-03 - UnknownDependenciesException From Cross-Module Service Registration

### Symptom
- App bootstrap failed with:
  - `Nest can't resolve dependencies of the AuthService (UsersService, ?)`
  - Missing `SignInProvider` in `PostsModule` context.

### Root Cause
- `AuthService` was mistakenly added to `providers` in `PostsModule`.
- That forced Nest to instantiate `AuthService` inside `PostsModule`, but `SignInProvider` is registered in `AuthModule`, not `PostsModule`.

### Change Made
- Updated `src/modules/posts/posts.module.ts`:
  - Removed `AuthService` import.
  - Removed `AuthService` from `providers`.

### Verification
- TypeScript diagnostics for `posts.module.ts`: no errors.

### Lesson/Topic Context
- Do not re-provide a service from another feature module.
- If a service is needed across modules, provide and export it from its owning module, then import that module where needed.

---

## 2026-06-03 - InvalidClassModuleException From Provider in imports

### Symptom
- App failed during bootstrap with `InvalidClassModuleException`:
  - Classes with `@Injectable()` must not be in a module `imports` array.
  - Specifically flagged `FindOneUserByEmailProvider`.

### Root Cause
- `FindOneUserByEmailProvider` (a provider class) was mistakenly added to `imports` in `UsersModule` instead of `providers`.

### Change Made
- Updated `src/modules/users/users.module.ts`:
  - Added `FindOneUserByEmailProvider` to `providers`.
  - Removed `FindOneUserByEmailProvider` from `imports`.

### Verification
- TypeScript diagnostics for `users.module.ts`: no errors.
- Module metadata now follows Nest rules (`imports` contains modules only, `providers` contains injectable classes).

### Lesson/Topic Context
- Nest module arrays have strict roles:
  - `imports`: modules only
  - `providers`: services/providers/injectables
  - `controllers`: controllers only

---

## 2026-06-03 - Nest Test Failed to Resolve Repository Dependency

### Symptom
- `FindOneUserByEmailProvider` spec failed with: Nest can't resolve dependencies of `FindOneUserByEmailProvider` (`UserRepository` at index [0]).

### Root Cause
- The generated spec bootstrapped a Nest testing module with only the provider class and did not provide its `Repository<User>` dependency.

### Change Made
- Updated `src/modules/users/provider/find-one-user-by-email.provider.spec.ts` to instantiate the provider directly with a mocked repository (`findOne: jest.fn()`), removing reliance on unresolved DI tokens for this unit test.

### Verification
- TypeScript diagnostics for the spec file report no errors.

### Lesson/Topic Context
- For focused unit tests, directly constructing providers with mocked dependencies is often simpler and more stable than building a full Nest testing module.

---

## 2026-06-03 - Auth Email Lookup Missing Exception Translation

### Symptom
- `find-one-user-by-email.provider.ts` had a TODO in the `catch` block and did not translate DB errors into standardized HTTP exceptions.

### Root Cause
- The provider was generated and wired for repository access, but the exception helper chain used across service/provider layers was not added yet.

### Change Made
- Updated `src/modules/auth/provider/find-one-user-by-email.provider.ts`:
  - Added imports for `throwIfServiceUnavailable`, `throwIfRequestTimeout`, and `throwIfUnexpectedError`.
  - Implemented catch-block cascade in standard order: service unavailable -> request timeout -> unexpected error.
  - Added final `throw error` to preserve known HTTP exceptions and satisfy explicit control flow.

### Verification
- TypeScript diagnostics for `find-one-user-by-email.provider.ts`: no errors.

### Lesson/Topic Context
- Keep provider-level error handling consistent with the shared exception-helper pattern to avoid leaking low-level DB/network errors and to return stable API responses.

---

## 2026-06-03 - Password Not Being Hashed on User Creation

### Symptom
- `POST /v1/users` returned the plain text password in the response instead of a bcrypt hash
- Password was stored as plain text in the database

### Root Cause
Two combined issues:
1. `HashingProvider` was registered in `AuthModule` but not added to `exports`, so `UsersModule` (which imports `AuthModule`) could not resolve it for injection into `CreateUserProvider`
2. The `forwardRef()` wrapper on `@Inject(HashingProvider)` was removed from `CreateUserProvider`, thinking it was unnecessary — but since `UsersModule` ↔ `AuthModule` form a **circular dependency**, `forwardRef` is required at the injection site. Without it, NestJS resolves the dependency synchronously before the circular dep is settled, leaving the injected instance as an unresolved proxy whose `hashPassword` method silently returns the original value instead of a hash

### Change Made
- `auth.module.ts`: Added `HashingProvider` to the `exports` array
- `create-user.provider.ts`: Restored `@Inject(forwardRef(() => HashingProvider))` on the `hashingProvider` constructor parameter

### Verification
- `POST /v1/users` with a new user returned `password: $2b$10$...` — a valid bcrypt hash
- Confirmed with user Jim Clark (id: 11)

### Lesson/Topic Context
- In circular module pairs (`forwardRef(() => ModuleA)` in imports), providers that **cross the circular boundary** must also use `forwardRef` at the `@Inject` level — not just at the module `imports` level
- Missing `exports` for a provider in a module = silent injection failure at runtime, not a startup error when `forwardRef` defers resolution

---

## 2026-06-01 - Pagination Hardening Gaps in Production Readiness

### Symptom
- Pagination worked for basic list requests but had architecture gaps for production use:
  - no max limit cap
  - no deterministic default ordering
  - links dropped non-pagination query params
  - empty datasets could produce `totalPages = 0`
  - pagination provider test file only checked provider existence

### Root Cause
- Initial pagination implementation focused on first working behavior and did not yet include defensive constraints, link continuity rules, and edge-case tests.

### Change Made
- Updated [src/common/paginations/dtos/pagination-query.dto.ts](src/common/paginations/dtos/pagination-query.dto.ts):
  - Added `@Max(100)` on `limit`.
- Updated [src/common/paginations/provider/pagination.provider.ts](src/common/paginations/provider/pagination.provider.ts):
  - Added optional pagination options with deterministic ordering support.
  - Added default fallback order (`id DESC`) when no order is provided.
  - Enforced runtime limit cap with `MAX_LIMIT`.
  - Added empty-result-safe page math (`totalPages` minimum 1).
  - Preserved non-pagination query params in generated links.
- Updated list service calls to pass explicit deterministic order:
  - [src/modules/posts/provider/posts.service.ts](src/modules/posts/provider/posts.service.ts)
  - [src/modules/users/provider/users.service.ts](src/modules/users/provider/users.service.ts)
  - [src/modules/tags/providers/tags.service.ts](src/modules/tags/providers/tags.service.ts)
- Replaced outdated provider spec in [src/common/paginations/provider/pagination.provider.spec.ts](src/common/paginations/provider/pagination.provider.spec.ts) with behavior tests for cap, ordering, empty-data metadata, and query-preserving links.

### Verification Result
- `PaginationProvider` spec run: 5 passed.
- Focused regression tests run: 7 passed (pagination provider + users service spec + tags service spec).
- TypeScript diagnostics checked on modified pagination files: no errors.

### Lesson/Topic Context
- A working pagination MVP should be hardened with limits, stable ordering, link continuity, and edge-case tests before treating it as reusable infrastructure.

---

## 2026-05-29 - Keep Nest Server Running When PostgreSQL Is Down

### Symptom
- Stopping PostgreSQL caused Nest startup to fail with repeated TypeORM connection retries and app crash.
- After enabling non-blocking startup, API calls returned 500 with `No metadata for "User" was found` instead of a 503.

### Root Cause
- TypeORM initialization was happening during module bootstrap, so DB-down state blocked app startup.
- With manual DB initialization enabled, repository calls threw TypeORM metadata/initialization errors that were not included in the existing 503 detection patterns.

### Change Made
- Updated [src/app.module.ts](src/app.module.ts) TypeORM options to use `manualInitialization: true` so HTTP server boot does not depend on initial DB availability.
- Updated [src/common/exceptions/service-unavailable.helper.ts](src/common/exceptions/service-unavailable.helper.ts) to classify these additional runtime DB-down signals as service-unavailable:
  - `datasource is not initialized`
  - `data source is not initialized`
  - `driver not connected`
  - `no metadata for`
  - `entitymetadatanotfounderror`

### Verification
- Confirmed PostgreSQL service is stopped.
- Started app with `npm run start:dev`: Nest boot completed successfully and stayed running.
- Called `GET /v1/users?limit=2&page=1` while DB was down: response is now `503 Service Unavailable` with message `Cannot fetch users at this moment (database). Please try again later.`

### Lesson/Topic Context
- For resilience, avoid hard coupling API process startup to database availability when learning or testing failure modes.
- Map DB client/library-specific runtime errors to consistent HTTP responses (503 for transient infrastructure dependency failures).

---

## 2026-05-29 - Nest Dev Server Port Already In Use (EADDRINUSE)

### Symptom
- Running npm run start:dev showed successful module bootstrap logs, then crashed with:
  - Error: listen EADDRINUSE: address already in use :::8000
- This looked like app startup was broken.

### Root Cause
- Multiple Nest watch processes were started in different terminals.
- One existing process was already bound to port 8000; subsequent starts failed when trying to listen on the same port.

### Change Made
- Identified the active listener process on port 8000 and kept a single running instance.
- Confirmed API requests against the active process instead of launching parallel start:dev sessions.

### Verification
- Port 8000 had a single listener process.
- GET /v1/users returned HTTP 200 once DB was running.

### Lesson/Topic Context
- EADDRINUSE is a process-management issue, not a Nest module wiring issue.
- Before restarting, check port ownership and stop old listeners to keep one active dev server instance.

## 2026-05-29 - TypeScript Configuration: Deprecated Compiler Options

### Symptom
TypeScript editor warnings about deprecated `baseUrl` and `moduleResolution: node10`.

### Root Cause
NestJS schematics template used deprecated TypeScript compiler options that are no longer recommended in modern TS versions.

### Change Made
- Removed `baseUrl` from `tsconfig.json` (no path aliases were in use).
- Changed `moduleResolution` from `node10` to `node16`.
- Changed `module` to `node16` to match moduleResolution.
- Explicitly set `rootDir: ./src` for clarity.
- Set `incremental: false` in `tsconfig.build.json` to prevent build cache issues with `deleteOutDir`.

### Verification Result
No editor warnings; clean build output; `dist/main.js` emits correctly after clean rebuild.

### Lesson/Topic Context
Modern TypeScript configuration requires alignment between `module` and `moduleResolution`. The incremental/deleteOutDir interaction is subtle: incremental caching can prevent re-emit if deleteOutDir removes intermediate files first.

---

## 2026-05-23 - TypeORM Many-to-Many Relationships: `@JoinTable` Pattern

### Symptom
Postgres junction table `post_tags` not appearing after entity relation decorator changes.

### Root Cause
Initially used `@JoinColumn` for many-to-many relation, which only works for one-to-one or many-to-one. Many-to-many requires `@JoinTable` to create a separate linking table.

### Change Made
- Updated post entity with `@ManyToMany(() => Tag)` on posts side.
- Added `@JoinTable()` decorator to create `post_tags` junction table.
- Added inverse relation `@ManyToMany(() => Post, post => post.tags)` on tag entity.

### Verification Result
Postgres synchronize creates `post_tags` table with `post_id` and `tag_id` foreign keys. Tags can be linked to multiple posts and vice versa.

### Lesson/Topic Context
Relation choice depends on cardinality:
- `@JoinColumn` for 1:1 or M:1 (foreign key on current table).
- `@JoinTable` for M:M (separate junction table needed).

## Quick Notes (Fast Reference)

### Q&A: Why `@JoinTable` for Tags but `@JoinColumn` for Author/MetaOption?
- Question:
  - I can see `post_tags` table after refresh. Why is this better in many-to-many, and why do we use `@JoinColumn` for users/meta options?
- Answer:
  - Many-to-many (`Post <-> Tag`) means each post can have many tags and each tag can belong to many posts.
  - A single foreign-key column in `post` cannot represent many tag links cleanly.
  - `@JoinTable` creates a junction table (`post_tags`) with two foreign keys (`postId`, `tagId`) to store all combinations.
  - This is normalized, scalable, and query-friendly for relational databases.
  - `@JoinColumn` is correct for one-to-one or many-to-one cases where one foreign key column is enough:
    - `author_id` for `ManyToOne(Post -> User)`
    - `meta_option_id` for `OneToOne(Post -> MetaOption)`
  - Rule of thumb:
    - Use `@JoinColumn` when current table needs one FK column.
    - Use `@JoinTable` when relation needs a separate linking table.

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

### TypeORM @DeleteDateColumn Soft Delete Behavior
- When a column is marked with `@DeleteDateColumn`, TypeORM automatically handles soft deletes.
- **Soft delete** via `softRemove()` or `softDelete()` — sets `deleteDate` to current timestamp; row stays in DB.
- **Standard queries** (`find()`, `findOne()`) automatically exclude soft-deleted rows via `WHERE deleteDate IS NULL`.
- **To include** soft-deleted rows in a query, use `withDeleted: true`:
  ```ts
  await this.tagRepository.find({ withDeleted: true });
  ```
- **Hard delete** via `remove()` — physically deletes the row (no soft delete).
- Use `softRemove()` when you want audit trail / recovery option; use `remove()` when row should truly vanish.
- Soft-deleted rows are **not returned by default** even though they physically exist in the DB table.

### TypeORM `onDelete` in ManyToMany — Must Be on the Owning Side
- `onDelete` in a `@ManyToMany` decorator only has effect on the **owning side** (the entity with `@JoinTable`).
- Setting it on the **inverse side** is silently ignored — TypeORM does not apply the FK constraint from there.
- **Correct placement:**
  ```ts
  // Post.tags — owning side (has @JoinTable) ✅
  @ManyToMany(() => Tag, (tag) => tag.posts, { eager: true, onDelete: 'CASCADE' })
  @JoinTable({ name: 'post_tags' })
  tags: Tag[];

  // Tag.posts — inverse side ❌ onDelete here is ignored
  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
  ```
- `onDelete: 'CASCADE'` on the owning side instructs the DB to automatically remove `post_tags` junction rows when a `Tag` row is hard-deleted.
- This is a **DB-level FK constraint** — it only takes effect after generating and running a migration.
- Does NOT delete `Post` rows — only cleans up the junction table link.

## 2026-05-26 - E2E failed after Jest rootDir change

### Symptom
- `npm run test:e2e` failed with:
  - `File not found: <rootDir>/../tsconfig.spec.json`
  - It resolved to `.../PIP/tsconfig.spec.json` (outside the project folder).

### Root Cause
- Jest configs were changed to root-directory mode, but `ts-jest` `tsconfig` path remained one-level-up (`<rootDir>/../tsconfig.spec.json`).
- That path became invalid with the new `rootDir` values.

### Change Made
- Updated `package.json` Jest transform option:
  - `"tsconfig": "<rootDir>/tsconfig.spec.json"`
- Updated `test/jest-e2e.json` transform option:
  - `"tsconfig": "<rootDir>/tsconfig.spec.json"`

### Verification
- Ran `npm run test` -> all 11 test suites passed.
- Ran `npm run test:e2e` -> e2e suite passed.
- Editor diagnostics show no errors for e2e config and spec files.

### Lesson/Topic Context
- When changing Jest `rootDir`, always recalculate `<rootDir>`-based paths in `ts-jest` config.
- A previously valid relative path can become invalid immediately after rootDir changes.

## 2026-05-26 - Jest globals unresolved in e2e test files

### Symptom
- In `test/app.e2e-spec.ts`, editor showed errors like:
  - `Cannot find name 'describe'`
  - `Cannot find name 'beforeAll'`
  - `Cannot find name 'it'`

### Root Cause
- `tsconfig.json` only included `src/**/*.ts`, so files under `test/` were outside the active TS project in the editor.
- Installing `@types/jest` alone was not enough for those out-of-project test files.

### Change Made
- Added `tsconfig.spec.json` at project root to include both `src/**/*.ts` and `test/**/*.ts`, with Jest/Node types.
- Updated Jest transforms in `package.json` and `test/jest-e2e.json` to use `tsconfig.spec.json`.
- Added `test/tsconfig.json` so files in `test/` are definitively picked up by a local TS project with Jest types.

### Verification
- Editor diagnostics now report no errors for `test/app.e2e-spec.ts`.
- `npm run test` passed (11/11 test suites).
- `npm run test:e2e` passed (1/1 test suite).

### Lesson/Topic Context
- `@types/jest` provides type definitions, but TypeScript must include the file in a project that loads those types.
- For NestJS repos, a dedicated spec tsconfig plus a `test/tsconfig.json` can prevent Jest global-name errors in editor.

## 2026-05-26 - Missing e2e Jest configuration file

### Symptom
- Running e2e tests would fail because `test/jest-e2e.json` was missing while `package.json` had `test:e2e` configured as `jest --config ./test/jest-e2e.json`.

### Root Cause
- E2E scaffolding files were not present in the project (`test/jest-e2e.json` and an e2e spec file).

### Change Made
- Added `test/jest-e2e.json` with ts-jest e2e config.
- Added `test/app.e2e-spec.ts` with a minimal e2e test for current app behavior (`GET /` returns `404` when no root route exists).

### Verification
- Ran `npm run test:e2e` successfully.
- Result: `1 passed, 1 total`.

### Lesson/Topic Context
- If `test:e2e` uses `--config ./test/jest-e2e.json`, that file must exist or Jest cannot start.
- Keep a minimal e2e spec in place so e2e setup can be validated early, even before business routes are added.

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

## 2026-05-18 - Swagger endpoint not found under global prefix path

### Symptom
- Browser showed `Cannot GET /v1/api` (404) after adding Swagger setup.

### Root Cause
- Swagger is configured with `SwaggerModule.setup('api', app, document)` in `main.ts`.
- This exposes docs at `/api`, not `/v1/api`.
- Global prefix does not automatically change the expected custom Swagger path in this setup.

### Change Made
- Updated Swagger setup path in `main.ts` from `api-docs` to `api`.
- Verified the active docs route from the running app.

### Verification
- `GET /api` returned 200.
- `GET /v1/api` returned 404.
- `GET /api-docs` returned 404.

### Lesson/Topic Context
- Use the exact path passed to `SwaggerModule.setup(...)` when opening Swagger UI.
- If you want prefixed docs URL behavior, configure Swagger setup options explicitly for global prefix usage.

## 2026-05-18 - Posts request body structure not enforced

### Symptom
- Posts endpoint did not enforce the expected create payload structure (title, postType, slug, status, optional content/schema/featuredImageUrl, publishOn, tags, metaOptions).

### Root Cause
- Posts module had no DTO for create payload validation and no create endpoint wired to a typed request body.

### Change Made
- Added `src/modules/posts/dtos/create-post.dto.ts` with:
  - `PostType` enum: `post | page | story | series`
  - `PostStatus` enum: `draft | scheduled | review | published`
  - Nested `PostMetaOptionDto` for `metaOptions`
  - Validation decorators for all required/optional fields
- Updated `src/modules/posts/posts.controller.ts`:
  - Added `POST /posts` with `@Body()` using `CreatePostDto`
  - Corrected `GET /posts` user ID source from route param to query param
- Updated `src/modules/posts/provider/posts.service.ts`:
  - Added in-memory post storage typed from `CreatePostDto`
  - Added `createPost()` and updated `getAllPosts()` to return stored posts

## 2026-05-19 - Missing Swagger exception responses in Posts controller

### Symptom
- Swagger docs for Posts endpoints did not show all failure responses, especially validation and missing-author cases.

### Root Cause
- `@ApiResponse` decorators in `src/modules/posts/posts.controller.ts` only covered success for create and partially for update.

### Change Made
- Updated `src/modules/posts/posts.controller.ts`:
  - Added `@ApiResponse({ status: 400, ... })` and `@ApiResponse({ status: 404, ... })` to `createPost`.
  - Added `@ApiResponse({ status: 400, ... })` to `updatePost`.
  - Removed unused controller dependencies/imports (`UsersService`, `Query`, `ApiQuery`) to keep docs/controller aligned.

### Verification
- Checked file diagnostics for `src/modules/posts/posts.controller.ts`: no errors found.

### Lesson/Topic Context
- Keep Swagger error responses aligned with actual runtime exceptions (validation, not-found, bad params), not only success cases.

## 2026-05-18 - Node global `__dirname` not recognized in AppModule

### Symptom
- TypeScript error in `src/app.module.ts`: `Cannot find name '__dirname'`.

### Root Cause
- `tsconfig.json` set `compilerOptions.types` to only `"jest"`, which excludes Node global type declarations.

### Change Made
- Updated `tsconfig.json` to include Node types:
  - `"types": ["node", "jest"]`

### Verification
- Re-ran diagnostics for `src/app.module.ts`; no errors remained.

### Lesson/Topic Context
- If `compilerOptions.types` is explicitly set, include every runtime/testing environment you rely on (for Nest apps, usually both `node` and `jest`).

### Verification
- Global `ValidationPipe` in `src/main.ts` already uses `whitelist`, `transform`, and `forbidNonWhitelisted`, so the new DTO constraints are enforced at runtime.
- Project compiles/tests for posts module continue to load with the updated controller/service signatures.

### Lesson/Topic Context
- In NestJS, payload contracts should live in DTOs, not comments. Global validation + DTO decorators ensure the API stays consistent with expected request structure.

## 2026-05-18 - Controller decorators used inside service method

### Symptom
- `PostsService.patchPost(...)` used controller-layer decorators (`@Param`, `@Body`, `ParseIntPipe`) in the service file.

### Root Cause
- Controller concerns were mixed into service logic, breaking clean NestJS layering.

### Change Made
- Updated `src/modules/posts/provider/posts.service.ts`:
  - Removed controller-specific imports from `@nestjs/common`.
  - Changed `patchPost` signature from decorated parameters to plain typed arguments.
  - Used `PatchPostDto` as method input type.

### Verification
- Posts unit tests compile and run successfully after refactor.

### Lesson/Topic Context
- Keep Nest decorators in controllers. Services should stay framework-agnostic and receive plain values/DTOs.

## 2026-05-18 - Reusable not-found handling for posts service

### Symptom
- Need to throw `Post not found` without repeating custom throw logic in controllers.

### Root Cause
- Not-found behavior was hardcoded in `PostsService` using `Error`, and there was no reusable helper for other modules.

### Change Made
- Added shared helper `src/common/exceptions/not-found.helper.ts`:
  - `assertResourceExists(resource, resourceName, identifier)`
  - Throws `NotFoundException` with a consistent message format.
- Updated `src/modules/posts/provider/posts.service.ts`:
  - Replaced inline throw with `assertResourceExists(...)` inside `patchPost`.

### Verification
- Posts module unit tests pass.
- Type checks for updated files report no errors.

### Lesson/Topic Context
- Centralize common error patterns (like 404 not-found) in reusable helpers to keep controllers/services lean and consistent.

## 2026-05-18 - Reusable not-found handling added to users module

### Symptom
- Users endpoints did not throw a consistent 404 when a user ID did not exist.

### Root Cause
- `UsersService` returned hardcoded responses and had no shared not-found assertion flow.

### Change Made
- Updated `src/modules/users/provider/users.service.ts` to use the shared helper:
  - Imported `assertResourceExists` from `src/common/exceptions/not-found.helper.ts`.
  - Added in-memory users store and real ID lookup/update/delete flow.
  - Applied reusable not-found assertions in `getUserById`, `updateUser`, `patchUser`, and `deleteUser`.

### Verification
- Users controller/service unit tests pass.
- No diagnostics in updated users service file.

### Lesson/Topic Context
- Reusing a shared not-found assertion keeps error responses consistent across modules and avoids duplicated controller logic.

## 2026-05-18 - Compodoc coverage polluted by docs folder sources

### Symptom
- Compodoc coverage report showed many uncovered files from `docs/template-playground/**`, even after adding JSDoc in backend source files.

### Root Cause
- `tsconfig.json` had no `include`/`exclude`, so Compodoc scanned additional `.ts` files outside `src`, including playground files under `docs`.
- Compodoc output directory was also `docs`, which made documentation workflow noisy.

### Change Made
- Updated `tsconfig.json`:
  - Added `"include": ["src/**/*.ts"]`

## 2026-05-19 - Missing Swagger exception responses in Users controller

### Symptom
- Swagger docs for Users endpoints did not include all error responses for invalid params/query, unauthorized access, and duplicate email cases.

### Root Cause
- `@ApiResponse` decorators in `src/modules/users/users.controller.ts` covered success cases and some errors, but missed several exceptions handled by pipes/service logic.

### Change Made
- Updated `src/modules/users/users.controller.ts`:
  - Added `@ApiResponse({ status: 400, ... })` and `@ApiResponse({ status: 401, ... })` to `getAllUsers`.
  - Added `@ApiResponse({ status: 400, ... })` and `@ApiResponse({ status: 401, ... })` to `getUserById`.
  - Added `@ApiResponse({ status: 409, ... })` to `createUser`.
  - Added `@ApiResponse({ status: 400, ... })` to `deleteUser`.

### Verification
- Checked file diagnostics for `src/modules/users/users.controller.ts`: no errors found.

### Lesson/Topic Context
- Keep Swagger response metadata aligned with validation pipes (`ParseIntPipe`, query parsing) and service exceptions (`ConflictException`, auth failures), not only with happy-path responses.
  - Added `"exclude": ["docs/**", "dist", "node_modules"]`

### Verification
- Regenerated Compodoc and confirmed coverage table now reflects backend `src` files, all with documented symbols.

### Lesson/Topic Context
- Keep TypeScript include/exclude explicit so tooling (Compodoc, linters, analysis) targets intended source scope only.

## 2026-05-18 - Compodoc script mode caused unnecessary watch and server output

### Symptom
- Running documentation command started a watch server every time, producing extra noise and long-running process behavior when only static generation was needed.

### Root Cause
- `package.json` had a single `doc` script using `-s --watch`, which combines serve and watch with generation.

### Change Made
- Updated `package.json` scripts:
  - `doc`: one-time static generation
  - `doc:serve`: serve generated docs
  - `doc:watch`: serve with watch mode

### Verification
- Script definitions now support explicit mode selection for build versus serve/watch workflows.

### Lesson/Topic Context
- Keep documentation scripts separated by intent so automation and local preview use the appropriate command.

## 2026-05-18 - Generated Compodoc files mixed with handwritten docs folder

### Symptom
- Generated Compodoc assets appeared under `docs/`, mixing with handwritten learning markdown files and creating noisy git changes.

### Root Cause
- Documentation scripts output target was `./docs`, which is also used for tracked project notes.
- Generated output directory was not isolated in `.gitignore`.

### Change Made
- Updated `package.json` docs scripts to output to `./.compodoc` instead of `./docs`.
- Added `.compodoc/` to `.gitignore`.

### Verification
- Running `npm run doc` now generates output in `.compodoc`.
- Handwritten files under `docs/` remain separate from generated artifacts.

### Lesson/Topic Context
- Keep generated documentation output in a dedicated ignored directory so source notes and generated assets do not collide.

## 2026-05-19 - Low Compodoc coverage for entity files

### Symptom
- Compodoc coverage reported low documentation coverage for entity files.

### Root Cause
- Entity classes and properties in users/posts had little or no JSDoc, so Compodoc counted many undocumented symbols.

### Change Made
- Updated `src/modules/users/user.entity.ts`:
  - Added JSDoc for `User` class and all entity fields.
- Updated `src/modules/posts/post.entity.ts`:
  - Added JSDoc for `Post` class and all entity fields, including relation field.

### Verification
- Ran `npm run build` successfully with no compile errors after documentation updates.

### Lesson/Topic Context
- Compodoc coverage increases when both class-level and property-level JSDoc comments are present, especially in entity models that define many exported members.

## 2026-05-23 - Post creation did not validate many-to-many tags existence

### Symptom
- Creating a post with tag slugs could proceed without verifying whether those tags existed in the `tags` table.
- Post-to-tag relation mapping was configured with an incorrect relation decorator for many-to-many.

### Root Cause
- `PostsService.createPost(...)` passed DTO tag values directly into `postRepository.create(...)` without resolving `Tag` entities.
- `Post` entity used `@JoinColumn` on a `@ManyToMany` relation instead of `@JoinTable`.

### Change Made
- Updated `src/modules/posts/post.entity.ts`:
  - Replaced `@JoinColumn` with `@JoinTable({ name: 'post_tags' })` for `tags` relation.
- Updated `src/modules/posts/provider/posts.service.ts`:
  - Injected `Tag` repository.
  - In `createPost`, resolved incoming tag slugs with `In(...)` query.
  - Added missing-tag detection and `NotFoundException` with the missing slugs list.
  - Assigned resolved `Tag[]` entities to `post.tags` before save.

### Verification
- Checked diagnostics on updated files:
  - `src/modules/posts/post.entity.ts` -> no errors
  - `src/modules/posts/provider/posts.service.ts` -> no errors

### Lesson/Topic Context
- For many-to-many relations, always persist relation entities (or their managed references), not raw string values.
- Validate foreign data existence early in service methods to fail fast with clear client-facing errors.

## 2026-05-23 - PostsService spec failed after adding Tag repository injection

### Symptom
- `posts.service.spec.ts` failed with Nest dependency resolution error for `TagRepository`.

### Root Cause
- `PostsService` constructor added `@InjectRepository(Tag)` but the unit test module providers did not include `getRepositoryToken(Tag)`.

### Change Made
- Updated `src/modules/posts/provider/posts.service.spec.ts`:
  - Added `Tag` import.
  - Added `{ provide: getRepositoryToken(Tag), useValue: {} }` to testing module providers.
  - Removed unused `UsersService` import.

### Verification
- Ran posts service spec only; result: 1 passed, 0 failed.

### Lesson/Topic Context
- When adding constructor-injected dependencies in Nest services, mirror those dependencies in unit test module mocks immediately.

## 2026-05-23 - PUT/PATCH post updates did not validate many-to-many tags

### Symptom
- Updating posts could assign raw tag strings into the relation path and did not consistently fail when provided tags did not exist.

### Root Cause
- Tag existence checking logic existed only in create flow.
- PUT/PATCH paths were not resolving tag slugs into `Tag` entities before persistence.

### Change Made
- Updated [src/modules/posts/provider/posts.service.ts](src/modules/posts/provider/posts.service.ts):
  - Added `resolveTagsOrThrow(...)` private helper.
  - Reused helper in `createPost`, `updatePost`, and `patchPost`.
  - `updatePost` now resolves full tag set before assignment.
  - `patchPost` resolves tags only when `tags` is included in payload.
  - Throws `NotFoundException` listing missing tag slugs.

### Verification
- Diagnostics for [src/modules/posts/provider/posts.service.ts](src/modules/posts/provider/posts.service.ts): no errors.
- Ran [src/modules/posts/provider/posts.service.spec.ts](src/modules/posts/provider/posts.service.spec.ts): 1 passed, 0 failed.

### Lesson/Topic Context
- Many-to-many writes should always operate on resolved relation entities, not raw payload strings.
- Centralized validation logic prevents drift between create/update/patch behavior.

## 2026-05-23 - Post tags DTO validation expected nested objects instead of string URLs

### Symptom
- POST /v1/posts returned 400 with repeated errors:
  - `tags.each value in nested property tags must be either object or array`

### Root Cause
- In `CreatePostDto`, `tags` was configured with `@ValidateNested({ each: true })`, which is meant for object arrays.
- Actual payload uses `string[]` tag slugs/URLs.

### Change Made
- Updated [src/modules/posts/dtos/create-post.dto.ts](src/modules/posts/dtos/create-post.dto.ts):
  - Replaced `@ValidateNested({ each: true })` with `@IsString({ each: true })` and `@IsUrl({}, { each: true })` for `tags`.
  - Updated Swagger example to URL-based tag values.

### Verification
- Checked diagnostics for [src/modules/posts/dtos/create-post.dto.ts](src/modules/posts/dtos/create-post.dto.ts): no errors.

### Lesson/Topic Context
- Use nested validation only for arrays of objects/DTOs; for primitive arrays use primitive validators with `each: true`.

## 2026-05-23 - Duplicate post slug caused raw database unique constraint error

### Symptom
- Creating a post with an existing slug crashed into a `QueryFailedError` from Postgres (`code: 23505`) with a raw stack trace and DB constraint name.

### Root Cause
- `slug` is unique at DB level, but `createPost` did not provide an application-level conflict check or friendly conflict exception mapping.

### Change Made
- Updated [src/modules/posts/provider/posts.service.ts](src/modules/posts/provider/posts.service.ts):
  - Added pre-insert slug lookup and throws `ConflictException` if slug already exists.
  - Wrapped save in a fallback `QueryFailedError` handler for `23505` to return the same friendly conflict message in race conditions.

### Verification
- Diagnostics for [src/modules/posts/provider/posts.service.ts](src/modules/posts/provider/posts.service.ts): no errors.

### Lesson/Topic Context
- Keep DB unique constraints as the source of truth, but translate expected uniqueness violations into clean API-level conflict responses.

## 2026-05-23 - Replaced inline duplicate checks with reusable unique-constraint exception helper

### Symptom
- Duplicate slug handling logic was duplicated inline in post service and mixed with feature logic.

### Root Cause
- Conflict translation for DB unique violations was implemented directly inside service methods.

### Change Made
- Added [src/common/exceptions/unique-constraint.helper.ts](src/common/exceptions/unique-constraint.helper.ts):
  - `throwIfUniqueConstraintViolation(error, options)`.
- Refactored [src/modules/posts/provider/posts.service.ts](src/modules/posts/provider/posts.service.ts):
  - Removed pre-insert slug existence query.
  - Reused helper in create/update/patch save catch blocks.

### Verification
- Diagnostics:
  - [src/modules/posts/provider/posts.service.ts](src/modules/posts/provider/posts.service.ts) -> no errors
  - [src/common/exceptions/unique-constraint.helper.ts](src/common/exceptions/unique-constraint.helper.ts) -> no errors

### Lesson/Topic Context
- Prefer reusable exception translation helpers for DB-specific errors to keep services clean and consistent across modules.

## 2026-05-23 - New post creation kept failing because request reused an existing slug

### Symptom
- POST `/v1/posts` returned `409 Conflict` with message that slug already exists.

### Root Cause
- Request payload in [src/modules/posts/http/posts.post.endpoint.http](src/modules/posts/http/posts.post.endpoint.http) still used an existing slug (`getting-started-with-nestjs`).

### Change Made
- Updated request payload in [src/modules/posts/http/posts.post.endpoint.http](src/modules/posts/http/posts.post.endpoint.http):
  - `title` -> `Getting started with NestJS v2`
  - `slug` -> `getting-started-with-nestjs-v2`

### Verification
- Payload now uses a new unique slug, so it can create a new post instead of colliding with existing row.

### Lesson/Topic Context
- When testing create endpoints with unique fields, always vary test identifiers (slug/email/username) between runs.

## 2026-05-23 - Compodoc coverage had uncovered symbols after refactors

### Symptom
- Compodoc coverage report showed several non-100 entries (for example interfaces/services/controllers/entities with 0-83% coverage).

### Root Cause
- New/refactored files introduced symbols without explicit JSDoc (class/interface/constructor/method/property descriptions).

### Change Made
- Added focused missing JSDoc comments in uncovered files:
  - [src/common/exceptions/unique-constraint.helper.ts](src/common/exceptions/unique-constraint.helper.ts)
  - [src/common/validators/tag-relation.validator.ts](src/common/validators/tag-relation.validator.ts)
  - [src/modules/meta-options/dtos/post-meta-options.dto.ts](src/modules/meta-options/dtos/post-meta-options.dto.ts)
  - [src/modules/meta-options/meta-option.entity.ts](src/modules/meta-options/meta-option.entity.ts)
  - [src/modules/meta-options/meta-options.controller.ts](src/modules/meta-options/meta-options.controller.ts)
  - [src/modules/meta-options/provider/meta-options.service.ts](src/modules/meta-options/provider/meta-options.service.ts)
  - [src/modules/tags/dtos/post-tag.dto.ts](src/modules/tags/dtos/post-tag.dto.ts)
  - [src/modules/tags/tag.entity.ts](src/modules/tags/tag.entity.ts)
  - [src/modules/tags/tags.controller.ts](src/modules/tags/tags.controller.ts)
  - [src/modules/tags/providers/tags.service.ts](src/modules/tags/providers/tags.service.ts)

### Verification
- Ran `npm run doc` and rechecked [.compodoc/coverage.html](.compodoc/coverage.html).
- No non-100 coverage entries remain in the documentation coverage table.

### Lesson/Topic Context
- Compodoc coverage tracks exported/documented symbols, not only executable code lines.
- Constructor-level JSDoc may be needed even when parameter comments already exist.

## 2026-05-25 - Circular eager loading error when eager: true set on both sides of a relation

### Symptom
- TypeORM threw: `Error: Circular eager relations are not allowed. Post -> User -> Post`
- Occurred after setting `eager: true` on both `Post.author` (ManyToOne) and `User.posts` (OneToMany).

### Root Cause
- TypeORM eagerly loads the relation automatically on every `find`/`findOne`.
- With `eager: true` on both sides, loading a `Post` triggers eager load of `User`, which triggers eager load of `User.posts`, which triggers eager load of `Post.author` again — infinite recursion.
- TypeORM detects this cycle and throws instead of hanging.

### Change Made
- Kept `eager: true` only on `Post.author` (the owning/dependent side).
- Left `User.posts` as `eager: false` (default); load explicitly via `relations: ['posts']` only when needed.

### Verification
- App started without errors after removing `eager: true` from the inverse side.

### Lesson/Topic Context
- `eager: true` must only be set on **one side** of a bidirectional relationship.
- Set eager on the **owning/dependent** side (the entity that needs the other to be useful on its own).
- Leave the **inverse/aggregate** side as lazy; load it explicitly when required.
- Rule: if loading A always needs B, set eager on A. Do not set eager on B just because A is eager.

## 2026-05-25 - Soft delete for tags should be triggered from tags endpoint, not post deletion flow

### Symptom
- Confusion about where to execute soft delete when `Tag` has `@DeleteDateColumn` and is related to `Post` through many-to-many.

### Root Cause
- Relationship ownership (`Post.tags` has `@JoinTable`) does not mean tag lifecycle must be managed from post deletion.
- Soft delete is an entity lifecycle action and should be triggered by the entity's own service/controller.

### Change Made
- Added soft-delete method in [src/modules/tags/providers/tags.service.ts](src/modules/tags/providers/tags.service.ts):
  - `deleteTag(tagId: number)` uses `tagRepository.softRemove(tag)`.
- Added API trigger in [src/modules/tags/tags.controller.ts](src/modules/tags/tags.controller.ts):
  - `DELETE /v1/tags/:id`.
- Added HTTPyac examples in [src/modules/tags/http/tags.delete.endpoint.http](src/modules/tags/http/tags.delete.endpoint.http).

### Verification
- Focused tests passed:
  - `src/modules/tags/providers/tags.service.spec.ts`
  - `src/modules/tags/tags.controller.spec.ts`
- TypeScript diagnostics show no errors in updated tag service/controller files.

### Lesson/Topic Context
- Use `softRemove`/`softDelete` where `@DeleteDateColumn` exists and you want logical deletion.
- Deleting a `Post` should not delete `Tag` rows; manage relation links separately from tag lifecycle.

## 2026-05-26 - TagsService dependency injection failed for PostRepository

### Symptom
- App failed to bootstrap with:
  - `UnknownDependenciesException: Nest can't resolve dependencies of the TagsService (TagRepository, ?)`
  - Missing `PostRepository` provider in `TagsModule`.

### Root Cause
- `TagsService` constructor injects both `Tag` and `Post` repositories.
- `TagsModule` only registered `TypeOrmModule.forFeature([Tag])`, so `PostRepository` token was unavailable.

### Change Made
- Updated [src/modules/tags/tags.module.ts](src/modules/tags/tags.module.ts):
  - Added `Post` import from posts entity.
  - Changed `TypeOrmModule.forFeature([Tag])` to `TypeOrmModule.forFeature([Tag, Post])`.

### Verification
- TypeScript diagnostics: no errors in tags module/service files.
- Focused tests passed:
  - `src/modules/tags/providers/tags.service.spec.ts`
  - `src/modules/tags/tags.controller.spec.ts`

### Lesson/Topic Context
- Every repository injected with `@InjectRepository(Entity)` must have its entity listed in the same module's `TypeOrmModule.forFeature([...])`.
- This DI registration change does not alter entity relationship direction; it only provides repository tokens to Nest.

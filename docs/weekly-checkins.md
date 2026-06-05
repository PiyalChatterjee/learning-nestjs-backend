# Weekly Course Check-In Template (NestJS)

## Week 0 Summary (2026-05-18)

- What I completed:
	- Bootstrapped app with module wiring for users, posts, and auth.
	- Enabled global API prefix (`v1`) with root GET exclusion and global validation pipe.
	- Implemented users routes: get all, get by id, create, put, patch, delete.
	- Implemented posts routes: get all by `userId`, create, patch.
	- Added strong DTO validation for users and posts, including post enums and nested metadata options.
	- Added reusable shared not-found helper and integrated it in users/posts services.
	- Configured Swagger and confirmed docs route at `/api`.
	- Installed and standardized Compodoc workflow (`doc`, `doc:serve`, `doc:watch`).
	- Isolated generated docs output to `.compodoc` and ignored it via `.gitignore`.
	- Updated roadmap and issue log with implemented progress and resolved issues.
- What I learned:
	- Keep route ids in params, not body DTOs.
	- Use mapped types from `@nestjs/swagger` for better Swagger metadata inheritance.
	- Keep controller decorators out of services.
	- Centralized reusable exception helpers reduce repeated throw logic.
	- Compodoc source scope should be explicitly controlled through `tsconfig` include/exclude.
- Where I got blocked:
	- Swagger path confusion under global prefix.
	- Compodoc coverage noise from files outside backend source.
	- Documentation command behavior mixed generation and watch/serve modes.
- How I resolved it:
	- Corrected Swagger route usage.
	- Scoped `tsconfig` to `src` and excluded `docs`.
	- Split Compodoc commands by intent and moved generated output to `.compodoc`.

## Week 1 Summary (2026-05-23)

- What I completed:
	- Consolidated and stabilized most of the implementation started in Week 0.
	- Finished posts CRUD learning scope with repository-backed flows and consistent DTO validation.
	- Modeled major relationships in persistence layer:
		- post -> user (many-to-one)
		- post -> meta option (one-to-one)
		- post <-> tags (many-to-many via `post_tags` junction table)
	- Added tags create/get workflow and linked tags to posts using slug-based resolution.
	- Added reusable common components for cleaner architecture:
		- not-found helper
		- unique-constraint helper for DB conflict translation
		- relation validator for tags
	- Improved payload formatting/parsing helpers for JSON-backed response fields.
	- Set up database infrastructure (TypeORM DataSource, migration scripts ready; `src/database/` with migrations folder).
	- Updated learning docs (roadmap + issue log) continuously during debugging/fixes.
	- Updated README with full project overview, setup instructions, endpoints, and architecture rationale.
- What I learned:
	- `@JoinTable` is required for many-to-many and creates a separate link table; `@JoinColumn` is for direct FK columns.
	- Primitive arrays in DTOs should use per-item primitive validators (for example `@IsString({ each: true })`) instead of nested validators.
	- DB unique constraints should be translated to clean API-level conflict responses.
	- Reusable validators/helpers keep services smaller and easier to maintain.
- Where I got blocked:
	- Duplicate slug conflicts while testing repeated post creation.
	- Tag payload validation mismatch due to incorrect DTO validator type.
	- Confusion about why tags were not visible when create failed with conflict.
- How I resolved it:
	- Added unique-constraint exception mapping and used fresh slugs for create tests.
	- Fixed tags validator to match `string[]` URL payloads.
	- Verified many-to-many behavior through successful post create/patch flows and DB table refresh.
- Week close note:
	- Week 1 closed with strong progress; most core build-out happened in Week 0 and was matured, corrected, and relationship-enabled in Week 1.

## Week 2 Summary (2026-05-29)

- What I completed:
	- **Full exception handling layer:** Created 8 reusable exception helpers covering all HTTP error scenarios (400, 401, 403, 404, 408, 409, 500, 503) with pattern detection and service-level integration.
	- **Wrapped all service methods with layered error handling** across users, posts, tags, meta-options, and auth services.
	- **Database resilience for local learning:** Enabled `manualInitialization: true` in TypeORM config so API can boot and serve gracefully-degraded responses even when PostgreSQL is down; background retry bootstrap reconnects automatically.
	- **Enhanced validation:** Added email format, password strength, and email-duplicate detection on user update/patch operations.
	- **Extended tags CRUD:** Implemented `GET /v1/tags/:id` to retrieve tag with associated posts and `DELETE /v1/tags/:id` for soft-deletion.
	- **Configuration system:** Introduced `registerAs` pattern with app.config.ts, database.config.ts, and Joi-based environment.validation.ts for structured config management.
	- **Test infrastructure fixes:** Added e2e test scaffolding (`test/jest-e2e.json`, `test/app.e2e-spec.ts`), created `tsconfig.spec.json` to resolve Jest globals in test files, and corrected rootDir handling in package.json.
	- **Learned eager-loading trade-offs:** Fixed circular eager-loading error by keeping eager-loading on one side only (Post.author, Post.tags) and leaving inverse sides as lazy.
- What I learned:
	- Service-level exception mapping must cover DB client-specific error codes, messages, and patterns for consistent HTTP responses.
	- `manualInitialization: true` allows decoupling HTTP server startup from DB availability—critical for resilience in learning/testing scenarios.
	- Joi schema validation at ConfigModule level ensures env vars are typed and validated early, catching config errors at startup.
	- Eager relations on both sides of a bidirectional relationship cause circular recursion; set eager only on the owning/dependent side.
	- TypeORM soft-delete via `@DeleteDateColumn` and `softRemove()` automatically hides deleted rows from standard queries but preserves audit trail.
	- Repository injection in a service requires the entity to be listed in the same module's `TypeOrmModule.forFeature([...])`.
- Where I got blocked:
	- Port conflicts (EADDRINUSE) from multiple dev servers running simultaneously.
	- E2E test config file missing, causing test runner to fail.
	- Jest rootDir change invalidated relative paths in ts-jest config.
	- TypeORM metadata errors on request-time when DB was down were not caught by existing 503 detection patterns.
- How I resolved it:
	- Identified and stopped duplicate dev server processes; kept single running instance.
	- Added missing `test/jest-e2e.json` config file and minimal e2e test scaffold.
	- Updated Jest transforms in `package.json` and `test/jest-e2e.json` to use correct tsconfig.spec.json path.
	- Extended `service-unavailable.helper.ts` pattern detection to include `datasource is not initialized`, `no metadata for`, and other TypeORM runtime initialization error messages.
- Week close note:
	- Week 2 solidified the exception-handling foundation and resilience patterns. All service methods now have consistent error mapping. DB can restart independently from API server. Next week: expand test coverage, add auth guards, and begin migration strategy.



- Users module progress: Full CRUD with exception handling, email validation, email-duplicate detection on update/patch, password strength validation.
- Posts module progress: Full CRUD with layered exception handling (service unavailable, timeout, bad request, internal error).
- Tags module progress: Full CRUD including get-by-id with associated posts, soft-delete with @DeleteDateColumn.
- Meta-options module progress: Create with exception handling (service unavailable, timeout, internal error).
- Auth progress: Enhanced login/isAuthenticated with token presence checks and auth exception mapping.
- Database relationships progress: All 3 major relationship types tested; eager-loading corrected on both sides to prevent circular recursion.
- Database infrastructure progress: Manual DB initialization enabled for non-blocking startup; background retry bootstrap keeps app running during outages; request-time 503 responses when DB is down.
- Exception handling progress: Full 8-helper layer covering 400/401/403/404/408/409/500/503 across all service methods.
- Configuration progress: App config, database config, and Joi-based environment validation implemented.
- Testing progress: E2E test scaffolding added; Jest rootDir/tsconfig.spec.json refactored for proper file resolution.
- Documentation progress (Swagger/Compodoc): Swagger active and fully documented; Compodoc 100% symbol coverage with enhanced JSDoc for new exception helpers.
- Advanced concepts covered (guards/interceptors/decorators/serialization): Decorators, validation pipe, DTO serialization, eager-loading trade-offs covered; guards/interceptors pending.
- Docker exploration progress (optional): not started.

## Demo Evidence

- Endpoint(s):
	- Users CRUD: `GET /v1/users`, `GET /v1/users/:id`, `POST /v1/users`, `PUT /v1/users/:id`, `PATCH /v1/users/:id`, `DELETE /v1/users/:id`
	- Posts CRUD: `GET /v1/posts`, `GET /v1/posts/:id`, `POST /v1/posts`, `PUT /v1/posts/:id`, `PATCH /v1/posts/:id`, `DELETE /v1/posts/:id`
	- Tags CRUD: `GET /v1/tags`, `POST /v1/tags`, `GET /v1/tags/:id`, `DELETE /v1/tags/:id`
	- Meta-options: `POST /v1/meta-options`
- Error responses verified:
	- 503 Service Unavailable returned when PostgreSQL is down (tested by stopping service)
	- 503 response recovered to 200 after PostgreSQL restarted (no app restart required)
	- 404 Not Found for missing resource IDs across all endpoints
	- 409 Conflict for duplicate email/slug uniqueness violations
	- 400 Bad Request for invalid email format, weak passwords, missing fields
- Test(s) added:
	- Module-level specs for users, posts, tags, meta-options, auth services/controllers compile and pass.
	- E2E spec added to verify root route returns 404 (baseline for future integration tests).
- Swagger or API proof:
	- Swagger UI available at `/api` with 4 major entity groups (users, posts, tags, meta-options) fully documented with error codes.
- Functionality verified:
	- Database starts independently without blocking API boot.
	- Background retry bootstrap retries DB initialization every 5 seconds.
	- Request-time DB connectivity failures are mapped to 503 and recover after reconnection.
	- Email validation prevents invalid addresses in create/update/patch.
	- Password strength validation enforces 8-64 chars, uppercase, lowercase, digit, special char.
	- Duplicate email detection prevents conflicts on user update/patch.
	- Tag soft-delete hides deleted rows from default queries but preserves in DB.
	- HTTPyac endpoint examples updated with new tag delete and post patch operations.
- Commit/PR refs:
	- Local working changes on main branch since May 23 commit a03479c2d16b5d8083de6f4692efec6e907bf9be.

## Next Week Focus

- Planned lessons:
	- Expand unit test coverage for exception helper behavior and error-mapping patterns.
	- Add auth guards and JWT-based route protection (at least one protected users/posts endpoint).
	- Begin migration strategy: switch from `synchronize: true` to explicit TypeORM migrations and seed data.
	- Write integration tests for post-tags-metadata workflows and tag soft-delete behavior.
	- Implement pagination, filtering, and sorting helpers for list endpoints.
- Planned implementation:
	- Add posts get-by-id/delete (and optional put), then start persistence/repository layer.
	- Introduce route protection with at least one guard.
	- Add first relationship-backed flow between users and posts.
- Risks and mitigation:
	- Risk: architecture drift while learning quickly.
	- Mitigation: keep roadmap and issue log updated after each lesson chunk.

## Standards Self-Check

- Inputs validated with DTO + pipes: Yes.
- Auth enforced with guards where needed: Not yet (pending guard implementation).
- Response shape/serialization reviewed: Partial (basic response shaping done, no serializer interceptors yet).
- Docs updated after endpoint changes: Yes.

## Week 3 Summary (2026-06-06)

- What I completed:
	- **Unit test suite fully fixed** — resolved 10 failing test specs by adding missing mock providers across auth and user provider tests; all 27 suites now passing.
	- **Dynamic filtering on all list endpoints:**
		- Posts: date range (startDate/endDate), status enum filter, title search (ILike)
		- Users: firstName search (ILike)
		- Tags: name search (ILike)
	- **Dynamic sorting on all list endpoints** via `SortQueryDto` with allowlist validation to prevent SQL injection
	- **DTO composition pattern** — `IntersectionType` to cleanly combine filter + sort + pagination DTOs per module
	- **Swagger Bearer Authentication** — `addBearerAuth()` in bootstrap, `@ApiBearerAuth('access-token')` on all protected controllers; Authorize button in Swagger UI
	- **Full Swagger query param documentation** — `@ApiPropertyOptional` with examples on all filter/sort/pagination fields
	- **DataResponseInterceptor** (custom, global) — wraps all responses in `{ apiVersion, data }` envelope using ConfigService
	- **ClassSerializerInterceptor** (global) — auto-strips `@Exclude()` fields (`password`, `googleId`) from all responses
	- **Serialization via entity decorators** — `@Exclude()` on User entity sensitive fields; removed manual route-level `@UseInterceptors` from `createUser`
	- **Roadmap + README updated** with current feature set and corrected next steps
- What I learned:
	- `APP_INTERCEPTOR` registration in module providers allows multiple interceptors applied in order — no `IntersectionType` needed, just multiple provider entries
	- `ClassSerializerInterceptor` must come before `DataResponseInterceptor` so serialization runs on the raw entity before it's wrapped
	- `ConfigModule.forRoot()` appearing twice in logs is normal — one is the root init, the other is `forFeature()` in UsersModule
	- `@Exclude()` on entity fields is declarative — once set globally, no endpoint needs manual field filtering
	- Allowlist validation on `sortBy` is critical to prevent SQL injection in dynamic order-by queries
	- TypeORM `ILike` provides case-insensitive partial matching without raw SQL
	- IntersectionType DTO composition cleanly scales across modules without duplicating pagination/sort logic
- Where I got blocked:
	- `multi_replace_string_in_file` failed on one tags import (empty old_string) — required separate fix
	- JWT module appearing 3 times in startup logs was briefly confusing (normal — separate scoped instances per module)
- How I resolved it:
	- Fixed tags import by reading the file first and providing correct context lines for replacement
	- Confirmed multiple module log entries are standard NestJS DI behavior, not bugs
- Week close note:
	- Week 3 completes the NestJS pipeline up to interceptors. Full request lifecycle now covered: Guards ✅ → Interceptors ✅ → Pipes ✅ → Controllers ✅. Exception filter and middleware remain to fully close the filter boundary layers.

## Demo Evidence (Week 3)

- Endpoints verified:
	- `GET /v1/posts?sortBy=createdAt&sortOrder=desc&status=draft&search=nestjs` — 3 results returned, correctly filtered and sorted
	- `GET /v1/users?sortBy=firstName&sortOrder=asc&search=john` — functional
	- `GET /v1/tags?sortBy=name&search=react` — functional
- Swagger UI:
	- Authorize button visible; Bearer token accepted; protected endpoints work from Swagger UI
	- All query params documented with descriptions and examples
- Response shape:
	- All responses wrapped in `{ apiVersion: "0.1.1", data: { ... } }`
	- `password` and `googleId` absent from all user responses
- Tests: 27/27 suites passing, 37/37 tests passing

## Next Week Focus (Week 4)

- Planned lessons:
	- Global `HttpExceptionFilter` to standardise error response shape
	- `LoggerMiddleware` to log method + URL (complete the pipeline)
	- E2E tests for bulk operations (success + rollback scenarios)
	- Auth-focused E2E tests (guard defaults, public opt-out verification)
- Risks and mitigation:
	- Risk: E2E tests require live DB — ensure PostgreSQL is running before test run.
	- Mitigation: Keep unit and E2E test configs separate (`jest` vs `jest:e2e` scripts).

## Standards Self-Check (Week 3)

- Inputs validated with DTO + pipes: Yes.
- Auth enforced with guards: Yes — global `AuthenticationGuard` with explicit public opt-out.
- Response shape/serialization reviewed: Yes — `DataResponseInterceptor` + `ClassSerializerInterceptor` globally registered.
- Docs updated after endpoint changes: Yes.

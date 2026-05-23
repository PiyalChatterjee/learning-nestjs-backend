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

## Course Coverage This Week

- Users module progress: CRUD-style controller flow + DTO validation complete for current phase.
- Posts module progress: full CRUD complete with validated payloads and relationship resolution.
- Tags module progress: create/get complete with many-to-many integration to posts.
- Meta-options module progress: create complete with one-to-one integration to posts.
- Database relationships progress: all 3 major relationship types implemented and tested (M:1, O:1, M:M).
- Database infrastructure progress: TypeORM DataSource + migration scripts ready (active in Week 2+).
- Documentation progress (Swagger/Compodoc): Swagger active and fully documented; Compodoc 100% symbol coverage achieved.
- Auth progress (if covered this week): auth module wiring and basic service checks in place.
- Advanced concepts covered (guards/interceptors/decorators/serialization): decorators, validation pipe, and DTO serialization covered; guards/interceptors pending.
- Docker exploration progress (optional): not started.

## Demo Evidence

- Endpoint(s):
	- `GET /v1/users`, `GET /v1/users/:id`, `POST /v1/users`, `PUT /v1/users/:id`, `PATCH /v1/users/:id`, `DELETE /v1/users/:id`
	- `GET /v1/posts`, `GET /v1/posts/:id`, `POST /v1/posts`, `PUT /v1/posts/:id`, `PATCH /v1/posts/:id`, `DELETE /v1/posts/:id`
	- `GET /v1/tags`, `POST /v1/tags`
	- `POST /v1/meta-options`
- Test(s) added:
	- Module-level specs for users/posts/tags/meta-options compile and pass in current setup.
- Swagger or API proof:
	- Swagger UI available at `/api` with 3 major entity groups fully documented.
- Screenshot/recording link:
	- Pending.
- Commit/PR refs:
	- Local working changes currently tracked in workspace.

## Next Week Focus

- Planned lessons:
	- Activate TypeORM migrations (switch from `synchronize: true` to explicit migration-based schema management).
	- Add auth guards and JWT-based route protection.
	- Write integration tests for post-tags-metadata workflows.
	- Add pagination, filtering, and sorting to list endpoints.
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

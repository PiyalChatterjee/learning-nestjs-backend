# NestJS Masterclass Roadmap (Learning Course)

## Goal

Build a course-aligned backend in small learning increments, with proof of implementation and a clear next-step backlog.

## Current Snapshot (2026-05-19)

- Core app bootstrap is in place with versioned routing and validation.
- Users module has full controller-level CRUD-style routes with DTO validation and TypeORM repository-backed service methods.
- Posts module now has CRUD endpoints (create, get all, get by id, put, patch, delete) with validated DTOs, enums, repository-backed service methods, and formatted author details.
- Shared reusable not-found exception helper is implemented and used in users and posts services.
- Post entity now models author ownership through a relation to users (author_id).
- Swagger is configured and available at /api.
- Compodoc workflow is set with build/serve/watch scripts and generated output isolated to .compodoc.
- JSDoc coverage is complete for scoped backend source files.

## Week-by-Week Status

## Week 1: Setup + Users Module Foundations

Status: Complete

- Project structure and runtime flow implemented in app bootstrap and module wiring.
- Modules/controllers/providers/DI implemented for users, posts, and auth modules.
- Global ValidationPipe configured with whitelist, transform, and forbidNonWhitelisted.
- Users DTO contracts and baseline user endpoints implemented.

## Week 2: Users Module Completion

Status: Complete (Learning Scope)

- Implemented users endpoints: get all (paginated), get by id, create, put, patch, delete.
- DTOs in place: create, update, patch.
- Service now uses TypeORM repository operations (find/create/save/remove) and reusable 404 behavior.
- Auth interaction is currently basic (token check placeholder), not production-grade auth.

## Week 3: Posts Module

Status: Complete (Learning Scope)

- Implemented posts endpoints: get all, get by id, create, put, patch by id, delete.
- Post DTOs and enums implemented (create, update, patch + post type/status/meta options + authorEmail create flow).
- Reusable not-found handling integrated in posts service.
- Service uses repository pattern with email-based author lookup and author response formatting.

## Week 4: Database Relationships Module

Status: In Progress

- TypeORM entities are wired for persistence in users and posts services.
- Post-to-user ownership relation is modeled via `ManyToOne` (`author_id`).
- Remaining: add inverse relation on user side (if needed), tighten migration strategy (reduce reliance on synchronize), and expand relational queries/use-cases.

## Week 5: API Documentation Workflow

Status: Complete (Learning Baseline)

- Swagger setup complete in bootstrap and endpoint decorators applied.
- Compodoc installed and script workflow standardized.
- Documentation generation scripts:
	- npm run doc
	- npm run doc:serve
	- npm run doc:watch
- Generated docs output moved to .compodoc and ignored from git tracking.

## Week 6: Auth + Advanced NestJS Concepts

Status: Partial

- Auth module and service wiring are present.
- ForwardRef cross-module wiring between auth and users is implemented.
- JWT/local strategy, guards, interceptors, custom decorators, and route protection are pending.

## Week 7: Quality + Optional Docker Exploration

Status: Partial

- Unit test scaffolding exists and targeted module tests pass.
- Broader service behavior tests and e2e coverage are still pending.
- Docker exploration not started.

## Immediate Next Priorities

1. Add dedicated tests for new posts CRUD methods (service + controller).
2. Add at least one auth guard and protect selected users/posts routes.
3. Strengthen DB lifecycle with migrations and reduce reliance on `synchronize` for schema changes.
4. Expand relationship usage (author-centric queries and optional inverse mapping from users to posts).
5. Expand test coverage beyond smoke tests.

## Continuous Tracking Rules

- After each lesson, update the lesson log table below.
- If a problem occurs, log it in docs/learning-issues.md using: symptom, root cause, change made, verification result.
- Keep one commit (or one clear commit section) per lesson chunk when possible.

## Lesson-to-Implementation Log

| Date | Course Topic | Implementation Done | Evidence (Commit/PR/Doc) | Confidence (1-5) | Open Questions |
|---|---|---|---|---|---|
| 2026-05-18 | Bootstrap + validation + modules | v1 global prefix, global ValidationPipe, app module imports users/posts/auth | src/main.ts, src/app.module.ts, docs/learning-issues.md | 5 | Should a dedicated health module be added now or later with DB checks? |
| 2026-05-18 | Users module CRUD + DTOs | Users controller routes + create/update/patch DTOs + service with reusable not-found checks | src/modules/users/users.controller.ts, src/modules/users/provider/users.service.ts, docs/learning-issues.md | 4 | Replace in-memory service with repository/persistence next? |
| 2026-05-18 | Posts module DTO + patch flow | CreatePostDto structure with enums/metaOptions + posts create/get/patch routes + reusable not-found checks | src/modules/posts/dtos/create-post.dto.ts, src/modules/posts/posts.controller.ts, src/modules/posts/provider/posts.service.ts, docs/learning-issues.md | 4 | Enforce non-empty patch body and complete full CRUD now? |
| 2026-05-18 | API docs + Compodoc workflow | Swagger at /api + Compodoc scripts split (doc/doc:serve/doc:watch) + generated output isolation | src/main.ts, package.json, tsconfig.json, .gitignore, docs/learning-issues.md | 5 | Publish generated docs externally or keep local-only for learning? |
| 2026-05-19 | Users + posts repository transition | Replaced in-memory behavior with TypeORM repositories in users/posts services; create post now resolves author by email | src/modules/users/provider/users.service.ts, src/modules/posts/provider/posts.service.ts, docs/learning-issues.md | 4 | Should unauthorized checks move from generic Error to Nest UnauthorizedException globally? |
| 2026-05-19 | Post ownership relation and response shaping | Added post author relation to users and helper-based author response formatting (name + email) | src/modules/posts/post.entity.ts, src/modules/posts/helpers/format-post-with-author.helper.ts, src/modules/posts/provider/posts.service.ts | 4 | Add inverse `OneToMany` relation in user entity now or later when needed? |
| 2026-05-19 | Posts full CRUD completion | Added remaining posts operations: get by id, put, delete; added UpdatePostDto and aligned PatchPostDto; wired controller + service repository flow | src/modules/posts/posts.controller.ts, src/modules/posts/provider/posts.service.ts, src/modules/posts/dtos/update-post.dto.ts, src/modules/posts/dtos/patch-post.dto.ts | 4 | Should update/patch support author reassignment by email in a separate dedicated endpoint? |

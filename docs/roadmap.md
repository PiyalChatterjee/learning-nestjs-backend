# NestJS Masterclass Roadmap (Learning Course)

## Goal

Build a course-aligned backend in small learning increments, with proof of implementation and a clear next-step backlog.

## Current Snapshot (2026-05-18)

- Core app bootstrap is in place with versioned routing and validation.
- Users module has full controller-level CRUD-style routes with DTO validation.
- Posts module has create/get/patch flow with validated DTOs and enums.
- Shared reusable not-found exception helper is implemented and used in users and posts services.
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

Status: Mostly Complete

- Implemented users endpoints: get all (paginated), get by id, create, put, patch, delete.
- DTOs in place: create, update, patch.
- Service includes in-memory data operations and reusable 404 behavior.
- Auth interaction is currently basic (token check placeholder), not production-grade auth.
- Repository layer is not introduced yet.

## Week 3: Posts Module

Status: In Progress

- Implemented posts endpoints: get all by userId query, create, patch by id.
- Post DTOs and enums implemented (post type, status, nested meta options).
- Reusable not-found handling integrated in posts service.
- Remaining for full CRUD: get by id, put, delete, and repository abstraction.

## Week 4: Database Relationships Module

Status: Not Started

- Current users/posts relation is simulated in-memory through service composition.
- No persistent relationship modeling yet (TypeORM/Mongoose not wired).

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

1. Finish posts CRUD endpoints (get by id, delete, optional put).
2. Add at least one auth guard and protect selected users/posts routes.
3. Introduce a repository layer (or clearly documented persistence abstraction).
4. Start database relationship phase for user-post ownership.
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

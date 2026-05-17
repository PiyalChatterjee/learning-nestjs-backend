# NestJS Masterclass Roadmap (Learning Course)

## Goal

Build a course-aligned backend in small learning increments, capturing proof of implementation after each lesson.

## Week 1: Setup + Users Module Foundations

- Project structure and runtime flow (`main.ts`, `app.module.ts`, feature modules).
- Modules, controllers, providers, and dependency injection.
- DTOs, validation pipes, and exception handling basics.
- Begin `users` module structure and baseline endpoints.
- Deliverable: starter `users` module with validated input contracts and basic controller/service.

## Week 2: Users Module Completion

- User operations and profile-related flows from the course.
- Authentication-related user interactions as introduced in lessons.
- Add service/repository layering for maintainability.
- Deliverable: complete user-focused CRUD/profile flow.

## Week 3: Posts Module

- Create `posts` module with CRUD endpoints.
- Add request validation and response shaping.
- Link controller/service/repository boundaries clearly.
- Deliverable: complete posts CRUD flow.

## Week 4: Database Relationships Module

- Model and implement relationships between `User` and `Post` entities/documents.
- Apply relationship-aware queries and service-level rules.
- Document relationship decisions and tradeoffs.
- Deliverable: relationship-backed user-post operations.

## Week 5: API Documentation Workflow

- API docs with Swagger (`@nestjs/swagger`) and endpoint grouping.
- In-doc API testing via Swagger UI.
- Codebase documentation with Compodoc.
- Deliverable: generated API docs and a repeatable docs generation command.

## Week 6: Auth + Advanced NestJS Concepts

- JWT/local auth flow where covered in course path.
- Guards, interceptors, serialization (`class-transformer`), and custom decorators.
- Deliverable: protected routes with at least one reusable cross-cutting component.

## Week 7: Quality + Optional Docker Exploration

- Code standards pass: naming, module boundaries, and DTO/entity separation.
- Unit tests for service logic and E2E tests for critical paths.
- Optional Docker setup for local development and portability.
- Deliverable: tested baseline + optional Dockerized run path.

## Continuous Tracking Rules

- After each lesson, update the lesson log table below.
- If a problem occurs, log it in `docs/learning-issues.md` using: symptom, root cause, change made, verification result.
- Keep one commit (or one clear commit section) per lesson chunk when possible.

## Lesson-to-Implementation Log

| Date | Course Topic | Implementation Done | Evidence (Commit/PR/Doc) | Confidence (1-5) | Open Questions |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

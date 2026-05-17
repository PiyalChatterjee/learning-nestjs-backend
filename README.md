# NestJS Backend Track

Goal: improve backend development skills through structured implementation while following your Udemy NestJS course.

## Base Structure

- `src/modules/users` - user management, profile, and auth-related user flows.
- `src/modules/posts` - blog post CRUD and retrieval.
- `src/modules/health` - health and readiness endpoints.
- `src/common` - shared guards, interceptors, filters, pipes.
- `src/config` - environment and app config.
- `src/database` - DB setup and relationships support (entities/schemas, migrations).
- `test` - unit and integration tests.
- `docs` - roadmap, design notes, and check-ins.

## Course Module Focus

- Users Module: authentication-related user operations, user profile flows.
- Posts Module: create, update, delete, and retrieve blog posts.
- Database Relationships Module: user-post relationships and related persistence patterns.
- Optional Exploration: Docker-based setup for local containerized development.

## Suggested Starter Commands

```bash
npm i -g @nestjs/cli
nest new nestjs-backend
npm run start:dev
```

## Implementation Rule

For each lesson you complete in the course, map it to one practical change in this repository and log it in `docs/roadmap.md`.
Treat this repository as a learning lab: small, verifiable increments over perfect architecture in one shot.
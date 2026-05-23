# NestJS Backend Track

**Goal:** Structured NestJS backend learning through hands-on implementation of real-world patterns—users, posts, tags, metadata—with focus on persistence, relationships, validation, and reusable architecture.

**Status:** Week 1 Complete. All core CRUD flows for 4 major entities are live with many-to-many relationships, validation helpers, reusable exception/validator patterns, and database infrastructure ready for migrations.

## Base Structure

- `src/modules/users` - User management with CRUD, DTO validation, and email-based author resolution.
- `src/modules/posts` - Blog post CRUD with repository persistence, validated DTOs, author ownership, tag resolution, and metadata nesting.
- `src/modules/tags` - Tag create/list with many-to-many relation to posts via `post_tags` junction table.
- `src/modules/meta-options` - JSON-backed metadata for posts with one-to-one relation.
- `src/common/exceptions` - Reusable exception helpers for 404 and unique-constraint conflicts.
- `src/common/validators` - Reusable tag relation validator for many-to-many integrity.
- `src/helpers` - Response formatting and JSON parsing helpers.
- `src/common` - Shared guards, interceptors, filters, pipes.
- `src/config` - Environment and app config.
- `src/database` - DB setup and relationships support (entities/schemas, migrations).
- `test` - Unit and integration tests.
- `docs` - Roadmap, design notes, and check-ins.

## Key Implementation Highlights

- **Many-to-Many Relations:** Posts ↔ Tags via TypeORM `@ManyToMany` + `@JoinTable` with automatic junction table (`post_tags`).
- **Repository Pattern:** All persistence delegated to TypeORM repositories with service-level queries and error mapping.
- **DTO Validation:** Every endpoint enforces request shape via class-validator decorators (enums, URLs, arrays, nested objects).
- **Relationship Integrity:** Service-level tag resolution rejects requests with missing tags (404), validated on create/update/patch.
- **Unique Constraint Handling:** DB uniqueness violations (e.g., duplicate slugs) mapped to clean 409 Conflict responses.
- **Swagger Documentation:** All endpoints documented with request/response shapes, error codes, and parameter descriptions.
- **Compodoc 100% Coverage:** All exports have JSDoc (class, method, property, interface).

## Setup & Run

### Prerequisites
- Node.js v18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` in project root:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=nestjs_backend
```

### Start Development Server

```bash
npm run start:dev
```

Server runs on `http://localhost:8000`

- **Swagger Docs:** `http://localhost:8000/api`
- **Health Check:** `http://localhost:8000/` (unversioned)
- **API Prefix:** `/v1` (e.g., `GET /v1/posts`)

### Run Tests

```bash
npm run test
```

### Generate Documentation

```bash
npm run doc      # One-time generation to ./.compodoc
npm run doc:serve # Serve generated docs locally
npm run doc:watch # Watch and rebuild on file changes
```

## Database & Migrations

### Current Setup (Week 1)
- **Mode:** Development with `synchronize: true`
- **Workflow:** Update entities → restart server → schema auto-applies
- **Entities:** User, Post, Tag, MetaOption auto-discovered and synced
- **No action required:** Just edit entities and restart `npm run start:dev`

### Migration Infrastructure (Ready for Production)
Configuration is in place at `src/database/data-source.ts`. When you reach the Migrations lesson in Week 2+, switch to explicit migrations:

```bash
npm run migration:generate -- -n DescriptiveChangeName  # Auto-generate from entity diff
npm run migration:run                                   # Apply pending migrations
npm run migration:revert                                # Rollback last migration
```

Migration files auto-save to `src/database/migrations/` and track your schema history in version control.

## Project Files

- **[docs/roadmap.md](docs/roadmap.md)** — Course lessons mapped to implementation with status tracking.
- **[docs/learning-issues.md](docs/learning-issues.md)** — Resolved issues, root causes, fixes, and quick reference Q&A.
- **[docs/coding-standards.md](docs/coding-standards.md)** — Code style, error handling, tests, and JSDoc expectations.
- **[docs/weekly-checkins.md](docs/weekly-checkins.md)** — Week-by-week progress summaries.

## Endpoints Overview

### Users
- `POST /v1/users` - Create user
- `GET /v1/users` - List all users
- `GET /v1/users/:id` - Get user by ID
- `PUT /v1/users/:id` - Replace user
- `PATCH /v1/users/:id` - Partial update
- `DELETE /v1/users/:id` - Delete user

### Posts
- `POST /v1/posts` - Create post with tags, metadata, author email
- `GET /v1/posts` - List all posts with author & tag details
- `GET /v1/posts/:id` - Get post by ID
- `PUT /v1/posts/:id` - Full update (replaces tags and metadata)
- `PATCH /v1/posts/:id` - Partial update (selective tag/metadata updates)
- `DELETE /v1/posts/:id` - Delete post

### Tags
- `POST /v1/tags` - Create tag
- `GET /v1/tags` - List all tags

### Meta Options
- `POST /v1/meta-options` - Create metadata entry

## Architecture Decisions

| Pattern | Why |
|---------|-----|
| Repository + Service | Decouples domain logic from DB implementation; easier testing. |
| @JoinTable for Many-to-Many | Normalized DB structure; supports complex queries and reuse. |
| Validation at DTO Layer | Enforces contracts early; cleaner service methods. |
| Reusable Exception Helpers | Consistent error handling; avoids duplication across modules. |
| Eager Loading (Tags, Meta) | Reduces N+1 queries in post responses. |
| Email-Based Author Lookup | Clients reference human identifiers, not internal IDs. |

## Next Steps (Post-Week 1)

1. Add auth guards and route protection (at least one JWT-protected endpoint).
2. Write integration tests for post-tags-metadata workflows.
3. Add pagination, filtering, and sorting to list endpoints.
4. **Migrate to explicit TypeORM migrations** (infrastructure ready in `src/database/data-source.ts`; switch `synchronize: false` when ready; see "Database & Migrations" section).
5. Explore Docker setup for containerized local development.

## Learning Philosophy

- **Incremental:** Each lesson = one practical change in code, mapped to roadmap.
- **Verified:** Every endpoint tested manually (Swagger/curl) or via automated tests.
- **Documented:** Issues, decisions, and insights logged immediately in `docs/`.
- **Reusable:** Common patterns (validation, exception handling) extracted into helpers early.

---

## Original Starter (For Reference)

```bash
npm i -g @nestjs/cli
nest new nestjs-backend
npm run start:dev
```
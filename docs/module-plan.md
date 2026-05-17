# Module Plan

## Course-Aligned Build Order

1. `health`
2. `users`
3. `posts`
4. database relationships implementation
5. optional Docker setup and runtime polish

## Initial Domain Modules

- `health`
- `users`
- `posts`
- `auth` (as introduced by the course flow)

## Cross-Cutting Shared Modules

- `common` for guards, interceptors, decorators, pipes, and shared types.
- `config` for environment/config validation and typed config access.
- `database` for relationship-aware persistence wiring based on lesson phase.

## Layering Convention

Inside each module:

- `controller` for transport/http layer.
- `service` for business use-cases.
- `repository` for persistence abstraction.
- `dto` for request/response contracts.
- `entities` for domain models.

For MongoDB features, `schemas` may be used instead of `entities`.

## Relationship Modeling Scope

- Primary relationship focus: one user to many posts.
- Keep relationship rules in service layer (ownership, lifecycle, and query constraints).
- Keep relationship-specific query methods explicit in repositories.

## Example Folder Pattern

```text
src/modules/users/
  users.module.ts
  users.controller.ts
  users.service.ts
  dto/
    create-user.dto.ts
    update-user.dto.ts
  entities/
    user.entity.ts
  repository/
    users.repository.ts
```

## Posts Module Pattern

```text
src/modules/posts/
  posts.module.ts
  posts.controller.ts
  posts.service.ts
  dto/
    create-post.dto.ts
    update-post.dto.ts
  entities/
    post.entity.ts
  repository/
    posts.repository.ts
```

## Authentication Structure

```text
src/modules/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  guards/
    jwt-auth.guard.ts
    roles.guard.ts
  strategies/
    jwt.strategy.ts
    google.strategy.ts
  decorators/
    roles.decorator.ts
```

## Documentation Artifacts

- Swagger setup lives close to bootstrap (`src/main.ts`) and module decorators.
- Compodoc output should be generated and referenced in workflow docs.
- Keep endpoint descriptions close to controllers using swagger decorators.

## Optional Docker Exploration

- Add Docker only after users/posts/relationships flow is stable.
- Keep dockerization optional and clearly documented as a learning extension.

## Guardrails

- Keep business rules in services, not controllers.
- Do not expose ORM entities directly in API responses.
- One module should own one bounded context.
- Keep authentication concerns inside `auth` and shared guard/decorator layers.
- For dual DB learning, document which module uses TypeORM vs Mongoose.

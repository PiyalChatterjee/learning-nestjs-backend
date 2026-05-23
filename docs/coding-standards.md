# Backend Coding Standards

## API

- Version APIs with `/v1` prefix.
- Return consistent response envelopes.
- Validate all external inputs.
- Use DTOs for request contracts and serialization classes for responses.
- Add Swagger decorators for route summary, payload shape, and auth requirements.

## Documentation

- Keep Swagger metadata updated whenever endpoint contracts change.
- Generate Compodoc after major module additions.
- Document assumptions and tradeoffs in markdown under `docs/`.

### JSDoc Checklist For New Exports

- Add class-level JSDoc for every exported controller/service/entity/DTO/helper.
- Add property-level JSDoc for exported DTO/entity fields.
- Add method-level JSDoc for exported public methods/functions.
- Add constructor-level JSDoc when dependencies are injected.
- For interfaces/types used in docs, add brief purpose comments on the type and key fields.
- After adding/refactoring exports, run `npm run doc` and check `.compodoc/coverage.html` for non-100 entries.

## Error Handling

- Use domain-specific exceptions in services.
- Map internal errors to safe HTTP responses.
- Log root causes with correlation id.

## Security

- JWT token expiry and refresh strategy.
- Role or permission checks at guard level.
- Never trust client-provided identifiers.
- Keep auth strategy code modular (`jwt`, `google`, future providers).

## Database

- Keep persistence access behind repository-style abstractions.
- Do not leak TypeORM entities or Mongoose documents directly to external responses.
- If both DB tracks are present during learning, annotate module ownership clearly.
- Enforce relationship integrity rules (for example, user-post ownership checks) in services.

## Learning Workflow

- Keep changes incremental and mapped to current lesson scope.
- Prefer clarity and explicit structure over premature optimization.
- Record blockers and fixes in `docs/learning-issues.md` immediately after resolution.

## Advanced NestJS Usage

- Prefer guards for access control and interceptors for cross-cutting response logic.
- Use custom decorators to keep controller code declarative.
- Keep validation and transformation at module boundaries.

## Tests

- Unit test each service with mocked dependencies.
- Add E2E tests for auth and one business flow.
- Keep test fixtures deterministic.
- For each lesson milestone, include at least one verification artifact (test, curl output, or Swagger proof).

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A reusable NestJS API base (TypeScript + MySQL + TypeORM) meant to be the starting point for
multiple separate projects, not a single product. Changes here should stay generic/reusable —
project-specific business logic belongs in its own module under `src/modules/`, not in `common/`,
`config/`, or `database/`.

## Commands

```bash
npm install
docker compose up -d mysql   # MySQL 8 on :3306 + Adminer on :8080 (needs Docker running)
npm run start:dev            # watch mode
npm run build                # nest build -> dist/
npm run lint                 # eslint --fix over src/ and test/
npm run format                # prettier over src/ and test/
npm test                     # unit tests (jest, rootDir: src, pattern *.spec.ts)
npm run test:watch
npm run test:cov
npm run test:e2e             # requires a reachable MySQL (see docker-compose.yml)
```

Run a single unit test file: `npx jest src/modules/hello/hello.service.spec.ts`.
Run a single e2e test: `npx jest --config ./test/jest-e2e.json test/app.e2e-spec.ts`.

Migrations (TypeORM CLI, driven by `src/database/data-source.ts`, not the app's DI container):

```bash
npm run migration:generate -- src/database/migrations/NombreDeLaMigracion
npm run migration:create -- src/database/migrations/NombreDeLaMigracion
npm run migration:run
npm run migration:revert
```

`DB_SYNCHRONIZE` must stay `false` outside of disposable local environments — schema changes go
through migrations, generated against real entities.

## Architecture

**Config loading and validation is two-layered and both layers must stay in sync.**
`src/config/configuration.ts` builds the typed nested config object (`app`, `database`, `throttle`,
`security`) that the rest of the app reads via `ConfigService.get('database.host')` etc.
`src/config/validation.schema.ts` is a separate Joi schema that validates the raw `process.env` at
`ConfigModule.forRoot()` time and fails fast on boot if a required var is missing. Adding a new env
var means updating both files (plus `.env.example`).

**Two separate TypeORM entry points exist on purpose.** `src/database/typeorm.config.ts`
(`buildTypeOrmOptions`) is consumed by `AppModule` via `TypeOrmModule.forRootAsync` and goes through
Nest's DI/ConfigService. `src/database/data-source.ts` is a standalone `DataSource` used only by the
TypeORM CLI for migrations — it loads env vars directly via `dotenv/config` since it runs outside
the Nest app context. Keep connection settings consistent between the two when changing DB config.

**Every entity should extend `BaseEntity`** (`src/database/base.entity.ts`): uuid `id`, `createdAt`,
`updatedAt`, `deletedAt` (soft delete). Don't redeclare these columns per-entity.

**Global cross-cutting behavior lives in `src/common/` and is wired up once in `AppModule`:**
- `AllExceptionsFilter` (`common/filters/`) — every thrown error, `HttpException` or not, is
  normalized to `{ success: false, statusCode, path, timestamp, message }`.
- `TransformInterceptor` (`common/interceptors/`) — every successful response is wrapped in
  `{ success: true, statusCode, data }`. Controllers just return the raw payload; don't wrap it
  yourself.
- `LoggingInterceptor` — logs method/URL/status/duration per request.
- `RequestIdMiddleware` (`common/middleware/`) — applied to `'*splat'` (Express 5 / path-to-regexp
  v8 wildcard syntax — plain `'*'` throws a route-conversion warning under the global prefix, don't
  revert this to `'*'`). Reuses an inbound `x-request-id` header or generates one, and echoes it
  back on the response for log correlation.
- `ThrottlerGuard` is registered globally via `APP_GUARD` (rate limiting, config-driven).
- `ApiKeyGuard` (`common/guards/api-key.guard.ts`) exists but is **not** registered globally —
  auth strategy is intentionally left to each project (JWT/OAuth/API key), since this repo is a
  shared base. Opt a route/controller in with `@UseGuards(ApiKeyGuard)`, or promote it to
  `APP_GUARD` in `AppModule` once a project settles on API-key auth. `@Public()`
  (`common/decorators/public.decorator.ts`, backed by `IS_PUBLIC_KEY`) is the bypass mechanism for
  guards that check that metadata — already applied to `HelloController` and `HealthController` as
  the reference pattern, even though it's currently a no-op until a guard checking it is global.

**Routing**: global prefix is `api`, versioning is URI-based (`VersioningType.URI`) with
`defaultVersion` from config (`API_VERSION`) — so `HelloController`'s `@Get()` on the `hello` path
resolves to `/api/v1/hello`, not `/api/hello`. New controllers follow the same pattern without
extra decoration.

**Health check** (`src/health/`) uses `@nestjs/terminus` and actually pings the DB
(`TypeOrmHealthIndicator.pingCheck`) rather than just returning 200 — it will fail if MySQL is
unreachable.

**Module layout for new features**: `src/modules/<name>/` with `<name>.module.ts`,
`.controller.ts`, `.service.ts`, `dto/`, `entities/` (extending `BaseEntity`), then register the
module in `AppModule.imports`. Use `common/dto/pagination-query.dto.ts`
(`PaginationQueryDto`, has a computed `.skip`) and `common/dto/paginated-result.dto.ts`
(`buildPaginatedResult`) for paginated list endpoints instead of rolling new pagination shapes.

## Version pinning note

`typeorm` is pinned to `^0.3.31` and `typescript` to `^5.9.3` deliberately, even though newer
majors (`typeorm@1.x`, `typescript@7.x`) are available on the registry — they shipped very
recently and haven't been validated against this stack. Don't bump either across a major version
without deliberately testing compatibility first.

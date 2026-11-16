# API Base (NestJS + TypeScript + MySQL + TypeORM)

Base reutilizable para construir APIs REST. Incluye configuración validada por entorno,
conexión a MySQL vía TypeORM, guards, middleware, interceptores y manejo de errores
uniforme, listos para clonar por proyecto.

## Stack

- [NestJS 11](https://docs.nestjs.com/) + TypeScript 5.9
- MySQL 8 + [TypeORM](https://typeorm.io/) (`mysql2` driver)
- `@nestjs/config` + `joi` para validar variables de entorno al arrancar
- `@nestjs/throttler` para rate limiting global
- `@nestjs/terminus` para health checks (incluye ping a la base de datos)
- `class-validator` / `class-transformer` para DTOs
- `helmet` + `compression` + CORS configurables
- Jest (unit + e2e) y ESLint + Prettier

## Estructura

```
src/
├── main.ts                     # bootstrap: helmet, cors, versioning, validation pipe
├── app.module.ts                # wiring de config, DB, throttler, guards/filters globales
├── config/
│   ├── configuration.ts         # objeto de config tipado (app/database/throttle/security)
│   └── validation.schema.ts     # esquema Joi de variables de entorno
├── database/
│   ├── data-source.ts           # DataSource para el CLI de TypeORM (migraciones)
│   ├── typeorm.config.ts        # factory de TypeOrmModuleOptions
│   ├── base.entity.ts           # entidad base (id uuid, timestamps, soft delete)
│   └── migrations/              # migraciones generadas
├── common/
│   ├── constants/                # claves de metadata (p.ej. IS_PUBLIC_KEY)
│   ├── decorators/               # @Public()
│   ├── dto/                      # PaginationQueryDto, PaginatedResult
│   ├── filters/                  # AllExceptionsFilter (envelope de error uniforme)
│   ├── guards/                   # ApiKeyGuard (opt-in por ruta/controlador)
│   ├── interceptors/              # LoggingInterceptor, TransformInterceptor
│   └── middleware/                # RequestIdMiddleware (x-request-id)
├── health/                       # GET /api/v1/health
└── modules/
    └── hello/                    # GET /api/v1/hello — ejemplo end-to-end
```

## Convenciones de respuesta

- Éxito: `TransformInterceptor` envuelve toda respuesta en `{ success: true, statusCode, data }`.
- Error: `AllExceptionsFilter` normaliza cualquier excepción a
  `{ success: false, statusCode, path, timestamp, message }`.
- Cada request recibe/propaga un header `x-request-id` (ver `RequestIdMiddleware`) para
  correlacionar logs.

## Requisitos

- Node.js >= 20
- Docker (opcional, para levantar MySQL local) o una instancia MySQL 8 accesible

## Puesta en marcha

```bash
npm install
cp .env.example .env      # ya existe un .env de ejemplo, ajusta credenciales si hace falta
docker compose up -d      # levanta mysql (3306) y adminer (8080) para desarrollo local
npm run start:dev
```

La API queda expuesta con prefijo global `api` y versionado por URI, por ejemplo:

- `GET http://localhost:3000/api/v1/hello`
- `GET http://localhost:3000/api/v1/hello?name=Claude`
- `GET http://localhost:3000/api/v1/health`

## Variables de entorno

Ver `.env.example`. Se validan al arrancar con `validation.schema.ts`; si falta una
variable requerida (por ejemplo `DB_HOST`), Nest falla rápido con un mensaje claro en
vez de fallar más adelante al primer query.

## Base de datos y migraciones

`DB_SYNCHRONIZE` debe permanecer en `false` fuera de un entorno local descartable:
usa migraciones para todo cambio de esquema.

```bash
# generar una migración a partir del diff de entidades vs. la BD
npm run migration:generate -- src/database/migrations/NombreDeLaMigracion

# crear una migración vacía
npm run migration:create -- src/database/migrations/NombreDeLaMigracion

# aplicar migraciones pendientes
npm run migration:run

# revertir la última migración
npm run migration:revert
```

Toda entidad nueva debe extender `BaseEntity` (`src/database/base.entity.ts`) para
heredar `id` (uuid), `createdAt`, `updatedAt` y `deletedAt` (soft delete) de forma
consistente.

## Autenticación

El proyecto no impone una estrategia de auth (JWT, sesiones, OAuth) porque varía por
proyecto. Lo que sí incluye es el patrón para añadirla rápido:

- `ApiKeyGuard` (`src/common/guards/api-key.guard.ts`): guard de ejemplo por API key,
  útil para endpoints de servicio a servicio o administración. No está activado
  globalmente; actívalo agregando `{ provide: APP_GUARD, useClass: ApiKeyGuard }` en
  `app.module.ts` cuando el proyecto lo necesite.
- `@Public()` (`src/common/decorators/public.decorator.ts`): marca rutas exentas de
  guards globales que respeten `IS_PUBLIC_KEY` (ya usado en `HelloController` y
  `HealthController` como ejemplo).

Para JWT/OAuth añade `@nestjs/passport` + la estrategia correspondiente y un guard
que siga el mismo patrón de `@Public()`.

## Rate limiting

`ThrottlerGuard` está activo de forma global usando `THROTTLE_TTL` (ms) y
`THROTTLE_LIMIT` (requests por ventana) desde `.env`.

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run start:dev` | Arranca en modo watch |
| `npm run build` | Compila a `dist/` |
| `npm run lint` | ESLint con autofix |
| `npm run format` | Prettier sobre `src` y `test` |
| `npm test` | Tests unitarios |
| `npm run test:e2e` | Tests e2e (requiere MySQL corriendo) |
| `npm run migration:*` | Ver sección de migraciones |

## Añadir un nuevo módulo de negocio

1. `src/modules/<nombre>/` con `<nombre>.module.ts`, `.controller.ts`, `.service.ts`,
   `dto/`, `entities/` (extendiendo `BaseEntity`).
2. Registrar el módulo en `AppModule.imports`.
3. Reusar `PaginationQueryDto` / `buildPaginatedResult` para listados paginados.
4. Reusar `ApiKeyGuard` + `@Public()` si el módulo necesita rutas protegidas/abiertas.

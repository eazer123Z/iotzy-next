# Architecture (Large-Scale Ready Baseline)

## Monorepo layout

- `apps/web` : React + Vite UI layer
  - `src/components` : reusable UI blocks
  - `src/data` : static menu/catalog data
  - `src/services` : API client boundary
- `apps/api` : PHP-native API
  - `src/Controllers` : endpoint orchestration
  - `src/Http` : router + response helpers
  - `src/*Repository.php` : DB access layer

## Runtime flow

1. Browser hits `apps/web`.
2. Frontend requests `apps/api/public/index.php` endpoints.
3. Router dispatches to controller.
4. Controller calls repositories.
5. Repositories query MySQL schema (`schema.sql`) via PDO.

## Why this structure

- Clear separation of concerns.
- Easier scaling from demo to complex project modules.
- Easier onboarding for team members by folder responsibility.

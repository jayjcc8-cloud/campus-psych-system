# Campus Psych Platform

This repository contains the initial project scaffold for the campus psychology booking and support platform defined in [`campus_psych_prd_v1_1.md`](./campus_psych_prd_v1_1.md).

## Workspace layout

- `apps/api`: Fastify-based API service
- `apps/admin-web`: React + Vite admin console for counselors and operators
- `apps/miniapp`: Taro miniapp for students
- `packages/domain`: shared domain types, enums, fixtures, and product rules
- `docs`: implementation notes and project bootstrap guidance

## Suggested boot order

1. Install `pnpm` and workspace dependencies.
2. Run `pnpm --filter @campus-psych/api db:init` to create and seed the local SQLite database.
3. Start the API and validate health plus appointment state rules.
4. Start the admin web to review dashboards and workflow routes.
5. Start the miniapp to validate the student-side booking funnel.

## Database

- Default database file: `apps/api/data/campus-psych.sqlite`
- Schema source: `apps/api/src/db/schema.sql`
- Init scripts: `pnpm --filter @campus-psych/api db:migrate`, `db:seed`, `db:init`

## Product assumptions baked into the scaffold

- MVP is offline counseling only.
- Anonymous display is enabled by default.
- Risk flags are workflow labels, not medical outcomes.
- Appointment, risk, and permissions logic is shared through `packages/domain`.

## Next engineering steps

1. Replace the seeded SQLite repositories with production-grade database infrastructure when deployment targets are confirmed.
2. Add unified authentication and school-specific identity integration.
3. Convert placeholder route handlers into full validation, authorization, and error-handling modules.
4. Add end-to-end tests around appointment locking, privacy, and risk escalation.

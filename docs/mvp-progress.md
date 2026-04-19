# MVP Progress

## Current status

- PRD has been expanded into a development-ready draft in `campus_psych_prd_v1_1.md`.
- Monorepo scaffold is in place for API, admin web, miniapp, and shared domain package.
- Shared domain now contains appointment states, permissions, risk rules, fixtures, and audit log types.
- API now has a lightweight service layer, SQLite schema, repository layer, write endpoints, and audit logging hooks.
- API now enforces basic header-based authentication and route-level role guards for admin, counselor, and student access.
- Admin web and miniapp now include small API clients and will attempt to read from the local API before falling back to fixtures.

## What is working conceptually

- Database bootstrap scripts can create and seed the local SQLite file.
- Appointment creation validates slot conflicts and active booking limits.
- Appointment status updates respect the shared transition map.
- Session record creation can generate risk flags and audit logs.
- Config updates and risk updates now have write endpoints.
- Statistics are derived from the persisted repository data instead of static fixtures.
- Unauthorized requests are rejected with `401`, mismatched roles are rejected with `403`, and public config remains readable without auth headers.

## Still missing before a real MVP trial

- Dependency installation and runtime verification
- Authentication and role enforcement
- Real miniapp build configuration
- Form submission flows in the admin web and miniapp
- End-to-end and contract tests

## Recommended next step

1. Install dependencies and get `api` and `admin-web` running locally.
2. Add auth middleware and per-route authorization checks.
3. Implement create/update forms on the admin web and miniapp.
4. Add tests for repository behavior and appointment/risk transaction paths.

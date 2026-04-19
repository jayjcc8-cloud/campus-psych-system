# Bootstrap Plan

## Chosen stack

- Monorepo: `pnpm` workspace
- API: Fastify + TypeScript
- Persistence: SQLite + `better-sqlite3` for local MVP
- Admin web: React + Vite + React Router
- Miniapp: Taro + React
- Shared domain: TypeScript package

## Why this shape

- The PRD has three clients with shared enums and permissions.
- Risk, booking, and privacy rules should live once and be reused everywhere.
- The stack keeps the first version easy to split by team later.

## Implementation priorities

1. Finalize the seeded SQLite schema and repository behavior with automated tests.
2. Add API auth and role-based access checks before wiring real school data.
3. Finalize appointment and risk state machines with the school.
4. Wire richer admin console and miniapp forms to the API using shared DTOs.

## Open decisions

- School SSO strategy
- Real-name binding requirement
- Notification channel strategy
- Escalation SLA for high-risk records

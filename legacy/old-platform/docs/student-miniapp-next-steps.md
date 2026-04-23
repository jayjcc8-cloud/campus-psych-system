# Student Miniapp Next Steps

## Goal

Move the student-side miniapp from read-only scaffold state to an MVP booking flow aligned with `campus_psych_prd_v1_1.md`.

## Current baseline

- Pages exist for `home`, `counselors`, `appointment`, `my`, and `emergency`.
- The miniapp API client can read:
  - counselors
  - my appointments
  - public config
- Write actions such as login consent, appointment submission, and cancellation are not implemented.

## P0: First delivery slice

1. Login and agreement bootstrap
- Add a lightweight startup flow for:
  - mock student login
  - agreement acceptance state
  - force-student-id-binding prompt when enabled by config
- Keep the first version local or mock-backed if the final WeChat auth flow is not ready.

2. Home page wiring
- Render public announcement and emergency shortcut from live config.
- Turn the emotional entry cards into real navigation into the booking flow.

3. Counselor list and detail flow
- Show counselor list from live API.
- Add counselor detail page or detail drawer with:
  - intro
  - specialty
  - next available slot
- Let the student enter the booking flow from a counselor entry point.

4. Booking submission
- Add `POST /appointments` integration to the miniapp API client.
- Build a simple booking form with:
  - counselor
  - schedule slot
  - issue entry type
  - remark
- Handle submit success and conflict errors clearly.

5. My appointments
- Render status grouping based on the shared appointment enum.
- Show pending, confirmed, completed, cancelled, and no-show states clearly.

## P1: Second delivery slice

1. Appointment cancellation
- Add a cancel action for student-owned appointments.
- Respect the cancellation deadline rule once the backend exposes it.

2. Agreement and service-boundary pages
- Add visible entry points for:
  - privacy policy
  - user agreement
  - informed consent
  - service boundary explanation

3. Emergency page polish
- Bind emergency contact content fully to config.
- Add call-friendly affordances and stronger visual priority.

## Backend dependencies to queue

- `POST /agreements/accept`
- student-visible appointment cancellation endpoint
- counselor detail endpoint with schedule display suitable for miniapp booking
- authenticated student bootstrap/profile endpoint

## Recommended branch split

- `backend-student-booking-support`
  - student-facing auth/bootstrap endpoints
  - appointment create/cancel support
  - agreement endpoints
- `student-miniapp-booking-mvp`
  - page wiring
  - booking form
  - my appointments status display
  - agreement flow

## Ready-to-start order

1. Finalize the branch split.
2. Add missing student-facing backend endpoints.
3. Wire the miniapp API client.
4. Implement booking submission UI.
5. Implement my appointments and cancellation.
6. Run manual student-side booking verification.

# TeamSync API reference

Base URL: `http://localhost:3001` in dev, your Render origin in production.

All endpoints return JSON. Errors use the shape `{ "message": string }` with an
appropriate HTTP status. Sensitive routes require a session; send either the
`teamsync_session` httpOnly cookie or `Authorization: Bearer <token>`.

## Auth

| Method | Path | Body | Auth | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` | — | `{ user, token }` + session cookie |
| POST | `/api/auth/register` | `{ name, email, password }` | — | `201 { user, token }` |
| POST | `/api/auth/logout` | — | — | `{ ok: true }`, clears cookie |
| GET | `/api/auth/me` | — | Bearer/cookie | `{ user }` (or `?userId=` fallback) |
| POST | `/api/auth/forgot-password` | `{ email }` | — | `{ ok: true }` always; emails a hashed reset link (rate-limited 3/min/recipient) |
| POST | `/api/auth/reset-password` | `{ token, password }` | — | `{ ok: true }`; invalidates old sessions |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` | required | `{ ok: true }`; re-issues token |
| POST | `/api/auth/accept-invite` | `{ token, password, name }` | — | `201 { user, token }` |

## Workspace & members

| Method | Path | Auth | Permission | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/workspace` | — | — | workspace info incl. `seats` |
| PATCH | `/api/workspace` | required | `manageWorkspace` | partial update |
| GET | `/api/users` | — | — | all members (sanitized) |
| GET | `/api/users/:id` | — | — | one member |
| POST | `/api/users` | required | `inviteMembers` | `{ name, email, role, teamIds }` — creates pending member + emails invite |
| PATCH | `/api/users/:id` | required | self or `editRoles` for role | update member |
| DELETE | `/api/users/:id` | required | `manageMembers` | owner role is protected |

## Teams

| Method | Path | Auth | Permission |
| --- | --- | --- | --- |
| GET | `/api/teams` | — | — |
| GET | `/api/teams/:id` | — | — |
| POST | `/api/teams` | required | `createTeam` |
| PATCH | `/api/teams/:id` | required | `manageWorkspace` |
| DELETE | `/api/teams/:id` | required | `deleteTeam` |
| PATCH | `/api/teams/:teamId/members` | required | `manageMembers` |
| DELETE | `/api/teams/:teamId/members/:memberId` | required | `manageMembers` |

## Tasks

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/tasks` | list; `?assigneeId=&status=&teamId=` filters |
| GET | `/api/tasks/:id` | single task |
| POST | `/api/tasks` | `{ title, ... }` |
| PATCH | `/api/tasks/:id` | partial update |
| PATCH | `/api/tasks/:id/move` | board column move |
| DELETE | `/api/tasks/:id` | delete |

## Chat

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/chat/rooms` | all rooms |
| GET | `/api/chat/rooms/:roomId/messages` | messages in a room |
| POST | `/api/chat/rooms/:roomId/messages` | `{ text, ... }` |
| POST | `/api/chat/rooms/dm` | create/return DM room for `{ memberId }` |

## Meetings & events

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/meetings` | all meetings |
| POST | `/api/meetings` | `{ title, startTime, ... }` |
| PATCH | `/api/meetings/:id` | update |
| DELETE | `/api/meetings/:id` | delete |
| PATCH | `/api/meetings/:id/join` | mark attendee joined |
| GET | `/api/events` | calendar events |
| POST | `/api/events` | create event |
| PATCH | `/api/events/:id` | update |
| DELETE | `/api/events/:id` | delete |

## Files, notifications, activity, search

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/files` | all files |
| POST | `/api/files` | `{ name, size, ... }` |
| PATCH | `/api/files/:id` | update |
| DELETE | `/api/files/:id` | delete |
| GET | `/api/notifications` | current user's notifications |
| PATCH | `/api/notifications/mark-all-read` | mark all read |
| PATCH | `/api/notifications/:id/read` | mark one read |
| DELETE | `/api/notifications/read` | clear read notifications |
| GET | `/api/activities` | activity feed |
| GET | `/api/search` | `?q=` full-text search across tasks/teams/files/etc. |

## Admin (requires `manageMembers` permission)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/overview` | usage metrics, role/status counts, recent activity |
| GET | `/api/admin/users` | all members (sanitized) |
| GET | `/api/admin/activity` | `?actorId=&action=&limit=` filtered activity log |

## Health

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | `{ ok: true, service: "teamsync-api" }` — used by deploy checks |
| GET | `/api/ready` | `{ ok: true, ready: true, persist: boolean }` — readiness for load balancers |

## RBAC summary

Permissions are defined in `src/constants/roles.js` and enforced by
`requirePermission` (`server/auth.js`). Roles: `owner` → `admin` → `member`
→ `guest`. Role changes require `editRoles`; the owner role is immutable.

## Logging & observability

Every request logs one structured JSON line (method, path, status, latency,
redacted body). Set `LOG_LEVEL=debug|info|warn|error`. Optionally POST fatal
errors to `ERROR_REPORTING_URL`. See `server/logger.js`.

## Testing

- Unit/integration (API + store): `npm run test:server`
- Browser E2E (login, register, RBAC, admin, forgot-password): `npm run test:e2e`
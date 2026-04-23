import type { UserRole } from "./types";

export const permissionMatrix = {
  student: [
    "appointment:create",
    "appointment:cancel:self",
    "appointment:read:self",
    "emergency:read"
  ],
  counselor: [
    "appointment:read:assigned",
    "appointment:update:assigned",
    "schedule:write:self",
    "session-record:write:assigned",
    "risk:update:assigned"
  ],
  admin: [
    "appointment:read:any",
    "counselor:write:any",
    "config:write:any",
    "risk:read:any",
    "statistics:read:any",
    "audit-log:read:any",
    "identity:read:authorized"
  ]
} as const satisfies Record<UserRole, string[]>;


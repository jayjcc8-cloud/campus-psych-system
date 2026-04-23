import type { UserRole } from "./types";

export interface AuditLog {
  id: string;
  operatorId: string;
  operatorRole: UserRole;
  actionType: string;
  targetType: string;
  targetId: string;
  detail?: string;
  createdAt: string;
}

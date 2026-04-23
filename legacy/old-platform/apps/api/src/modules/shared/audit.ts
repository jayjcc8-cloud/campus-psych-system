import type { RequestActor } from "../../lib/actor";
import { createId, nowIso } from "../../lib/utils";
import { insertAuditLog } from "../../repositories/audit-logs-repository";

export function appendAuditLog(
  actor: RequestActor,
  actionType: string,
  targetType: string,
  targetId: string,
  detail?: string
) {
  insertAuditLog({
    id: createId("audit"),
    operatorId: actor.operatorId,
    operatorRole: actor.operatorRole,
    actionType,
    targetType,
    targetId,
    detail,
    createdAt: nowIso()
  });
}

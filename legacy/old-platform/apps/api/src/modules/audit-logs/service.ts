import { listAuditLogs as listAuditLogsFromRepository } from "../../repositories/audit-logs-repository";

export function listAuditLogs() {
  return listAuditLogsFromRepository();
}

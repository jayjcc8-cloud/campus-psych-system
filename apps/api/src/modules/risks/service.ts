import type { Appointment, RiskFlag, RiskLevel, RiskProcessStatus } from "@campus-psych/domain";
import { requiresAdminAttention, riskEscalationTargets } from "@campus-psych/domain";
import type { RequestActor } from "../../lib/actor";
import { runInTransaction } from "../../db/client";
import { createId, nowIso } from "../../lib/utils";
import {
  insertRiskFlag,
  listRiskFlagsRaw,
  updateRiskFlagById
} from "../../repositories/risks-repository";
import { appendAuditLog } from "../shared/audit";

interface CreateRiskInput {
  appointment: Appointment;
  level: RiskLevel;
  triggerReason: string;
  actor: RequestActor;
}

interface UpdateRiskInput {
  id: string;
  status?: RiskProcessStatus;
  assignedTo?: string;
  nextFollowUpAt?: string;
  actor: RequestActor;
}

export function listRiskFlags() {
  return listRiskFlagsRaw().map((risk) => ({
    ...risk,
    requiresAdminAttention: requiresAdminAttention(risk.level)
  }));
}

export function createRiskFlag(input: CreateRiskInput): RiskFlag {
  const timestamp = nowIso();
  const risk: RiskFlag = {
    id: createId("risk"),
    studentId: input.appointment.studentId,
    appointmentId: input.appointment.id,
    triggerReason: input.triggerReason,
    level: input.level,
    status: riskEscalationTargets[input.level],
    assignedTo: input.level === "high" ? "admin-triage" : input.appointment.counselorId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  insertRiskFlag(risk);
  appendAuditLog(input.actor, "risk.create", "risk_flag", risk.id, `Created ${risk.level} risk flag.`);

  return risk;
}

export function updateRiskFlag(input: UpdateRiskInput) {
  const risk = runInTransaction(() => {
    const updatedRisk = updateRiskFlagById(input.id, {
      status: input.status,
      assignedTo: input.assignedTo,
      nextFollowUpAt: input.nextFollowUpAt,
      updatedAt: nowIso()
    });

    if (!updatedRisk) {
      return null;
    }

    appendAuditLog(input.actor, "risk.update", "risk_flag", input.id, "Updated risk handling metadata.");

    return updatedRisk;
  });

  if (!risk) {
    return null;
  }

  return {
    ...risk,
    requiresAdminAttention: requiresAdminAttention(risk.level)
  };
}

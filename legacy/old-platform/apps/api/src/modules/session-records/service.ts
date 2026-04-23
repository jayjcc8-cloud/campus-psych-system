import type { EmotionLevel, IssueType, RiskLevel, SessionRecord } from "@campus-psych/domain";
import type { RequestActor } from "../../lib/actor";
import { runInTransaction } from "../../db/client";
import { createId, nowIso } from "../../lib/utils";
import { findAppointmentById } from "../../repositories/appointments-repository";
import {
  insertSessionRecord,
  listSessionRecords as listSessionRecordsFromRepository
} from "../../repositories/session-records-repository";
import { createRiskFlag } from "../risks/service";
import { appendAuditLog } from "../shared/audit";

interface CreateSessionRecordInput {
  appointmentId: string;
  issueType: IssueType;
  emotionLevel: EmotionLevel;
  riskLevel: RiskLevel;
  needFollowUp: boolean;
  summaryNote: string;
  privateNote?: string;
}

export function listSessionRecords() {
  return listSessionRecordsFromRepository();
}

export function createSessionRecord(input: CreateSessionRecordInput, actor: RequestActor): SessionRecord {
  const appointment = findAppointmentById(input.appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found for session record.");
  }

  const timestamp = nowIso();
  const record: SessionRecord = {
    id: createId("record"),
    appointmentId: input.appointmentId,
    issueType: input.issueType,
    emotionLevel: input.emotionLevel,
    riskLevel: input.riskLevel,
    needFollowUp: input.needFollowUp,
    summaryNote: input.summaryNote,
    privateNote: input.privateNote,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  runInTransaction(() => {
    insertSessionRecord(record);
    appendAuditLog(actor, "session-record.create", "session_record", record.id, "Created structured session note.");

    if (input.riskLevel !== "low" || input.needFollowUp) {
      createRiskFlag({
        appointment,
        level: input.riskLevel,
        triggerReason: "Created from structured session record.",
        actor
      });
    }
  });

  return record;
}

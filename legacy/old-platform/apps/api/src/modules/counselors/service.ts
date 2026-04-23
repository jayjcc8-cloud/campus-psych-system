import {
  getCounselorDetailByUserId,
  getCounselorDetail as getCounselorDetailFromRepository,
  getCounselorIdByUserId,
  insertCounselorSchedule,
  listCounselors as listCounselorsFromRepository,
  refreshCounselorNextAvailableSlot,
  updateCounselorProfile,
  updateCounselorSchedule
} from "../../repositories/reference-repository";
import { hasActiveAppointmentForSchedule } from "../../repositories/appointments-repository";
import { runInTransaction } from "../../db/client";
import type { RequestActor } from "../../lib/actor";
import { createId } from "../../lib/utils";
import { appendAuditLog } from "../shared/audit";

export function listCounselors() {
  return listCounselorsFromRepository();
}

export function getCounselorDetail(id: string) {
  return getCounselorDetailFromRepository(id);
}

export function getMyCounselorWorkspace(actor: RequestActor) {
  return getCounselorDetailByUserId(actor.operatorId);
}

export function updateMyCounselorProfile(
  actor: RequestActor,
  payload: { intro: string; specialty: string[] }
) {
  const counselorId = getCounselorIdByUserId(actor.operatorId);

  if (!counselorId) {
    return null;
  }

  return runInTransaction(() => {
    const counselor = updateCounselorProfile(counselorId, payload);
    appendAuditLog(
      actor,
      "counselor.profile.update",
      "counselor",
      counselorId,
      "Counselor updated miniapp display profile."
    );
    return counselor;
  });
}

export function createMyCounselorSchedule(
  actor: RequestActor,
  payload: { startTime: string; endTime: string; capacity?: number; available?: boolean }
) {
  const counselorId = getCounselorIdByUserId(actor.operatorId);

  if (!counselorId) {
    return null;
  }

  assertValidScheduleWindow(payload.startTime, payload.endTime);
  const startTime = normalizeScheduleTime(payload.startTime);
  const endTime = normalizeScheduleTime(payload.endTime);

  return runInTransaction(() => {
    const schedule = insertCounselorSchedule({
      id: createId("slot"),
      counselorId,
      startTime,
      endTime,
      capacity: payload.capacity ?? 1,
      available: payload.available ?? true
    });

    refreshCounselorNextAvailableSlot(counselorId);
    appendAuditLog(
      actor,
      "counselor.schedule.create",
      "counselor_schedule",
      schedule?.id ?? counselorId,
      "Counselor created schedule slot from miniapp."
    );

    return schedule;
  });
}

export function updateMyCounselorSchedule(
  actor: RequestActor,
  slotId: string,
  payload: Partial<{ startTime: string; endTime: string; capacity: number; available: boolean }>
) {
  const counselorId = getCounselorIdByUserId(actor.operatorId);

  if (!counselorId) {
    return null;
  }

  if ((payload.startTime || payload.endTime) && hasActiveAppointmentForSchedule(slotId)) {
    throw new Error("Cannot change time for a slot with active appointments.");
  }

  return runInTransaction(() => {
    const schedule = updateCounselorSchedule(slotId, counselorId, {
      ...payload,
      startTime: payload.startTime ? normalizeScheduleTime(payload.startTime) : undefined,
      endTime: payload.endTime ? normalizeScheduleTime(payload.endTime) : undefined
    });

    if (!schedule) {
      return null;
    }

    assertValidScheduleWindow(schedule.startTime, schedule.endTime);
    refreshCounselorNextAvailableSlot(counselorId);
    appendAuditLog(
      actor,
      "counselor.schedule.update",
      "counselor_schedule",
      slotId,
      "Counselor updated schedule slot from miniapp."
    );

    return schedule;
  });
}

function assertValidScheduleWindow(startTime: string, endTime: string) {
  const start = new Date(normalizeScheduleTime(startTime));
  const end = new Date(normalizeScheduleTime(endTime));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Schedule time is invalid.");
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error("Schedule end time must be later than start time.");
  }
}

function normalizeScheduleTime(value: string) {
  const normalizedValue = value.trim();
  const date = new Date(normalizedValue.includes("T") ? normalizedValue : normalizedValue.replace(" ", "T"));

  return Number.isNaN(date.getTime()) ? normalizedValue : date.toISOString();
}

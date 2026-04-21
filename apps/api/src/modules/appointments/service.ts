import type { Appointment, AppointmentStatus, IssueType } from "@campus-psych/domain";
import { canTransitionAppointment } from "@campus-psych/domain";
import type { RequestActor } from "../../lib/actor";
import { runInTransaction } from "../../db/client";
import { createId, nowIso } from "../../lib/utils";
import {
  cancelAppointmentById,
  countActiveAppointmentsForStudent,
  findAppointmentById,
  getAppointmentSummary,
  hasActiveAppointmentInSlot,
  insertAppointment,
  listAppointments as listAppointmentsFromRepository,
  listAppointmentsByCounselor,
  listAppointmentsByStudent,
  updateAppointmentStatusById
} from "../../repositories/appointments-repository";
import {
  findScheduleSlotById,
  getCounselorIdByUserId,
  getCurrentStudentProfile,
  refreshCounselorNextAvailableSlot
} from "../../repositories/reference-repository";
import { countActiveRiskFlags } from "../../repositories/risks-repository";
import { appendAuditLog } from "../shared/audit";

interface CreateAppointmentInput {
  counselorId: string;
  scheduleSlotId: string;
  issueEntryType: IssueType;
  remark?: string;
}

interface UpdateAppointmentStatusInput {
  id: string;
  nextStatus: AppointmentStatus;
  actor: RequestActor;
}

interface CancelMyAppointmentInput {
  id: string;
  actor: RequestActor;
  cancelReason?: string;
}

export function listAppointments() {
  return listAppointmentsFromRepository();
}

export function listAppointmentsForActor(actor: RequestActor) {
  if (actor.operatorRole === "admin") {
    return listAppointmentsFromRepository();
  }

  if (actor.operatorRole === "counselor") {
    const counselorId = getCounselorIdByUserId(actor.operatorId);
    return counselorId ? listAppointmentsByCounselor(counselorId) : [];
  }

  return [];
}

export function listMyAppointments(studentId = getCurrentStudentProfile().id) {
  return listAppointmentsByStudent(studentId);
}

export function summarizeAppointments() {
  const summary = getAppointmentSummary();

  return {
    ...summary,
    flagged: countActiveRiskFlags()
  };
}

export function createAppointment(input: CreateAppointmentInput, actor: RequestActor): Appointment {
  const student = getCurrentStudentProfile(actor.operatorId);
  const timestamp = nowIso();
  const appointment: Appointment = {
    id: createId("appt"),
    studentId: student.id,
    counselorId: input.counselorId,
    scheduleSlotId: input.scheduleSlotId,
    issueEntryType: input.issueEntryType,
    consultMode: "offline",
    status: "pending",
    remark: input.remark,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  runInTransaction(() => {
    const scheduleSlot = findScheduleSlotById(input.scheduleSlotId);

    if (!scheduleSlot || !scheduleSlot.available) {
      throw new Error("Selected schedule slot is unavailable.");
    }

    if (scheduleSlot.counselorId !== input.counselorId) {
      throw new Error("Schedule slot does not belong to the selected counselor.");
    }

    if (hasActiveAppointmentInSlot(input.scheduleSlotId)) {
      throw new Error("Selected schedule slot has already been booked.");
    }

    if (countActiveAppointmentsForStudent(student.id) >= 2) {
      throw new Error("Student has reached the active booking limit.");
    }

    insertAppointment(appointment);
    refreshCounselorNextAvailableSlot(appointment.counselorId);
    appendAuditLog(actor, "appointment.create", "appointment", appointment.id, "Created pending booking.");
  });

  return appointment;
}

export function updateAppointmentStatus({
  id,
  nextStatus,
  actor
}: UpdateAppointmentStatusInput): Appointment | null {
  const appointment = findAppointmentById(id);

  if (!appointment) {
    return null;
  }

  if (!canTransitionAppointment(appointment.status, nextStatus)) {
    throw new Error(`Cannot move appointment from ${appointment.status} to ${nextStatus}.`);
  }

  if (actor.operatorRole === "counselor") {
    const actorCounselorId = getCounselorIdByUserId(actor.operatorId);

    if (!actorCounselorId || actorCounselorId !== appointment.counselorId) {
      throw new Error("Counselor cannot update another counselor's appointment.");
    }
  }

  const updatedAt = nowIso();

  runInTransaction(() => {
    updateAppointmentStatusById(id, nextStatus, updatedAt);
    refreshCounselorNextAvailableSlot(appointment.counselorId);
    appendAuditLog(
      actor,
      "appointment.status.update",
      "appointment",
      appointment.id,
      `Moved appointment to ${nextStatus}.`
    );
  });

  return {
    ...appointment,
    status: nextStatus,
    updatedAt
  };
}

export function cancelMyAppointment({
  id,
  actor,
  cancelReason
}: CancelMyAppointmentInput): Appointment | null {
  const appointment = findAppointmentById(id);

  if (!appointment) {
    return null;
  }

  const currentStudentId = getCurrentStudentProfile(actor.operatorId).id;

  if (appointment.studentId !== currentStudentId) {
    throw new Error("Student cannot cancel another student's appointment.");
  }

  if (!canTransitionAppointment(appointment.status, "cancelled")) {
    throw new Error("Only pending or confirmed appointments can be cancelled.");
  }

  const updatedAt = nowIso();
  const normalizedReason = cancelReason?.trim() || "学生在小程序中主动取消预约。";

  runInTransaction(() => {
    cancelAppointmentById(id, updatedAt, normalizedReason);
    refreshCounselorNextAvailableSlot(appointment.counselorId);
    appendAuditLog(
      actor,
      "appointment.cancel",
      "appointment",
      appointment.id,
      "Student cancelled booking from miniapp."
    );
  });

  return {
    ...appointment,
    status: "cancelled",
    cancelReason: normalizedReason,
    updatedAt
  };
}

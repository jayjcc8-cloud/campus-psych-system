import type { AppointmentStatus } from "../common/types";

export const appointmentTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled", "expired"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
  expired: []
};

export function canTransitionAppointment(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): boolean {
  return appointmentTransitions[currentStatus].includes(nextStatus);
}


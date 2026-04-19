import {
  getAppointmentSummary,
  listAppointments
} from "../../repositories/appointments-repository";
import { getScheduleSlotStartTime } from "../../repositories/reference-repository";
import { countActiveRiskFlags } from "../../repositories/risks-repository";

export function getOverviewMetrics() {
  const appointments = listAppointments();
  const summary = getAppointmentSummary();
  const activeRiskFlags = countActiveRiskFlags();
  const totalLeadTime = appointments.reduce((accumulator, appointment) => {
    const startTime = getScheduleSlotStartTime(appointment.scheduleSlotId);

    if (!startTime) {
      return accumulator;
    }

    const leadTime = new Date(startTime).getTime() - new Date(appointment.createdAt).getTime();
    return accumulator + Math.max(leadTime / (1000 * 60 * 60), 0);
  }, 0);

  return {
    appointmentsThisMonth: summary.total,
    completedSessionsThisMonth: summary.completed,
    activeRiskFlags,
    averageLeadTimeHours:
      appointments.length > 0 ? Math.round((totalLeadTime / appointments.length) * 10) / 10 : 0
  };
}

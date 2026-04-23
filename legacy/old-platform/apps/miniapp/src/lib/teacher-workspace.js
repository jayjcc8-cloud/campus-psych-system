export const teacherIssueOptions = [
  "academic_pressure",
  "sleep",
  "relationship",
  "emotion",
  "career",
  "other"
];

export const teacherActiveStatuses = new Set(["pending", "confirmed"]);

export function getTeacherAppointmentActions(status) {
  if (status === "pending") {
    return [
      { label: "确认预约", nextStatus: "confirmed", variant: "primary" },
      { label: "取消预约", nextStatus: "cancelled", variant: "ghost" }
    ];
  }

  if (status === "confirmed") {
    return [
      { label: "标记完成", nextStatus: "completed", variant: "primary" },
      { label: "取消预约", nextStatus: "cancelled", variant: "ghost" }
    ];
  }

  return [];
}

export function formatTeacherTimeInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function normalizeTeacherTime(value) {
  const normalized = value.trim().replace(" ", "T");

  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value.trim();
  }

  return date.toISOString();
}

export function formatTeacherStudentLine(appointment) {
  const name = appointment.studentMaskedDisplayName || appointment.studentDisplayName || "学生";
  const college = appointment.studentCollege || "学院未填写";
  const schoolId = appointment.studentSchoolId ? `学号 ${appointment.studentSchoolId}` : "学号未填写";

  return `${name} / ${college} / ${schoolId}`;
}

export function pickCurrentTeacherAppointment(appointments) {
  return (
    appointments
      .filter((appointment) => teacherActiveStatuses.has(appointment.status))
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "pending" ? -1 : 1;
        }

        return new Date(left.scheduleStartTime || left.createdAt).getTime() -
          new Date(right.scheduleStartTime || right.createdAt).getTime();
      })[0] ?? null
  );
}

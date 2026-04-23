const issueLabelMap = {
  academic_pressure: "学业压力",
  sleep: "睡眠困扰",
  relationship: "关系困扰",
  emotion: "情绪波动",
  career: "发展方向",
  other: "其他"
};

const counselorAliasMap = {
  Lin: "林老师",
  Chen: "陈老师"
};

const statusHintMap = {
  pending: "已提交，等待咨询师确认。",
  confirmed: "预约已确认，请按时到场。",
  completed: "这次支持已完成，愿你被稳稳接住。",
  cancelled: "预约已取消，如需要可重新预约。",
  no_show: "本次记录为未到场，如有需要可再次预约。",
  expired: "预约已过期，请重新选择时间。"
};

const statusLabelMap = {
  pending: "待确认",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到场",
  expired: "已过期"
};

const consultModeLabelMap = {
  offline: "线下面谈",
  online: "线上沟通"
};

export function formatIssueType(issueType) {
  return issueLabelMap[issueType] ?? issueType;
}

export function formatAppointmentHint(status) {
  return statusHintMap[status] ?? "请留意当前预约状态变化。";
}

export function formatAppointmentStatus(status) {
  return statusLabelMap[status] ?? status;
}

export function formatDateTime(isoString) {
  if (!isoString) {
    return "待确认";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}-${day} ${hours}:${minutes}`;
}

function normalizeCounselorName(name) {
  if (!name) {
    return "咨询老师";
  }

  if (counselorAliasMap[name]) {
    return counselorAliasMap[name];
  }

  if (name.endsWith("老师")) {
    return name;
  }

  return `${name}老师`;
}

export function formatCounselorName(counselorId, counselors = []) {
  const counselor =
    counselors.find((item) => item.id === counselorId) ??
    counselors.find((item) => item.displayName === counselorId);

  return normalizeCounselorName(counselor?.displayName ?? counselorId);
}

export function formatCounselorDisplayName(displayName) {
  return normalizeCounselorName(displayName);
}

export function formatCounselorSummary(counselor) {
  if (!counselor) {
    return "提供温和、克制的校园心理支持。";
  }

  const normalizedIntro = counselor.intro?.trim();

  if (normalizedIntro && /[\u4e00-\u9fa5]/.test(normalizedIntro)) {
    return normalizedIntro;
  }

  if (counselor.specialty?.length) {
    const specialties = counselor.specialty.slice(0, 2).map(formatIssueType).join("、");
    return `更擅长陪你梳理${specialties}相关困扰，适合从当前最想聊的主题开始。`;
  }

  return "提供温和、克制的校园心理支持。";
}

export function formatAvailabilityStatus(nextAvailableSlot) {
  return nextAvailableSlot ? "可预约" : "排班更新中";
}

export function formatAvailabilityHint(nextAvailableSlot) {
  return nextAvailableSlot ? `下一个可约时间 ${formatDateTime(nextAvailableSlot)}` : "近期暂无开放时段";
}

export function formatConsultMode(consultMode) {
  return consultModeLabelMap[consultMode] ?? "校园支持";
}

export function formatOptionalText(value, fallback = "未填写") {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || fallback;
}

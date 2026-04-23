export const counselorsFixture = [
  {
    id: "counselor-001",
    displayName: "Lin",
    specialty: ["academic_pressure", "relationship"],
    intro: "Focuses on transition stress and relationship-related support.",
    gender: "female",
    nextAvailableSlot: "2026-04-22T09:00:00+08:00"
  },
  {
    id: "counselor-002",
    displayName: "Chen",
    specialty: ["sleep", "emotion"],
    intro: "Supports students navigating burnout, sleep, and emotional regulation.",
    gender: "male",
    nextAvailableSlot: "2026-04-23T14:00:00+08:00"
  }
];

export const scheduleFixture = [
  {
    id: "slot-001",
    counselorId: "counselor-001",
    startTime: "2026-04-22T09:00:00+08:00",
    endTime: "2026-04-22T10:00:00+08:00",
    capacity: 1,
    available: true
  },
  {
    id: "slot-002",
    counselorId: "counselor-002",
    startTime: "2026-04-23T14:00:00+08:00",
    endTime: "2026-04-23T15:00:00+08:00",
    capacity: 1,
    available: true
  }
];

export const appointmentsFixture = [
  {
    id: "appt-001",
    studentId: "student-001",
    counselorId: "counselor-001",
    scheduleSlotId: "slot-001",
    issueEntryType: "academic_pressure",
    consultMode: "offline",
    status: "pending",
    remark: "最近论文压力较大，希望获得支持。",
    createdAt: "2026-04-20T09:30:00+08:00",
    updatedAt: "2026-04-20T09:30:00+08:00"
  }
];

export const publicConfigFixture = {
  announcement: "工作日线下心理支持预约已开放，可按需选择咨询老师和可约时段。",
  bookingPolicy: "每位学生最多保留 2 个进行中的预约；如无法参加，请提前取消。",
  emergencyContacts: [
    { label: "校心理支持中心", phone: "021-55551234" },
    { label: "校医院值班电话", phone: "021-55555678" }
  ],
  forceStudentIdBinding: false
};

export const studentProfileFixture = {
  id: "student-001",
  role: "student",
  displayName: "",
  maskedDisplayName: "未注册同学",
  schoolId: "",
  college: "",
  visibilityLevel: "masked"
};

export const studentBootstrapFixture = {
  profile: studentProfileFixture,
  publicConfig: publicConfigFixture,
  requirements: {
    privacyNoticeRequired: true,
    userAgreementRequired: true,
    informedConsentRequired: true,
    studentIdBindingRequired: false
  }
};

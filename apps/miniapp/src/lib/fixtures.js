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
    remark: "Need support around thesis stress.",
    createdAt: "2026-04-20T09:30:00+08:00",
    updatedAt: "2026-04-20T09:30:00+08:00"
  }
];

export const publicConfigFixture = {
  announcement: "Trial service is open for weekday offline counseling bookings.",
  bookingPolicy: "Students may keep up to two active bookings at a time.",
  emergencyContacts: [
    { label: "Campus Counseling Center", phone: "021-55551234" },
    { label: "Campus Hospital", phone: "021-55555678" }
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

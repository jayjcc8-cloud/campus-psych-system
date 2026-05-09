import { z } from "zod";

export const supportIssueTypes = [
  "work_pressure",
  "family_relationship",
  "sleep_and_emotion",
  "career_transition",
  "interpersonal",
  "other"
] as const;

export const supportRequestStatuses = ["new", "viewed", "noted", "closed", "withdrawn", "spam"] as const;

export const abuseStatuses = ["clean", "limited", "spam"] as const;
export const assessmentRiskLevels = ["low", "medium", "high"] as const;
export const assessmentScaleIds = ["who5", "phq9", "gad7"] as const;
export const supportSlotModes = ["offline", "online", "hybrid"] as const;

export type SupportIssueType = (typeof supportIssueTypes)[number];
export type SupportRequestStatus = (typeof supportRequestStatuses)[number];
export type AbuseStatus = (typeof abuseStatuses)[number];
export type AssessmentRiskLevel = (typeof assessmentRiskLevels)[number];
export type AssessmentScaleId = (typeof assessmentScaleIds)[number];
export type SupportSlotMode = (typeof supportSlotModes)[number];

export const issueTypeLabels: Record<SupportIssueType, string> = {
  work_pressure: "工作压力",
  family_relationship: "家庭与关系",
  sleep_and_emotion: "睡眠与情绪",
  career_transition: "职业阶段变化",
  interpersonal: "人际困扰",
  other: "其他"
};

export const requestStatusLabels: Record<SupportRequestStatus, string> = {
  new: "待确认",
  viewed: "待确认",
  noted: "已确认",
  closed: "已完成",
  withdrawn: "已撤回",
  spam: "已标记垃圾"
};

export const assessmentRiskLabels: Record<AssessmentRiskLevel, string> = {
  low: "暂未提示明显风险",
  medium: "建议留意近期状态",
  high: "建议尽快获得支持"
};

export const assessmentScaleLabels: Record<AssessmentScaleId, string> = {
  who5: "整体幸福感",
  phq9: "抑郁相关困扰",
  gad7: "焦虑相关困扰"
};

export const supportSlotModeLabels: Record<SupportSlotMode, string> = {
  offline: "线下咨询",
  online: "线上咨询",
  hybrid: "线上/线下"
};

export const assessmentCatalogVersion = "open_source_v1";
export const assessmentSourceProfile = "WHO-5 + PHQ-9 + GAD-7 public screening v1";

export interface AssessmentQuestion {
  id: string;
  scale: AssessmentScaleId;
  text: string;
  options: Array<{ label: string; value: number }>;
}

export interface AssessmentScaleBand {
  key: string;
  label: string;
  min: number;
  max: number;
  interpretation: string;
  recommendation: string;
}

export interface AssessmentScaleDefinition {
  id: AssessmentScaleId;
  label: string;
  sourceName: string;
  sourceUrl: string;
  scoreDirection: "higher_better" | "higher_worse";
  rawScoreRange: [number, number];
  normalizedScoreRange: [number, number];
  bands: AssessmentScaleBand[];
}

export interface AssessmentScaleScore {
  scale: AssessmentScaleId;
  label: string;
  rawScore: number;
  normalizedScore: number;
  maxScore: number;
  bandKey: string;
  bandLabel: string;
  interpretation: string;
  recommendation: string;
}

const frequencyOptions = [
  { label: "完全没有", value: 0 },
  { label: "有几天", value: 1 },
  { label: "一半以上时间", value: 2 },
  { label: "几乎每天", value: 3 }
];

const wellbeingOptions = [
  { label: "从未如此", value: 0 },
  { label: "偶尔如此", value: 1 },
  { label: "少于一半时间", value: 2 },
  { label: "超过一半时间", value: 3 },
  { label: "大部分时间", value: 4 },
  { label: "一直如此", value: 5 }
];

export const assessmentQuestions: AssessmentQuestion[] = [
  { id: "who5_1", scale: "who5", text: "最近两周，我感到心情比较愉快、放松。", options: wellbeingOptions },
  { id: "who5_2", scale: "who5", text: "最近两周，我觉得精力和状态还不错。", options: wellbeingOptions },
  { id: "who5_3", scale: "who5", text: "最近两周，我醒来后感觉比较有恢复感。", options: wellbeingOptions },
  { id: "who5_4", scale: "who5", text: "最近两周，我的日常生活中有让我感兴趣的事情。", options: wellbeingOptions },
  { id: "who5_5", scale: "who5", text: "最近两周，我整体上觉得生活是有内容的。", options: wellbeingOptions },
  { id: "phq9_1", scale: "phq9", text: "最近两周，对做事的兴趣或乐趣减少。", options: frequencyOptions },
  { id: "phq9_2", scale: "phq9", text: "最近两周，情绪低落、沮丧或提不起劲。", options: frequencyOptions },
  { id: "phq9_3", scale: "phq9", text: "最近两周，睡眠状态不理想。", options: frequencyOptions },
  { id: "phq9_4", scale: "phq9", text: "最近两周，感到疲惫或精力不足。", options: frequencyOptions },
  { id: "phq9_5", scale: "phq9", text: "最近两周，食欲或饮食状态有明显变化。", options: frequencyOptions },
  { id: "phq9_6", scale: "phq9", text: "最近两周，对自己有较多负面评价。", options: frequencyOptions },
  { id: "phq9_7", scale: "phq9", text: "最近两周，注意力不容易集中。", options: frequencyOptions },
  {
    id: "phq9_8",
    scale: "phq9",
    text: "最近两周，行动或说话节奏明显变慢，或变得坐立不安。",
    options: frequencyOptions
  },
  { id: "phq9_9", scale: "phq9", text: "最近两周，出现过伤害自己的想法或觉得不如不在。", options: frequencyOptions },
  { id: "gad7_1", scale: "gad7", text: "最近两周，感到紧张、焦虑或放松不下来。", options: frequencyOptions },
  { id: "gad7_2", scale: "gad7", text: "最近两周，难以停止或控制担心。", options: frequencyOptions },
  { id: "gad7_3", scale: "gad7", text: "最近两周，对不同事情担心较多。", options: frequencyOptions },
  { id: "gad7_4", scale: "gad7", text: "最近两周，不太容易放松。", options: frequencyOptions },
  { id: "gad7_5", scale: "gad7", text: "最近两周，坐立不安或很难安静下来。", options: frequencyOptions },
  { id: "gad7_6", scale: "gad7", text: "最近两周，变得容易烦躁或急躁。", options: frequencyOptions },
  { id: "gad7_7", scale: "gad7", text: "最近两周，担心会发生不好的事情。", options: frequencyOptions }
];

export const assessmentScaleDefinitions: Record<AssessmentScaleId, AssessmentScaleDefinition> = {
  who5: {
    id: "who5",
    label: assessmentScaleLabels.who5,
    sourceName: "WHO-5 Well-Being Index",
    sourceUrl: "https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01",
    scoreDirection: "higher_better",
    rawScoreRange: [0, 25],
    normalizedScoreRange: [0, 100],
    bands: [
      {
        key: "very_low",
        label: "明显偏低",
        min: 0,
        max: 28,
        interpretation: "整体幸福感分数明显偏低，近期可能持续处在消耗或低恢复状态。",
        recommendation: "建议尽快安排一次支持，也可以把这份结果带给咨询师一起讨论。"
      },
      {
        key: "low",
        label: "偏低",
        min: 29,
        max: 50,
        interpretation: "整体幸福感低于常见关注阈值，值得继续观察近期状态。",
        recommendation: "建议主动给自己预留支持时间，并关注睡眠、精力和日常恢复。"
      },
      {
        key: "moderate",
        label: "中等",
        min: 51,
        max: 75,
        interpretation: "整体幸福感处于中等水平，暂未提示明显低幸福感。",
        recommendation: "可以继续保持已有支持资源，如仍感吃力，也可以预约一次谈谈。"
      },
      {
        key: "good",
        label: "较好",
        min: 76,
        max: 100,
        interpretation: "整体幸福感相对较好，近期恢复感和生活兴趣较稳定。",
        recommendation: "可以把这作为近期状态基线，后续需要时再进行复测。"
      }
    ]
  },
  phq9: {
    id: "phq9",
    label: assessmentScaleLabels.phq9,
    sourceName: "Patient Health Questionnaire-9",
    sourceUrl: "https://www.phqscreeners.com/",
    scoreDirection: "higher_worse",
    rawScoreRange: [0, 27],
    normalizedScoreRange: [0, 100],
    bands: [
      {
        key: "minimal",
        label: "最小",
        min: 0,
        max: 4,
        interpretation: "抑郁相关困扰总分较低。",
        recommendation: "若主观上仍感到困难，仍可以主动寻求支持。"
      },
      {
        key: "mild",
        label: "轻度",
        min: 5,
        max: 9,
        interpretation: "抑郁相关困扰已有轻度表现。",
        recommendation: "建议留意持续时间和对生活的影响，必要时预约支持。"
      },
      {
        key: "moderate",
        label: "中度",
        min: 10,
        max: 14,
        interpretation: "抑郁相关困扰达到需要关注的水平。",
        recommendation: "建议尽早和咨询师或专业人员讨论近期状态。"
      },
      {
        key: "moderately_severe",
        label: "中重度",
        min: 15,
        max: 19,
        interpretation: "抑郁相关困扰较明显，可能已经影响日常功能。",
        recommendation: "建议尽快获得专业支持，并减少独自承受。"
      },
      {
        key: "severe",
        label: "重度",
        min: 20,
        max: 27,
        interpretation: "抑郁相关困扰处于较高水平。",
        recommendation: "建议优先联系专业支持资源；如担心安全，请立即联系紧急支持。"
      }
    ]
  },
  gad7: {
    id: "gad7",
    label: assessmentScaleLabels.gad7,
    sourceName: "Generalized Anxiety Disorder-7",
    sourceUrl: "https://www.phqscreeners.com/",
    scoreDirection: "higher_worse",
    rawScoreRange: [0, 21],
    normalizedScoreRange: [0, 100],
    bands: [
      {
        key: "minimal",
        label: "最小",
        min: 0,
        max: 4,
        interpretation: "焦虑相关困扰总分较低。",
        recommendation: "可以继续观察自己的节奏和恢复感。"
      },
      {
        key: "mild",
        label: "轻度",
        min: 5,
        max: 9,
        interpretation: "焦虑相关困扰有轻度表现。",
        recommendation: "建议留意担心、紧张和睡眠是否持续影响日常。"
      },
      {
        key: "moderate",
        label: "中度",
        min: 10,
        max: 14,
        interpretation: "焦虑相关困扰达到需要关注的水平。",
        recommendation: "建议主动安排支持，帮助自己梳理压力来源和应对方式。"
      },
      {
        key: "severe",
        label: "重度",
        min: 15,
        max: 21,
        interpretation: "焦虑相关困扰处于较高水平，可能明显影响日常状态。",
        recommendation: "建议尽快获得专业支持，不必等到完全撑不住再求助。"
      }
    ]
  }
};

export const assessmentCatalog = {
  version: assessmentCatalogVersion,
  sourceProfile: assessmentSourceProfile,
  scales: assessmentScaleDefinitions,
  questions: assessmentQuestions
};

export interface SupportSlot {
  id: string;
  counselorId?: string;
  counselorName?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  mode: SupportSlotMode;
  location?: string;
  note?: string;
  remainingCapacity?: number;
  available: boolean;
  activeCount?: number;
  deletedAt?: string;
}

export interface CounselorProfile {
  id: string;
  displayName: string;
  title: string;
  intro: string;
  specialties: string[];
  status: "draft" | "pending_review" | "approved" | "suspended";
  nextAvailableTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  adminDisplayName?: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string;
  createdAt: string;
}

export interface AssessmentSummary {
  id: string;
  receiptCode?: string;
  preferredName?: string;
  scaleVersion: string;
  sourceProfile: string;
  scoreSummary: AssessmentScaleScore[];
  recommendations: string[];
  who5Score: number;
  phq9Score: number;
  gad7Score: number;
  wellbeingLevel: string;
  depressionLevel: string;
  anxietyLevel: string;
  riskLevel: AssessmentRiskLevel;
  safetyFlag: boolean;
  createdAt: string;
}

export interface AssessmentStats {
  totalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  riskDistribution: Record<AssessmentRiskLevel, number>;
  averageScores?: AssessmentScaleScore[];
  scaleVersion?: string;
  sourceProfile?: string;
  recent: AssessmentSummary[];
}

export interface SupportRequestSummary {
  id: string;
  receiptCode?: string;
  userId?: string;
  preferredName?: string;
  assessmentId?: string;
  assessmentRiskLevel?: AssessmentRiskLevel;
  assessmentScoreSummary?: AssessmentScaleScore[];
  assessmentScaleVersion?: string;
  assessmentSourceProfile?: string;
  counselorId?: string;
  counselorName?: string;
  slotId: string;
  slotStartTime?: string;
  slotEndTime?: string;
  mode?: SupportSlotMode;
  location?: string;
  note?: string;
  issueType: SupportIssueType;
  contactEmail?: string;
  contactNote?: string;
  remark?: string;
  status: SupportRequestStatus;
  abuseStatus: AbuseStatus;
  createdAt: string;
  updatedAt: string;
  withdrawnAt?: string;
}

export interface CounselorReviewSummary {
  id: string;
  accountId: string;
  displayName: string;
  title: string;
  intro: string;
  specialties: string[];
  status: "draft" | "pending_review" | "approved" | "suspended";
  accountStatus: "active" | "disabled";
  legalName?: string;
  staffId?: string;
  organization?: string;
  workEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardSummary {
  requestTotal: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  todayCount: number;
  highRiskCount: number;
  counselorCount: number;
  pendingCounselorReviewCount: number;
  slotUtilizationPercent: number;
  requestTrend: Array<{ date: string; count: number }>;
  counselorWorkload: Array<{ counselorId: string; counselorName: string; requestCount: number; pendingCount: number }>;
  riskDistribution: Record<AssessmentRiskLevel, number>;
  recentHighRisk: SupportRequestSummary[];
}

export const createSupportRequestSchema = z.object({
  counselorId: z.string().uuid(),
  slotId: z.string().min(1),
  issueType: z.enum(supportIssueTypes).optional(),
  preferredName: z.string().max(40).optional().or(z.literal("")),
  assessmentId: z.string().uuid().optional().or(z.literal("")),
  contactEmail: z.string().email().max(120).optional().or(z.literal("")),
  contactNote: z.string().max(160).optional().or(z.literal("")),
  remark: z.string().max(600).optional().or(z.literal(""))
});

export const createAssessmentSchema = z.object({
  preferredName: z.string().max(40).optional().or(z.literal("")),
  answers: z.record(z.string(), z.number().int().min(0).max(5))
});

const supportSlotBaseSchema = z.object({
  counselorId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().min(1).max(20),
  mode: z.enum(supportSlotModes).default("offline"),
  location: z.string().max(160).optional().or(z.literal("")),
  note: z.string().max(240).optional().or(z.literal("")),
  available: z.boolean().optional()
});

function requireLocationForInPersonSlot(value: { mode?: SupportSlotMode; location?: string }, ctx: z.RefinementCtx) {
  if ((value.mode === "offline" || value.mode === "hybrid") && !value.location?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["location"],
      message: "线下或混合预约需要填写地点"
    });
  }
}

export const createSupportSlotSchema = supportSlotBaseSchema.superRefine(requireLocationForInPersonSlot);

export const createCounselorSupportSlotSchema = supportSlotBaseSchema
  .omit({ counselorId: true })
  .superRefine(requireLocationForInPersonSlot);

export const updateSupportSlotSchema = supportSlotBaseSchema.partial();

export const updateCounselorSupportSlotSchema = supportSlotBaseSchema.omit({ counselorId: true }).partial();

export const counselorLoginSchema = z.object({
  email: z.string().min(2).max(120),
  password: z.string().min(8).max(128)
});

export const counselorRegisterSchema = z.object({
  password: z.string().min(8).max(128),
  legalName: z.string().min(2).max(40),
  staffId: z.string().min(3).max(64),
  organization: z.string().min(2).max(80),
  workEmail: z.string().email().max(120),
  displayName: z.string().min(2).max(40),
  title: z.string().min(2).max(40),
  intro: z.string().min(10).max(600),
  specialties: z.array(z.string().min(1).max(24)).max(8)
});

export const updateCounselorProfileSchema = z.object({
  title: z.string().min(2).max(40),
  intro: z.string().min(10).max(600),
  specialties: z.array(z.string().min(1).max(24)).max(8)
});

export const updateSupportRequestSchema = z.object({
  status: z.enum(["viewed", "noted", "closed", "spam"])
});

export const adminLoginSchema = z.object({
  email: z.string().min(2).max(120),
  password: z.string().min(8).max(128)
});

export const unifiedLoginSchema = z.object({
  identifier: z.string().min(2).max(120),
  password: z.string().min(8).max(128)
});

export const userRegisterSchema = z.object({
  email: z.string().email().max(120),
  preferredName: z.string().max(40).optional().or(z.literal("")),
  password: z.string().min(8).max(128)
});

export const userLoginSchema = z.object({
  email: z.string().min(2).max(120),
  password: z.string().min(8).max(128)
});

export const userRecoverySchema = z.object({
  privacyId: z.string().min(4).max(32),
  recoveryPhrase: z.string().min(12).max(160),
  password: z.string().min(8).max(128)
});

export const emailVerificationRequestSchema = z.object({
  email: z.string().email().max(120)
});

export const emailVerificationConfirmSchema = z.object({
  token: z.string().min(12).max(160)
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email().max(120)
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(12).max(160),
  password: z.string().min(8).max(128)
});

export const counselorReviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(240).optional().or(z.literal(""))
});

export const counselorStatusUpdateSchema = z.object({
  status: z.enum(["approved", "suspended"])
});

export interface PrivacyUserProfile {
  id: string;
  email?: string;
  emailMasked: string;
  emailVerified: boolean;
  preferredName: string;
  createdAt: string;
}

export interface UnifiedLoginResponse {
  token: string;
  role: "user" | "counselor";
  profile:
    | PrivacyUserProfile
    | {
        username: string;
        email?: string;
        role: "counselor";
        counselorId: string;
        displayName: string;
      };
}

export function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : undefined;
}

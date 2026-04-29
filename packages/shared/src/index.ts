import { z } from "zod";

export const supportIssueTypes = [
  "work_pressure",
  "family_relationship",
  "sleep_and_emotion",
  "career_transition",
  "interpersonal",
  "other"
] as const;

export const supportRequestStatuses = [
  "new",
  "viewed",
  "noted",
  "closed",
  "withdrawn",
  "spam"
] as const;

export const abuseStatuses = ["clean", "limited", "spam"] as const;
export const assessmentRiskLevels = ["low", "medium", "high"] as const;
export const assessmentScaleIds = ["who5", "phq9", "gad7"] as const;

export type SupportIssueType = (typeof supportIssueTypes)[number];
export type SupportRequestStatus = (typeof supportRequestStatuses)[number];
export type AbuseStatus = (typeof abuseStatuses)[number];
export type AssessmentRiskLevel = (typeof assessmentRiskLevels)[number];
export type AssessmentScaleId = (typeof assessmentScaleIds)[number];

export const issueTypeLabels: Record<SupportIssueType, string> = {
  work_pressure: "工作压力",
  family_relationship: "家庭与关系",
  sleep_and_emotion: "睡眠与情绪",
  career_transition: "职业阶段变化",
  interpersonal: "人际困扰",
  other: "其他"
};

export const requestStatusLabels: Record<SupportRequestStatus, string> = {
  new: "已收到",
  viewed: "中心已查看",
  noted: "中心已留意",
  closed: "已结束",
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

export interface AssessmentQuestion {
  id: string;
  scale: AssessmentScaleId;
  text: string;
  options: Array<{ label: string; value: number }>;
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
  { id: "phq9_8", scale: "phq9", text: "最近两周，行动或说话节奏明显变慢，或变得坐立不安。", options: frequencyOptions },
  { id: "phq9_9", scale: "phq9", text: "最近两周，出现过伤害自己的想法或觉得不如不在。", options: frequencyOptions },
  { id: "gad7_1", scale: "gad7", text: "最近两周，感到紧张、焦虑或放松不下来。", options: frequencyOptions },
  { id: "gad7_2", scale: "gad7", text: "最近两周，难以停止或控制担心。", options: frequencyOptions },
  { id: "gad7_3", scale: "gad7", text: "最近两周，对不同事情担心较多。", options: frequencyOptions },
  { id: "gad7_4", scale: "gad7", text: "最近两周，不太容易放松。", options: frequencyOptions },
  { id: "gad7_5", scale: "gad7", text: "最近两周，坐立不安或很难安静下来。", options: frequencyOptions },
  { id: "gad7_6", scale: "gad7", text: "最近两周，变得容易烦躁或急躁。", options: frequencyOptions },
  { id: "gad7_7", scale: "gad7", text: "最近两周，担心会发生不好的事情。", options: frequencyOptions }
];

export interface SupportSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity?: number;
  available: boolean;
  activeCount?: number;
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
  recent: AssessmentSummary[];
}

export interface SupportRequestSummary {
  id: string;
  receiptCode?: string;
  preferredName?: string;
  assessmentId?: string;
  assessmentRiskLevel?: AssessmentRiskLevel;
  slotId: string;
  slotStartTime?: string;
  slotEndTime?: string;
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

export const createSupportRequestSchema = z.object({
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

export const createSupportSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().int().min(1).max(20),
  available: z.boolean().optional()
});

export const updateSupportSlotSchema = createSupportSlotSchema.partial();

export const updateSupportRequestSchema = z.object({
  status: z.enum(["viewed", "noted", "closed", "spam"])
});

export const adminLoginSchema = z.object({
  username: z.string().min(2).max(64),
  password: z.string().min(8).max(128)
});

export function normalizeOptional(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : undefined;
}

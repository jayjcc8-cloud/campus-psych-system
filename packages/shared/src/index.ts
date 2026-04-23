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

export type SupportIssueType = (typeof supportIssueTypes)[number];
export type SupportRequestStatus = (typeof supportRequestStatuses)[number];
export type AbuseStatus = (typeof abuseStatuses)[number];

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

export interface SupportRequestSummary {
  id: string;
  receiptCode?: string;
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
  issueType: z.enum(supportIssueTypes),
  contactEmail: z.string().email().max(120).optional().or(z.literal("")),
  contactNote: z.string().max(160).optional().or(z.literal("")),
  remark: z.string().max(600).optional().or(z.literal(""))
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

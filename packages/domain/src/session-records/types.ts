import type { EmotionLevel, IssueType, RiskLevel } from "../common/types";

export interface SessionRecord {
  id: string;
  appointmentId: string;
  issueType: IssueType;
  emotionLevel: EmotionLevel;
  riskLevel: RiskLevel;
  needFollowUp: boolean;
  summaryNote: string;
  privateNote?: string;
  createdAt: string;
  updatedAt: string;
}


import type { RiskLevel, RiskProcessStatus } from "../common/types";

export interface RiskFlag {
  id: string;
  studentId: string;
  appointmentId?: string;
  triggerReason: string;
  level: RiskLevel;
  status: RiskProcessStatus;
  assignedTo?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}


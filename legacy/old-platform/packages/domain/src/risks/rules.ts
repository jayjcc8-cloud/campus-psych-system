import type { RiskLevel, RiskProcessStatus } from "../common/types";

export const riskEscalationTargets: Record<RiskLevel, RiskProcessStatus> = {
  low: "pending",
  medium: "in_progress",
  high: "in_progress"
};

export function requiresAdminAttention(level: RiskLevel): boolean {
  return level === "high";
}


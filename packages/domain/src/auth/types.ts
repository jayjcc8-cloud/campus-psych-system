import type { IdentityVisibilityLevel, UserRole } from "../common/types";

export interface UserProfile {
  id: string;
  role: UserRole;
  displayName: string;
  maskedDisplayName: string;
  schoolId?: string;
  college?: string;
  visibilityLevel: IdentityVisibilityLevel;
}

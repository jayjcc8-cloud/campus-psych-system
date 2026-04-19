export interface Counselor {
  id: string;
  displayName: string;
  specialty: string[];
  intro: string;
  gender?: "female" | "male" | "other";
  nextAvailableSlot: string | null;
}

export interface CounselorScheduleSlot {
  id: string;
  counselorId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  available: boolean;
}


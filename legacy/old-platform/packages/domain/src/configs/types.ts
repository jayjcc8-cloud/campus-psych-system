export interface PublicConfig {
  announcement: string;
  bookingPolicy: string;
  emergencyContacts: Array<{
    label: string;
    phone: string;
  }>;
  forceStudentIdBinding: boolean;
}

export interface PublicConfigUpdate {
  announcement?: string;
  bookingPolicy?: string;
  emergencyContacts?: Array<{
    label: string;
    phone: string;
  }>;
  forceStudentIdBinding?: boolean;
}

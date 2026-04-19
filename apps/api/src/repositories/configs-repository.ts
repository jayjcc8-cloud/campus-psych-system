import type { PublicConfig, PublicConfigUpdate } from "@campus-psych/domain";
import { getDatabase } from "../db/client";

interface PublicConfigRow {
  id: string;
  announcement: string;
  booking_policy: string;
  emergency_contacts_json: string;
  force_student_id_binding: number;
  updated_at: string;
}

function mapConfig(row: PublicConfigRow): PublicConfig {
  return {
    announcement: row.announcement,
    bookingPolicy: row.booking_policy,
    emergencyContacts: JSON.parse(row.emergency_contacts_json) as PublicConfig["emergencyContacts"],
    forceStudentIdBinding: row.force_student_id_binding === 1
  };
}

export function getPublicConfigRecord() {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT id, announcement, booking_policy, emergency_contacts_json, force_student_id_binding, updated_at
       FROM public_configs
       WHERE id = 'default'`
    )
    .get() as PublicConfigRow | undefined;

  if (!row) {
    throw new Error("Public config row not found.");
  }

  return mapConfig(row);
}

export function updatePublicConfigRecord(input: PublicConfigUpdate) {
  const db = getDatabase();
  const current = db
    .prepare(
      `SELECT id, announcement, booking_policy, emergency_contacts_json, force_student_id_binding, updated_at
       FROM public_configs
       WHERE id = 'default'`
    )
    .get() as PublicConfigRow | undefined;

  if (!current) {
    throw new Error("Public config row not found.");
  }

  const next = {
    ...current,
    announcement: input.announcement ?? current.announcement,
    booking_policy: input.bookingPolicy ?? current.booking_policy,
    emergency_contacts_json: JSON.stringify(input.emergencyContacts ?? JSON.parse(current.emergency_contacts_json)),
    force_student_id_binding:
      input.forceStudentIdBinding === undefined
        ? current.force_student_id_binding
        : input.forceStudentIdBinding
          ? 1
          : 0,
    updated_at: new Date().toISOString()
  };

  db.prepare(
    `UPDATE public_configs
     SET announcement = @announcement,
         booking_policy = @booking_policy,
         emergency_contacts_json = @emergency_contacts_json,
         force_student_id_binding = @force_student_id_binding,
         updated_at = @updated_at
     WHERE id = @id`
  ).run(next);

  return mapConfig(next);
}


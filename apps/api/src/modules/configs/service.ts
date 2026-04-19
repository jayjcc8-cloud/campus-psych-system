import type { PublicConfigUpdate } from "@campus-psych/domain";
import { runInTransaction } from "../../db/client";
import type { RequestActor } from "../../lib/actor";
import {
  getPublicConfigRecord,
  updatePublicConfigRecord
} from "../../repositories/configs-repository";
import { appendAuditLog } from "../shared/audit";

export function getPublicConfig() {
  return getPublicConfigRecord();
}

export function updatePublicConfig(input: PublicConfigUpdate, actor: RequestActor) {
  const config = runInTransaction(() => {
    const updatedConfig = updatePublicConfigRecord(input);
    appendAuditLog(actor, "config.update", "public_config", "default", "Updated public-facing configuration.");
    return updatedConfig;
  });

  return config;
}

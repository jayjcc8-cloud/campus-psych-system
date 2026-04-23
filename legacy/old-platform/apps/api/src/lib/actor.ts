import type { FastifyRequest } from "fastify";
import type { UserRole } from "@campus-psych/domain";

export interface RequestActor {
  operatorId: string;
  operatorRole: UserRole;
}

export function getActor(request: FastifyRequest): RequestActor {
  const actor = tryGetActor(request);

  if (!actor) {
    throw new Error("Missing or invalid authentication headers.");
  }

  return actor;
}

export function tryGetActor(request: FastifyRequest): RequestActor | null {
  const roleHeader = request.headers["x-user-role"];
  const idHeader = request.headers["x-user-id"];
  const operatorRole = normalizeRole(roleHeader);
  const operatorId =
    typeof idHeader === "string" && idHeader.trim().length > 0 ? idHeader.trim() : null;

  if (!operatorRole || !operatorId) {
    return null;
  }

  return {
    operatorId,
    operatorRole
  };
}

function normalizeRole(value: string | string[] | undefined): UserRole | null {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "student" || candidate === "counselor" || candidate === "admin") {
    return candidate;
  }

  return null;
}

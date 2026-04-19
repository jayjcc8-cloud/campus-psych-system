import type { FastifyRequest } from "fastify";
import type { UserRole } from "@campus-psych/domain";

export interface RequestActor {
  operatorId: string;
  operatorRole: UserRole;
}

export function getActor(request: FastifyRequest): RequestActor {
  const roleHeader = request.headers["x-user-role"];
  const idHeader = request.headers["x-user-id"];

  const operatorRole = normalizeRole(roleHeader);
  const operatorId = typeof idHeader === "string" && idHeader.trim().length > 0 ? idHeader : `${operatorRole}-dev`;

  return {
    operatorId,
    operatorRole
  };
}

function normalizeRole(value: string | string[] | undefined): UserRole {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "student" || candidate === "counselor" || candidate === "admin") {
    return candidate;
  }

  return "admin";
}


import type { UserRole } from "@campus-psych/domain";
import type { FastifyReply, FastifyRequest } from "fastify";
import { tryGetActor } from "./actor";

export function requireRoles(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const actor = tryGetActor(request);

    if (!actor) {
      return reply.code(401).send({
        message: "Missing or invalid authentication headers."
      });
    }

    if (!allowedRoles.includes(actor.operatorRole)) {
      return reply.code(403).send({
        message: `${actor.operatorRole} cannot access this resource.`
      });
    }
  };
}

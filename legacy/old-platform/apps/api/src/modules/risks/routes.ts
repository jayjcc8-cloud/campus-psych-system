import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import { requireRoles } from "../../lib/authorization";
import { listRiskFlags, updateRiskFlag } from "./service";

const updateRiskSchema = z.object({
  status: z.enum(["pending", "in_progress", "processed", "closed"]).optional(),
  assignedTo: z.string().min(1).optional(),
  nextFollowUpAt: z.string().datetime().optional()
});

export async function registerRiskRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireRoles("counselor", "admin") }, async () => listRiskFlags());

  app.patch("/:id", { preHandler: requireRoles("counselor", "admin") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = updateRiskSchema.parse(request.body);
    const actor = getActor(request);
    const risk = updateRiskFlag({
      id,
      actor,
      ...payload
    });

    if (!risk) {
      return reply.code(404).send({ message: "Risk flag not found." });
    }

    return risk;
  });
}

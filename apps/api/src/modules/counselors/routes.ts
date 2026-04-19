import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../lib/authorization";
import { getCounselorDetail, listCounselors } from "./service";

export async function registerCounselorRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireRoles("student", "counselor", "admin") }, async () => listCounselors());

  app.get("/:id", { preHandler: requireRoles("student", "counselor", "admin") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getCounselorDetail(id);

    if (!detail.counselor) {
      return reply.code(404).send({ message: "Counselor not found." });
    }

    return detail;
  });
}

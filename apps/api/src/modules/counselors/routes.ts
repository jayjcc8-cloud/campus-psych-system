import type { FastifyInstance } from "fastify";
import { getCounselorDetail, listCounselors } from "./service";

export async function registerCounselorRoutes(app: FastifyInstance) {
  app.get("/", async () => listCounselors());

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getCounselorDetail(id);

    if (!detail.counselor) {
      return reply.code(404).send({ message: "Counselor not found." });
    }

    return detail;
  });
}

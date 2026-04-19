import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import { requireRoles } from "../../lib/authorization";
import { createSessionRecord, listSessionRecords } from "./service";

const createSessionRecordSchema = z.object({
  appointmentId: z.string(),
  issueType: z.enum([
    "academic_pressure",
    "sleep",
    "relationship",
    "emotion",
    "career",
    "other"
  ]),
  emotionLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5)
  ]),
  riskLevel: z.enum(["low", "medium", "high"]),
  needFollowUp: z.boolean(),
  summaryNote: z.string().min(1),
  privateNote: z.string().optional()
});

export async function registerSessionRecordRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireRoles("counselor", "admin") }, async () => listSessionRecords());

  app.post("/", { preHandler: requireRoles("counselor", "admin") }, async (request, reply) => {
    const payload = createSessionRecordSchema.parse(request.body);
    const actor = getActor(request);

    try {
      return reply.code(201).send(createSessionRecord(payload, actor));
    } catch (error) {
      return reply.code(404).send({
        message: error instanceof Error ? error.message : "Failed to create session record."
      });
    }
  });
}

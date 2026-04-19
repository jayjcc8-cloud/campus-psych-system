import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import { requireRoles } from "../../lib/authorization";
import { getPublicConfig, updatePublicConfig } from "./service";

const updatePublicConfigSchema = z.object({
  announcement: z.string().min(1).optional(),
  bookingPolicy: z.string().min(1).optional(),
  emergencyContacts: z
    .array(
      z.object({
        label: z.string().min(1),
        phone: z.string().min(1)
      })
    )
    .optional(),
  forceStudentIdBinding: z.boolean().optional()
});

export async function registerConfigRoutes(app: FastifyInstance) {
  app.get("/public", async () => getPublicConfig());

  app.patch("/public", { preHandler: requireRoles("admin") }, async (request) => {
    const payload = updatePublicConfigSchema.parse(request.body);
    const actor = getActor(request);

    return updatePublicConfig(payload, actor);
  });
}

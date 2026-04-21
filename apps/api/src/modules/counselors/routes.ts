import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import { requireRoles } from "../../lib/authorization";
import {
  createMyCounselorSchedule,
  getCounselorDetail,
  getMyCounselorWorkspace,
  listCounselors,
  updateMyCounselorProfile,
  updateMyCounselorSchedule
} from "./service";

const issueTypeSchema = z.enum([
  "academic_pressure",
  "sleep",
  "relationship",
  "emotion",
  "career",
  "other"
]);

const updateMyCounselorProfileSchema = z.object({
  intro: z.string().trim().min(8).max(300),
  specialty: z.array(issueTypeSchema).min(1).max(6)
});

const createScheduleSchema = z.object({
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  capacity: z.number().int().min(1).max(10).optional(),
  available: z.boolean().optional()
});

const updateScheduleSchema = z.object({
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().min(1).optional(),
  capacity: z.number().int().min(1).max(10).optional(),
  available: z.boolean().optional()
}).refine((payload) => Object.keys(payload).length > 0, {
  message: "At least one schedule field must be provided."
});

export async function registerCounselorRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireRoles("student", "counselor", "admin") }, async () => listCounselors());

  app.get("/me", { preHandler: requireRoles("counselor") }, async (request, reply) => {
    const actor = getActor(request);
    const detail = getMyCounselorWorkspace(actor);

    if (!detail.counselor) {
      return reply.code(404).send({ message: "Counselor not found." });
    }

    return detail;
  });

  app.patch("/me", { preHandler: requireRoles("counselor") }, async (request, reply) => {
    const actor = getActor(request);
    const payload = updateMyCounselorProfileSchema.parse(request.body);
    const counselor = updateMyCounselorProfile(actor, payload);

    if (!counselor) {
      return reply.code(404).send({ message: "Counselor not found." });
    }

    return counselor;
  });

  app.post("/me/schedules", { preHandler: requireRoles("counselor") }, async (request, reply) => {
    const actor = getActor(request);
    const payload = createScheduleSchema.parse(request.body);

    try {
      const schedule = createMyCounselorSchedule(actor, payload);

      if (!schedule) {
        return reply.code(404).send({ message: "Counselor not found." });
      }

      return reply.code(201).send(schedule);
    } catch (error) {
      return reply.code(409).send({
        message: error instanceof Error ? error.message : "Failed to create schedule."
      });
    }
  });

  app.patch("/me/schedules/:id", { preHandler: requireRoles("counselor") }, async (request, reply) => {
    const actor = getActor(request);
    const { id } = request.params as { id: string };
    const payload = updateScheduleSchema.parse(request.body);

    try {
      const schedule = updateMyCounselorSchedule(actor, id, payload);

      if (!schedule) {
        return reply.code(404).send({ message: "Schedule not found." });
      }

      return schedule;
    } catch (error) {
      return reply.code(409).send({
        message: error instanceof Error ? error.message : "Failed to update schedule."
      });
    }
  });

  app.get("/:id", { preHandler: requireRoles("student", "counselor", "admin") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = getCounselorDetail(id);

    if (!detail.counselor) {
      return reply.code(404).send({ message: "Counselor not found." });
    }

    return detail;
  });
}

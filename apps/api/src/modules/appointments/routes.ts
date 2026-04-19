import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import {
  createAppointment,
  listAppointments,
  listMyAppointments,
  summarizeAppointments,
  updateAppointmentStatus
} from "./service";

const createAppointmentSchema = z.object({
  counselorId: z.string(),
  scheduleSlotId: z.string(),
  issueEntryType: z.enum([
    "academic_pressure",
    "sleep",
    "relationship",
    "emotion",
    "career",
    "other"
  ]),
  remark: z.string().max(300).optional()
});

const updateStatusSchema = z.object({
  nextStatus: z.enum([
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
    "expired"
  ])
});

export async function registerAppointmentRoutes(app: FastifyInstance) {
  app.get("/summary", async () => summarizeAppointments());

  app.get("/", async () => listAppointments());

  app.get("/my", async () => listMyAppointments());

  app.post("/", async (request, reply) => {
    const payload = createAppointmentSchema.parse(request.body);
    const actor = getActor(request);

    try {
      return reply.code(201).send(createAppointment(payload, actor));
    } catch (error) {
      return reply.code(409).send({
        message: error instanceof Error ? error.message : "Failed to create appointment."
      });
    }
  });

  app.patch("/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = updateStatusSchema.parse(request.body);
    const actor = getActor(request);

    try {
      const appointment = updateAppointmentStatus({
        id,
        nextStatus: payload.nextStatus,
        actor
      });

      if (!appointment) {
        return reply.code(404).send({ message: "Appointment not found." });
      }

      return appointment;
    } catch (error) {
      return reply.code(409).send({
        message: error instanceof Error ? error.message : "Failed to update appointment."
      });
    }
  });
}

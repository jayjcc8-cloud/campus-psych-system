import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import { requireRoles } from "../../lib/authorization";
import {
  cancelMyAppointment,
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

const cancelAppointmentSchema = z.object({
  cancelReason: z.string().max(200).optional()
});

export async function registerAppointmentRoutes(app: FastifyInstance) {
  app.get("/summary", { preHandler: requireRoles("admin") }, async () => summarizeAppointments());

  app.get("/", { preHandler: requireRoles("admin") }, async () => listAppointments());

  app.get("/my", { preHandler: requireRoles("student") }, async (request) => {
    const actor = getActor(request);
    return listMyAppointments(actor.operatorId);
  });

  app.post("/", { preHandler: requireRoles("student") }, async (request, reply) => {
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

  app.patch("/:id/cancel", { preHandler: requireRoles("student") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = cancelAppointmentSchema.parse(request.body ?? {});
    const actor = getActor(request);

    try {
      const appointment = cancelMyAppointment({
        id,
        actor,
        cancelReason: payload.cancelReason
      });

      if (!appointment) {
        return reply.code(404).send({ message: "Appointment not found." });
      }

      return appointment;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel appointment.";
      const statusCode = message.includes("another student's appointment") ? 403 : 409;

      return reply.code(statusCode).send({ message });
    }
  });

  app.patch("/:id/status", { preHandler: requireRoles("counselor", "admin") }, async (request, reply) => {
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

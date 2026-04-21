import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import { requireRoles } from "../../lib/authorization";
import { getCurrentStudentProfile } from "../../repositories/reference-repository";
import {
  getStudentBootstrap,
  updateStudentBinding,
  verifyPhoneOneClickCode
} from "./service";

const updateStudentBindingSchema = z.object({
  displayName: z.string().trim().min(2).max(32),
  college: z.string().trim().min(2).max(64),
  schoolId: z.string().trim().min(4).max(32)
});

const phoneOneClickSchema = z.object({
  code: z.string().trim().min(1)
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/wechat/login", async () => ({
    token: "mock-token",
    profile: getCurrentStudentProfile()
  }));

  app.post("/wechat/phone-one-click", async (request) => {
    const payload = phoneOneClickSchema.parse(request.body);
    return verifyPhoneOneClickCode(payload.code);
  });

  app.get("/bootstrap", { preHandler: requireRoles("student") }, async (request) => {
    const actor = getActor(request);
    return getStudentBootstrap(actor.operatorId);
  });

  app.patch("/profile", { preHandler: requireRoles("student") }, async (request) => {
    const actor = getActor(request);
    const payload = updateStudentBindingSchema.parse(request.body);

    return updateStudentBinding(actor.operatorId, payload, actor);
  });
}

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getActor } from "../../lib/actor";
import { requireRoles } from "../../lib/authorization";
import { getCurrentStudentProfile } from "../../repositories/reference-repository";
import {
  getAuthSession,
  getStudentBootstrap,
  updateStudentBinding,
  verifyTeacherLogin,
  verifyPhoneOneClickCode
} from "./service";

const updateStudentBindingSchema = z.object({
  displayName: z.string().trim().min(2).max(32),
  college: z.string().trim().min(2).max(64),
  schoolId: z.string().trim().min(4).max(32)
});

const phoneOneClickSchema = z.object({
  code: z.string().trim().min(1),
  roleHint: z.enum(["student", "teacher"]).optional()
});

const teacherLoginSchema = z.object({
  displayName: z.string().trim().min(2).max(32),
  workId: z.string().trim().min(2).max(32),
  college: z.string().trim().min(2).max(64),
  phone: z.string().trim().min(8).max(32)
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/wechat/login", async () => ({
    token: "mock-token",
    profile: getCurrentStudentProfile()
  }));

  app.post("/wechat/phone-one-click", async (request) => {
    const payload = phoneOneClickSchema.parse(request.body);
    return verifyPhoneOneClickCode(payload.code, payload.roleHint);
  });

  app.post("/teacher/login", async (request, reply) => {
    const payload = teacherLoginSchema.parse(request.body);
    try {
      return verifyTeacherLogin(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "教师身份验证失败。";

      return reply.code(403).send({
        statusCode: 403,
        error: "Forbidden",
        message
      });
    }
  });

  app.get("/me", { preHandler: requireRoles("student", "counselor", "admin") }, async (request) => {
    const actor = getActor(request);
    return getAuthSession(actor);
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

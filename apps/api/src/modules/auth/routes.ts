import type { FastifyInstance } from "fastify";
import { getCurrentStudentProfile } from "../../repositories/reference-repository";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/wechat/login", async () => ({
    token: "mock-token",
    profile: getCurrentStudentProfile()
  }));
}

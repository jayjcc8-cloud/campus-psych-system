import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../lib/authorization";
import { listAuditLogs } from "./service";

export async function registerAuditLogRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireRoles("admin") }, async () => listAuditLogs());
}

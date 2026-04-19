import type { FastifyInstance } from "fastify";
import { listAuditLogs } from "./service";

export async function registerAuditLogRoutes(app: FastifyInstance) {
  app.get("/", async () => listAuditLogs());
}


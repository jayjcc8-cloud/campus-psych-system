import type { FastifyInstance } from "fastify";
import { requireRoles } from "../../lib/authorization";
import { getOverviewMetrics } from "./service";

export async function registerStatisticsRoutes(app: FastifyInstance) {
  app.get("/overview", { preHandler: requireRoles("admin") }, async () => getOverviewMetrics());
}

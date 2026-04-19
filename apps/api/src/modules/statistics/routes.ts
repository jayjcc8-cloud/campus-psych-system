import type { FastifyInstance } from "fastify";
import { getOverviewMetrics } from "./service";

export async function registerStatisticsRoutes(app: FastifyInstance) {
  app.get("/overview", async () => getOverviewMetrics());
}


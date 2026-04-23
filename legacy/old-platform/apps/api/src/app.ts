import cors from "@fastify/cors";
import Fastify from "fastify";
import { initializeDatabase } from "./db/init";
import { registerAuditLogRoutes } from "./modules/audit-logs/routes";
import { registerAppointmentRoutes } from "./modules/appointments/routes";
import { registerAuthRoutes } from "./modules/auth/routes";
import { registerConfigRoutes } from "./modules/configs/routes";
import { registerCounselorRoutes } from "./modules/counselors/routes";
import { registerHealthRoutes } from "./modules/health/routes";
import { registerRiskRoutes } from "./modules/risks/routes";
import { registerSessionRecordRoutes } from "./modules/session-records/routes";
import { registerStatisticsRoutes } from "./modules/statistics/routes";

export function createApp() {
  initializeDatabase();

  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true,
    methods: ["GET", "HEAD", "POST", "PATCH"]
  });

  app.register(registerHealthRoutes);
  app.register(registerAuthRoutes, { prefix: "/auth" });
  app.register(registerConfigRoutes, { prefix: "/configs" });
  app.register(registerCounselorRoutes, { prefix: "/counselors" });
  app.register(registerAppointmentRoutes, { prefix: "/appointments" });
  app.register(registerAuditLogRoutes, { prefix: "/audit-logs" });
  app.register(registerSessionRecordRoutes, { prefix: "/session-records" });
  app.register(registerRiskRoutes, { prefix: "/risk-flags" });
  app.register(registerStatisticsRoutes, { prefix: "/statistics" });

  return app;
}

import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { SupportModule } from "./support/support.module.js";

@Module({
  imports: [DatabaseModule, SupportModule, AdminModule],
  controllers: [HealthController]
})
export class AppModule {}

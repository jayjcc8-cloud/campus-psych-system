import { Module } from "@nestjs/common";
import { AssessmentModule } from "./assessment/assessment.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { CounselorModule } from "./counselor/counselor.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { SupportModule } from "./support/support.module.js";

@Module({
  imports: [DatabaseModule, SupportModule, AssessmentModule, CounselorModule, AdminModule],
  controllers: [HealthController]
})
export class AppModule {}

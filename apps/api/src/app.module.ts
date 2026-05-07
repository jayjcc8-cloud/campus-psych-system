import { Module } from "@nestjs/common";
import { AssessmentModule } from "./assessment/assessment.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CounselorModule } from "./counselor/counselor.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { SupportModule } from "./support/support.module.js";
import { UserModule } from "./user/user.module.js";

@Module({
  imports: [DatabaseModule, SupportModule, AssessmentModule, CounselorModule, UserModule, AuthModule, AdminModule],
  controllers: [HealthController]
})
export class AppModule {}

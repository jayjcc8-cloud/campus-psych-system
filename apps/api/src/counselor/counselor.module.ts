import { Module } from "@nestjs/common";
import { SupportModule } from "../support/support.module.js";
import { CounselorAuthGuard } from "./counselor-auth.guard.js";
import { CounselorController } from "./counselor.controller.js";
import { CounselorService } from "./counselor.service.js";

@Module({
  imports: [SupportModule],
  controllers: [CounselorController],
  providers: [CounselorService, CounselorAuthGuard],
  exports: [CounselorService, CounselorAuthGuard]
})
export class CounselorModule {}

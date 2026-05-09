import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module.js";
import { AssessmentController } from "./assessment.controller.js";
import { AssessmentService } from "./assessment.service.js";

@Module({
  imports: [UserModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService]
})
export class AssessmentModule {}

import { Module } from "@nestjs/common";
import { SupportModule } from "../support/support.module.js";
import { AdminAuthGuard } from "./admin-auth.guard.js";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";

@Module({
  imports: [SupportModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard],
  exports: [AdminService, AdminAuthGuard]
})
export class AdminModule {}

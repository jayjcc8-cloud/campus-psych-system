import { Module } from "@nestjs/common";
import { AdminAuthGuard } from "./admin-auth.guard.js";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard],
  exports: [AdminService, AdminAuthGuard]
})
export class AdminModule {}

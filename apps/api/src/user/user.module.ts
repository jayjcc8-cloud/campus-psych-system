import { Module } from "@nestjs/common";
import { UserAuthGuard } from "./user-auth.guard.js";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";

@Module({
  controllers: [UserController],
  providers: [UserService, UserAuthGuard],
  exports: [UserService, UserAuthGuard]
})
export class UserModule {}

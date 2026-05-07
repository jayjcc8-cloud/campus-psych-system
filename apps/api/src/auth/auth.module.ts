import { Module } from "@nestjs/common";
import { CounselorModule } from "../counselor/counselor.module.js";
import { UserModule } from "../user/user.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  imports: [UserModule, CounselorModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}

import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module.js";
import { SupportController } from "./support.controller.js";
import { SupportService } from "./support.service.js";

@Module({
  imports: [UserModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService]
})
export class SupportModule {}

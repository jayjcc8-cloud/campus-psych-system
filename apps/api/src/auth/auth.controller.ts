import { Body, Controller, Post } from "@nestjs/common";
import { unifiedLoginSchema } from "@teacher-support/shared";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() body: unknown) {
    const payload = unifiedLoginSchema.parse(body);
    return this.auth.login(payload.identifier, payload.password);
  }
}

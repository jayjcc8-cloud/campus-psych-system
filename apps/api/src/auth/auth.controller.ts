import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import {
  emailVerificationConfirmSchema,
  emailVerificationRequestSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  unifiedLoginSchema
} from "@teacher-support/shared";
import type { Request } from "express";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() body: unknown) {
    const payload = unifiedLoginSchema.parse(body);
    return this.auth.login(payload.identifier, payload.password);
  }

  @Post("email-verification/request")
  requestEmailVerification(@Body() body: unknown) {
    const payload = emailVerificationRequestSchema.parse(body);
    return this.auth.requestEmailVerification(payload.email);
  }

  @Post("email-verification/confirm")
  confirmEmailVerification(@Body() body: unknown) {
    const payload = emailVerificationConfirmSchema.parse(body);
    return this.auth.confirmEmailVerification(payload.token);
  }

  @Post("password-reset/request")
  requestPasswordReset(@Body() body: unknown) {
    const payload = passwordResetRequestSchema.parse(body);
    return this.auth.requestPasswordReset(payload.email);
  }

  @Post("password-reset/confirm")
  confirmPasswordReset(@Body() body: unknown) {
    const payload = passwordResetConfirmSchema.parse(body);
    return this.auth.confirmPasswordReset(payload.token, payload.password);
  }

  @Post("logout")
  logout(@Req() request: Request) {
    const header = request.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    return this.auth.logout(token);
  }

  @Get("dev-outbox")
  listDevOutbox() {
    return this.auth.listDevOutbox();
  }
}

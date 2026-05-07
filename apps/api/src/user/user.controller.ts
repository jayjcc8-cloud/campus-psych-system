import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { userLoginSchema, userRecoverySchema, userRegisterSchema } from "@teacher-support/shared";
import { UserAuthGuard, type UserRequest } from "./user-auth.guard.js";
import { UserService } from "./user.service.js";

@Controller("user")
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post("auth/register")
  register(@Body() body: unknown) {
    const payload = userRegisterSchema.parse(body);
    return this.users.register({
      password: payload.password,
      preferredName: payload.preferredName,
      recoveryEmail: payload.recoveryEmail || undefined
    });
  }

  @Post("auth/login")
  login(@Body() body: unknown) {
    const payload = userLoginSchema.parse(body);
    return this.users.login(payload.identifier, payload.password);
  }

  @Post("auth/recover")
  recover(@Body() body: unknown) {
    const payload = userRecoverySchema.parse(body);
    return this.users.recover(payload);
  }

  @Get("me")
  @UseGuards(UserAuthGuard)
  me(@Req() request: UserRequest) {
    return this.users.getMe(request.user!.userId!);
  }
}

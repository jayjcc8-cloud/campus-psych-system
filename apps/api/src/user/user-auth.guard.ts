import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { verifyAdminToken, type AdminTokenPayload } from "../common/security.js";

export interface UserRequest extends Request {
  user?: AdminTokenPayload;
}

@Injectable()
export class UserAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const header = request.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const payload = token ? verifyAdminToken(token) : null;

    if (!payload || payload.role !== "user" || !payload.userId) {
      throw new UnauthorizedException("请先登录用户账号。");
    }

    request.user = payload;
    return true;
  }
}

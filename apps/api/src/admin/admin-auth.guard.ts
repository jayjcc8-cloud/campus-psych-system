import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { verifyAdminToken, type AdminTokenPayload } from "../common/security.js";

export interface AdminRequest extends Request {
  admin?: AdminTokenPayload;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const header = request.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const payload = token ? verifyAdminToken(token) : null;

    if (!payload) {
      throw new UnauthorizedException("请先登录支持管理后台。");
    }

    request.admin = payload;
    return true;
  }
}

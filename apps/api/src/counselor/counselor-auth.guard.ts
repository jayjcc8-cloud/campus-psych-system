import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { verifyAdminToken, type AdminTokenPayload } from "../common/security.js";

export interface CounselorRequest extends Request {
  counselor?: AdminTokenPayload;
}

@Injectable()
export class CounselorAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CounselorRequest>();
    const header = request.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const payload = token ? verifyAdminToken(token) : null;

    if (!payload || payload.role !== "counselor" || !payload.counselorId) {
      throw new UnauthorizedException("请先登录咨询师端。");
    }

    request.counselor = payload;
    return true;
  }
}

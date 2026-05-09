import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { hashToken, verifyAdminToken, type AdminTokenPayload } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

export interface AdminRequest extends Request {
  admin?: AdminTokenPayload;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const header = request.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const payload = token ? verifyAdminToken(token) : null;

    if (!payload || !["center_admin", "admin"].includes(payload.role)) {
      throw new UnauthorizedException("请先登录支持管理后台。");
    }
    if (await this.isRevoked(token)) {
      throw new UnauthorizedException("登录已失效，请重新登录。");
    }
    if (!(await this.matchesTokenVersion(payload))) {
      throw new UnauthorizedException("登录已失效，请重新登录。");
    }

    request.admin = payload;
    return true;
  }

  private async isRevoked(token: string) {
    const result = await this.database.query<{ id: string }>(
      "SELECT id FROM token_revocations WHERE token_hash = $1 AND expires_at > now() LIMIT 1",
      [hashToken(token)]
    );
    return Boolean(result.rows[0]);
  }

  private async matchesTokenVersion(payload: AdminTokenPayload) {
    const result = await this.database.query<{ token_version: number }>(
      "SELECT token_version FROM admin_users WHERE id = $1 AND status = 'active'",
      [payload.sub]
    );
    return Number(result.rows[0]?.token_version ?? -1) === Number(payload.tokenVersion ?? 0);
  }
}

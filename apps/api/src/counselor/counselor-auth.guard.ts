import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { hashToken, verifyAdminToken, type AdminTokenPayload } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

export interface CounselorRequest extends Request {
  counselor?: AdminTokenPayload;
}

@Injectable()
export class CounselorAuthGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CounselorRequest>();
    const header = request.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const payload = token ? verifyAdminToken(token) : null;

    if (!payload || payload.role !== "counselor" || !payload.counselorId) {
      throw new UnauthorizedException("请先登录咨询师端。");
    }
    if (await this.isRevoked(token)) {
      throw new UnauthorizedException("登录已失效，请重新登录。");
    }
    if (!(await this.matchesTokenVersion(payload))) {
      throw new UnauthorizedException("登录已失效，请重新登录。");
    }

    request.counselor = payload;
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
      `SELECT accounts.token_version
       FROM counselor_accounts accounts
       INNER JOIN counselors ON counselors.id = accounts.counselor_id
       WHERE accounts.id = $1 AND accounts.status = 'active' AND counselors.status = 'approved'`,
      [payload.sub]
    );
    return Number(result.rows[0]?.token_version ?? -1) === Number(payload.tokenVersion ?? 0);
  }
}

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { signAdminToken, verifyPassword } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async login(username: string, password: string) {
    const result = await this.database.query<{
      id: string;
      username: string;
      display_name: string;
      password_hash: string;
      role: string;
      status: string;
    }>(
      `SELECT id, username, display_name, password_hash, role, status
       FROM admin_users
       WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    if (!user || user.status !== "active" || !verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }

    return {
      token: signAdminToken({
        sub: user.id,
        username: user.username,
        role: user.role
      }),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role
      }
    };
  }

  async listAuditLogs() {
    const result = await this.database.query(
      `SELECT logs.id,
              users.display_name AS admin_display_name,
              logs.action,
              logs.target_type,
              logs.target_id,
              logs.detail,
              logs.created_at
       FROM audit_logs logs
       LEFT JOIN admin_users users ON users.id = logs.admin_user_id
       ORDER BY logs.created_at DESC
       LIMIT 200`
    );

    return result.rows.map((row) => ({
      id: row.id,
      adminDisplayName: row.admin_display_name,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      detail: row.detail,
      createdAt: row.created_at
    }));
  }
}

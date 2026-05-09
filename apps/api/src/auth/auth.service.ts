import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { CounselorService } from "../counselor/counselor.service.js";
import { createId, createOpaqueToken, hashPassword, hashToken } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";
import { UserService } from "../user/user.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly counselors: CounselorService,
    private readonly database: DatabaseService
  ) {}

  async login(identifier: string, password: string) {
    const email = identifier.trim().toLowerCase();

    try {
      const result = await this.counselors.login(email, password);
      return { token: result.token, role: "counselor" as const, profile: result.user };
    } catch (counselorError) {
      try {
        const result = await this.users.login(email, password);
        return { token: result.token, role: "user" as const, profile: result.user };
      } catch {
        if (counselorError instanceof UnauthorizedException && counselorError.message.includes("审核")) {
          throw counselorError;
        }
        throw new UnauthorizedException("账号或密码不正确。");
      }
    }
  }

  async requestEmailVerification(emailInput: string) {
    const email = normalizeEmail(emailInput);
    const user = await this.database.query<{ id: string; email_verified: boolean }>(
      "SELECT id, email_verified FROM privacy_user_accounts WHERE email = $1 AND status = 'active'",
      [email]
    );
    const account = user.rows[0];
    if (!account) {
      return { ok: true, message: "如果邮箱已注册，验证邮件会发送到该邮箱。" };
    }
    if (account.email_verified) {
      return { ok: true, message: "邮箱已验证。" };
    }

    const token = await this.createAccountToken("user", account.id, "email_verification", 24);
    return {
      ok: true,
      message: "验证邮件已生成。本地开发环境可直接使用返回的验证码。",
      devToken: exposeDevToken(token)
    };
  }

  async confirmEmailVerification(token: string) {
    const account = await this.consumeAccountToken(token, "email_verification");
    if (account.accountType !== "user") {
      throw new BadRequestException("验证链接无效。");
    }

    await this.database.query(
      "UPDATE privacy_user_accounts SET email_verified = true, updated_at = now(), token_version = token_version + 1 WHERE id = $1",
      [account.accountId]
    );
    return { ok: true, message: "邮箱已验证，请重新登录。" };
  }

  async requestPasswordReset(emailInput: string) {
    const email = normalizeEmail(emailInput);
    const account = await this.findResetAccount(email);
    if (!account) {
      return { ok: true, message: "如果邮箱已注册，重设邮件会发送到该邮箱。" };
    }

    const token = await this.createAccountToken(account.accountType, account.accountId, "password_reset", 1);
    return {
      ok: true,
      message: "密码重设邮件已生成。本地开发环境可直接使用返回的验证码。",
      devToken: exposeDevToken(token)
    };
  }

  async confirmPasswordReset(token: string, password: string) {
    const account = await this.consumeAccountToken(token, "password_reset");
    const passwordHash = hashPassword(password);

    if (account.accountType === "user") {
      await this.database.query(
        "UPDATE privacy_user_accounts SET password_hash = $2, token_version = token_version + 1, updated_at = now() WHERE id = $1",
        [account.accountId, passwordHash]
      );
    } else if (account.accountType === "counselor") {
      await this.database.query(
        "UPDATE counselor_accounts SET password_hash = $2, token_version = token_version + 1, updated_at = now() WHERE id = $1",
        [account.accountId, passwordHash]
      );
    } else {
      await this.database.query(
        "UPDATE admin_users SET password_hash = $2, token_version = token_version + 1, updated_at = now() WHERE id = $1",
        [account.accountId, passwordHash]
      );
    }

    return { ok: true, message: "密码已重设，请重新登录。" };
  }

  async logout(token: string) {
    if (!token) {
      return { ok: true };
    }
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString();
    await this.database.query(
      `INSERT INTO token_revocations (id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (token_hash) DO NOTHING`,
      [createId(), hashToken(token), expiresAt]
    );
    return { ok: true };
  }

  async listDevOutbox() {
    if (process.env.NODE_ENV === "production") {
      throw new BadRequestException("生产环境不可查看开发验证码。");
    }

    const result = await this.database.query(
      `SELECT account_type, account_id, purpose, token_hash, expires_at, used_at, created_at
       FROM account_tokens
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return result.rows;
  }

  private async createAccountToken(accountType: "user" | "counselor" | "admin", accountId: string, purpose: "email_verification" | "password_reset", ttlHours: number) {
    const token = createOpaqueToken(purpose === "email_verification" ? "verify" : "reset");
    await this.database.query(
      `INSERT INTO account_tokens (id, account_type, account_id, purpose, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, now() + ($6 || ' hours')::interval, now())`,
      [createId(), accountType, accountId, purpose, hashToken(token), String(ttlHours)]
    );
    return token;
  }

  private async consumeAccountToken(token: string, purpose: "email_verification" | "password_reset") {
    const result = await this.database.query<{ id: string; account_type: "user" | "counselor" | "admin"; account_id: string }>(
      `UPDATE account_tokens
       SET used_at = now()
       WHERE token_hash = $1
         AND purpose = $2
         AND used_at IS NULL
         AND expires_at > now()
       RETURNING id, account_type, account_id`,
      [hashToken(token), purpose]
    );
    const row = result.rows[0];
    if (!row) {
      throw new BadRequestException("验证码无效或已过期。");
    }
    return { id: row.id, accountType: row.account_type, accountId: row.account_id };
  }

  private async findResetAccount(email: string) {
    const user = await this.database.query<{ id: string }>("SELECT id FROM privacy_user_accounts WHERE email = $1 AND status = 'active'", [email]);
    if (user.rows[0]) {
      return { accountType: "user" as const, accountId: user.rows[0].id };
    }

    const counselor = await this.database.query<{ id: string }>("SELECT id FROM counselor_accounts WHERE work_email = $1", [email]);
    if (counselor.rows[0]) {
      return { accountType: "counselor" as const, accountId: counselor.rows[0].id };
    }

    const admin = await this.database.query<{ id: string }>("SELECT id FROM admin_users WHERE work_email = $1 AND status = 'active'", [email]);
    if (admin.rows[0]) {
      return { accountType: "admin" as const, accountId: admin.rows[0].id };
    }

    return null;
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function exposeDevToken(token: string) {
  return process.env.NODE_ENV === "production" ? undefined : token;
}

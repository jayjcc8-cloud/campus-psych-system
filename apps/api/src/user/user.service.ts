import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createId, createOpaqueToken, hashPassword, hashToken, signAdminToken, verifyPassword } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class UserService {
  constructor(private readonly database: DatabaseService) {}

  async register(input: { email: string; password: string; preferredName?: string }) {
    const email = normalizeEmail(input.email);
    if (!isEmail(email)) {
      throw new BadRequestException("请输入有效邮箱。");
    }

    const existing = await this.database.query<{ id: string }>("SELECT id FROM privacy_user_accounts WHERE email = $1", [email]);
    if (existing.rows[0]) {
      throw new BadRequestException("该邮箱已注册，请直接登录。");
    }

    const result = await this.database.query(
      `INSERT INTO privacy_user_accounts (
         id, email, email_verified, username, preferred_name, password_hash, status, created_at, updated_at, last_login_at
       )
       VALUES (gen_random_uuid(), $1, false, $2, $3, $4, 'active', now(), now(), now())
       RETURNING id, email, email_verified, username, preferred_name, token_version, created_at`,
      [
        email,
        email,
        normalizePreferredName(input.preferredName),
        hashPassword(input.password)
      ]
    );

    const user = mapUser(result.rows[0]);
    const verificationToken = createOpaqueToken("verify");
    await this.database.query(
      `INSERT INTO account_tokens (id, account_type, account_id, purpose, token_hash, expires_at, created_at)
       VALUES ($1, 'user', $2, 'email_verification', $3, now() + interval '24 hours', now())`,
      [createId(), user.id, hashToken(verificationToken)]
    );

    return {
      token: signAdminToken({ sub: user.id, username: user.username, role: "user", userId: user.id, tokenVersion: user.tokenVersion }),
      user,
      devVerificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken
    };
  }

  async login(emailInput: string, password: string) {
    const email = normalizeEmail(emailInput);
    if (!isEmail(email)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }
    const result = await this.database.query<{
      id: string;
      email: string | null;
      email_verified: boolean;
      username: string;
      preferred_name: string;
      password_hash: string;
      status: string;
      token_version: number;
      created_at: string;
    }>(
      `SELECT id, email, email_verified, username, preferred_name, password_hash, status, token_version, created_at
       FROM privacy_user_accounts
       WHERE email = $1`,
      [email]
    );

    const account = result.rows[0];
    if (!account || account.status !== "active" || !verifyPassword(password, account.password_hash)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }

    await this.database.query("UPDATE privacy_user_accounts SET last_login_at = now() WHERE id = $1", [account.id]);

    const user = mapUser(account);
    return {
      token: signAdminToken({ sub: user.id, username: user.username, role: "user", userId: user.id, tokenVersion: user.tokenVersion }),
      user
    };
  }

  async recover(input: { privacyId: string; recoveryPhrase: string; password: string }) {
    void input;
    throw new BadRequestException("账号恢复已切换为邮箱方式，请联系支持中心重设密码。");
  }

  async getMe(userId: string) {
    const result = await this.database.query(
      "SELECT id, email, email_verified, username, preferred_name, token_version, created_at FROM privacy_user_accounts WHERE id = $1 AND status = 'active'",
      [userId]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async assertEmailVerified(userId: string) {
    const result = await this.database.query<{ email_verified: boolean }>(
      "SELECT email_verified FROM privacy_user_accounts WHERE id = $1 AND status = 'active'",
      [userId]
    );
    if (!result.rows[0]?.email_verified) {
      throw new UnauthorizedException("请先完成邮箱验证，再继续提交。");
    }
  }
}

function normalizeEmail(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.toLowerCase() : null;
}

function isEmail(value: string | null) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function maskEmail(value?: string | null) {
  if (!value) return undefined;
  const [name, domain] = value.split("@");
  if (!name || !domain) return undefined;
  return `${name.slice(0, 2)}***@${domain}`;
}

function mapUser(row: any) {
  return {
    id: row.id,
    username: row.username,
    tokenVersion: Number(row.token_version ?? 0),
    email: row.email ?? undefined,
    emailMasked: maskEmail(row.email) ?? "未绑定邮箱",
    emailVerified: Boolean(row.email_verified),
    preferredName: row.preferred_name,
    createdAt: row.created_at
  };
}

function normalizePreferredName(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed || "用户";
}

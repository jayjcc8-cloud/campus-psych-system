import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { hashPassword, signAdminToken, stableHash, verifyPassword } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class UserService {
  constructor(private readonly database: DatabaseService) {}

  async register(input: { password: string; preferredName: string; recoveryEmail?: string }) {
    const privacyId = await this.createUniquePrivacyId();
    const recoveryPhrase = createRecoveryPhrase();

    const result = await this.database.query(
      `INSERT INTO privacy_user_accounts (
         id, privacy_id, username, preferred_name, recovery_email, password_hash, recovery_phrase_hash, status, created_at, updated_at
       )
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'active', now(), now())
       RETURNING id, privacy_id, username, preferred_name, recovery_email, created_at`,
      [
        privacyId,
        privacyId.toLowerCase(),
        input.preferredName.trim(),
        normalizeEmail(input.recoveryEmail),
        hashPassword(input.password),
        hashRecoveryPhrase(recoveryPhrase)
      ]
    );

    const user = mapUser(result.rows[0]);
    return {
      token: signAdminToken({ sub: user.id, username: user.username, role: "user", userId: user.id }),
      user,
      recoveryPhrase
    };
  }

  async login(identifier: string, password: string) {
    const normalized = identifier.trim();
    const result = await this.database.query<{
      id: string;
      privacy_id: string;
      username: string;
      preferred_name: string;
      recovery_email: string | null;
      password_hash: string;
      status: string;
      created_at: string;
    }>(
      `SELECT id, privacy_id, username, preferred_name, recovery_email, password_hash, status, created_at
       FROM privacy_user_accounts
       WHERE privacy_id = $1 OR username = $2`,
      [normalized.toUpperCase(), normalized.toLowerCase()]
    );

    const account = result.rows[0];
    if (!account || account.status !== "active" || !verifyPassword(password, account.password_hash)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }

    const user = mapUser(account);
    return {
      token: signAdminToken({ sub: user.id, username: user.username, role: "user", userId: user.id }),
      user
    };
  }

  async recover(input: { privacyId: string; recoveryPhrase: string; password: string }) {
    const result = await this.database.query<{
      id: string;
      privacy_id: string;
      username: string;
      preferred_name: string;
      recovery_email: string | null;
      recovery_phrase_hash: string | null;
      status: string;
      created_at: string;
    }>(
      `SELECT id, privacy_id, username, preferred_name, recovery_email, recovery_phrase_hash, status, created_at
       FROM privacy_user_accounts
       WHERE privacy_id = $1`,
      [input.privacyId.trim().toUpperCase()]
    );

    const account = result.rows[0];
    if (!account || account.status !== "active" || account.recovery_phrase_hash !== hashRecoveryPhrase(input.recoveryPhrase)) {
      throw new UnauthorizedException("隐私 ID 或恢复短语不正确。");
    }

    const updated = await this.database.query(
      `UPDATE privacy_user_accounts
       SET password_hash = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, privacy_id, username, preferred_name, recovery_email, created_at`,
      [account.id, hashPassword(input.password)]
    );
    const user = mapUser(updated.rows[0]);
    return {
      token: signAdminToken({ sub: user.id, username: user.username, role: "user", userId: user.id }),
      user
    };
  }

  async getMe(userId: string) {
    const result = await this.database.query(
      "SELECT id, privacy_id, username, preferred_name, recovery_email, created_at FROM privacy_user_accounts WHERE id = $1 AND status = 'active'",
      [userId]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  private async createUniquePrivacyId() {
    for (let index = 0; index < 8; index += 1) {
      const candidate = `U-${randomBytes(2).toString("hex").toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
      const existing = await this.database.query<{ id: string }>("SELECT id FROM privacy_user_accounts WHERE privacy_id = $1", [candidate]);
      if (!existing.rows[0]) {
        return candidate;
      }
    }
    throw new BadRequestException("暂时无法创建隐私 ID，请稍后再试。");
  }
}

function normalizeEmail(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.toLowerCase() : null;
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
    privacyId: row.privacy_id,
    username: row.username,
    preferredName: row.preferred_name,
    recoveryEmailMasked: maskEmail(row.recovery_email),
    createdAt: row.created_at
  };
}

const recoveryWords = ["松林", "星河", "微风", "灯塔", "山谷", "清晨", "纸船", "蓝鲸", "月光", "溪流", "云朵", "远山", "竹影", "晴空", "海盐", "橙花"];

function createRecoveryPhrase() {
  return Array.from({ length: 6 }, () => recoveryWords[randomBytes(1)[0] % recoveryWords.length]).join("-");
}

function hashRecoveryPhrase(value: string) {
  return stableHash(value.replace(/\s+/g, "").replace(/－/g, "-").toLowerCase());
}

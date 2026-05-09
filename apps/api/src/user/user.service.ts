import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { SupportRequestStatus } from "@teacher-support/shared";
import {
  createId,
  createOpaqueToken,
  hashPassword,
  hashToken,
  signAdminToken,
  verifyPassword
} from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

const activeStatuses: SupportRequestStatus[] = ["new", "viewed", "noted"];

@Injectable()
export class UserService {
  constructor(private readonly database: DatabaseService) {}

  async register(input: { email: string; password: string; preferredName?: string }) {
    const email = normalizeEmail(input.email);
    if (!isEmail(email)) {
      throw new BadRequestException("请输入有效邮箱。");
    }

    const existing = await this.database.query<{ id: string }>(
      "SELECT id FROM privacy_user_accounts WHERE email = $1",
      [email]
    );
    if (existing.rows[0]) {
      throw new BadRequestException("该邮箱已注册，请直接登录。");
    }

    const result = await this.database.query(
      `INSERT INTO privacy_user_accounts (
         id, email, email_verified, username, preferred_name, password_hash, status, created_at, updated_at, last_login_at
       )
       VALUES (gen_random_uuid(), $1, false, $2, $3, $4, 'active', now(), now(), now())
       RETURNING id, email, email_verified, username, preferred_name, token_version, created_at`,
      [email, email, normalizePreferredName(input.preferredName), hashPassword(input.password)]
    );

    const user = mapUser(result.rows[0]);
    const verificationToken = createOpaqueToken("verify");
    await this.database.query(
      `INSERT INTO account_tokens (id, account_type, account_id, purpose, token_hash, expires_at, created_at)
       VALUES ($1, 'user', $2, 'email_verification', $3, now() + interval '24 hours', now())`,
      [createId(), user.id, hashToken(verificationToken)]
    );

    return {
      token: signAdminToken({
        sub: user.id,
        username: user.username,
        role: "user",
        userId: user.id,
        tokenVersion: user.tokenVersion
      }),
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
      token: signAdminToken({
        sub: user.id,
        username: user.username,
        role: "user",
        userId: user.id,
        tokenVersion: user.tokenVersion
      }),
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

  async listAppointments(userId: string) {
    const result = await this.database.query(
      userAppointmentSelectSql + " WHERE requests.user_id = $1 ORDER BY requests.created_at DESC",
      [userId]
    );
    return result.rows.map(mapAppointment);
  }

  async withdrawAppointment(userId: string, id: string) {
    const current = await this.database.query<{ id: string; status: SupportRequestStatus }>(
      "SELECT id, status FROM support_requests WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    const appointment = current.rows[0];
    if (!appointment) {
      return null;
    }
    if (!activeStatuses.includes(appointment.status)) {
      throw new BadRequestException("这个预约当前不能撤回。");
    }

    await this.database.transaction(async (client) => {
      await client.query(
        "UPDATE support_requests SET status = 'withdrawn', withdrawn_at = now(), updated_at = now() WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      await client.query(
        `INSERT INTO support_request_events (id, request_id, actor_type, actor_id, event_type, detail, created_at)
	         VALUES ($1, $2, 'anonymous_user', $3, 'request.withdrawn', 'User withdrew appointment by account.', now())`,
        [createId(), id, userId]
      );
    });

    const result = await this.database.query(
      userAppointmentSelectSql + " WHERE requests.id = $1 AND requests.user_id = $2",
      [id, userId]
    );
    return result.rows[0] ? mapAppointment(result.rows[0]) : null;
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

const userAppointmentSelectSql = `
SELECT requests.id,
       requests.user_id,
       requests.counselor_id,
       counselors.display_name AS counselor_name,
       requests.slot_id,
       slots.start_time AS slot_start_time,
       slots.end_time AS slot_end_time,
       slots.mode,
       slots.location,
       slots.note,
       requests.preferred_name,
       requests.assessment_id,
       requests.issue_type,
       requests.contact_email,
       requests.contact_note,
       requests.remark,
       requests.status,
       requests.abuse_status,
       assessments.risk_level AS assessment_risk_level,
       requests.created_at,
       requests.updated_at,
       requests.withdrawn_at
FROM support_requests requests
INNER JOIN support_slots slots ON slots.id = requests.slot_id
LEFT JOIN assessments ON assessments.id = requests.assessment_id
LEFT JOIN counselors ON counselors.id = requests.counselor_id
`;

function mapAppointment(row: any) {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    preferredName: row.preferred_name ?? undefined,
    assessmentId: row.assessment_id ?? undefined,
    assessmentRiskLevel: row.assessment_risk_level ?? undefined,
    counselorId: row.counselor_id ?? undefined,
    counselorName: row.counselor_name ?? undefined,
    slotId: row.slot_id,
    slotStartTime: row.slot_start_time,
    slotEndTime: row.slot_end_time,
    mode: row.mode ?? undefined,
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    issueType: row.issue_type,
    contactEmail: row.contact_email ?? undefined,
    contactNote: row.contact_note ?? undefined,
    remark: row.remark ?? undefined,
    status: row.status,
    abuseStatus: row.abuse_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    withdrawnAt: row.withdrawn_at ?? undefined
  };
}

function normalizePreferredName(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed || "用户";
}

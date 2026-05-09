import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { SupportSlotMode } from "@teacher-support/shared";
import { hashPassword, signAdminToken, verifyPassword } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";
import { SupportService } from "../support/support.service.js";

@Injectable()
export class CounselorService {
  constructor(
    private readonly database: DatabaseService,
    private readonly support: SupportService
  ) {}

  async login(emailInput: string, password: string) {
    const email = normalizeEmail(emailInput);
    if (!isEmail(email)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }
    const result = await this.database.query<{
      id: string;
      username: string;
      work_email: string | null;
      password_hash: string;
      status: string;
      token_version: number;
      counselor_id: string;
      display_name: string;
      counselor_status: string;
    }>(
      `SELECT accounts.id,
              accounts.username,
              accounts.work_email,
              accounts.password_hash,
              accounts.status,
              accounts.token_version,
              accounts.counselor_id,
              counselors.display_name,
              counselors.status AS counselor_status
       FROM counselor_accounts accounts
       INNER JOIN counselors ON counselors.id = accounts.counselor_id
       WHERE accounts.work_email = $1`,
      [email]
    );

    const account = result.rows[0];
    if (!account || !verifyPassword(password, account.password_hash)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }
    if (account.status !== "active" || account.counselor_status !== "approved") {
      throw new UnauthorizedException("账号仍在审核中，启用后即可登录。");
    }

    return {
      token: signAdminToken({
        sub: account.id,
        username: account.username,
        role: "counselor",
        counselorId: account.counselor_id,
        tokenVersion: Number(account.token_version ?? 0)
      }),
      user: {
        username: account.username,
        email: account.work_email ?? email,
        role: "counselor",
        counselorId: account.counselor_id,
        displayName: account.display_name
      }
    };
  }

  async register(input: {
    password: string;
    legalName: string;
    staffId: string;
    organization: string;
    workEmail: string;
    displayName: string;
    title: string;
    intro: string;
    specialties: string[];
  }) {
    const workEmail = normalizeEmail(input.workEmail);
    if (!isEmail(workEmail)) {
      throw new BadRequestException("请输入有效工作邮箱。");
    }
    const username = buildUsernameFromEmail(workEmail);
    const existing = await this.database.query<{ id: string }>(
      `SELECT id FROM counselor_accounts WHERE staff_id = $1 AND organization = $2
       UNION
       SELECT id FROM counselor_accounts WHERE work_email = $3
       UNION
       SELECT id FROM counselors WHERE display_name = $4`,
      [input.staffId.trim(), input.organization.trim(), workEmail, input.displayName.trim()]
    );
    if (existing.rows[0]) {
      throw new BadRequestException("工作邮箱、公开称呼或身份信息已经被使用。");
    }

    return this.database.transaction(async (client) => {
      const counselor = await client.query<{ id: string }>(
        `INSERT INTO counselors (id, display_name, title, intro, specialties, status, sort_order, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'pending_review', 100, now(), now())
         RETURNING id`,
        [input.displayName.trim(), input.title.trim(), input.intro.trim(), input.specialties]
      );

      await client.query(
        `INSERT INTO counselor_accounts (
           id, counselor_id, username, password_hash, legal_name, staff_id, organization, work_email, status, created_at, updated_at
         )
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'disabled', now(), now())`,
        [
          counselor.rows[0].id,
          username,
          hashPassword(input.password),
          input.legalName.trim(),
          input.staffId.trim(),
          input.organization.trim(),
          workEmail
        ]
      );

      return {
        status: "pending_review",
        message: "注册申请已提交。中心审核通过后会启用账号。"
      };
    });
  }

  getMe(counselorId: string) {
    return this.support.getCounselor(counselorId);
  }

  async updateMe(counselorId: string, input: { title: string; intro: string; specialties: string[] }) {
    const result = await this.database.query(
      `UPDATE counselors
       SET title = $2,
           intro = $3,
           specialties = $4,
           updated_at = now()
       WHERE id = $1
       RETURNING id, display_name, title, intro, specialties, status, created_at, updated_at`,
      [counselorId, input.title, input.intro, input.specialties]
    );

    return result.rows[0] ? mapCounselor(result.rows[0]) : null;
  }

  async listMySlots(counselorId: string) {
    const result = await this.database.query(
      `SELECT slots.id,
              slots.counselor_id,
              slots.start_time,
              slots.end_time,
              slots.capacity,
              slots.mode,
              slots.location,
              slots.note,
              slots.available,
              slots.deleted_at,
              COUNT(requests.id) FILTER (WHERE requests.status = ANY($2)) AS active_count
       FROM support_slots slots
       LEFT JOIN support_requests requests ON requests.slot_id = slots.id
       WHERE slots.counselor_id = $1
       GROUP BY slots.id
       ORDER BY slots.start_time ASC`,
      [counselorId, ["new", "viewed", "noted"]]
    );
    return result.rows.map(mapSlot);
  }

  createMySlot(
    counselorId: string,
    input: {
      startTime: string;
      endTime: string;
      capacity: number;
      mode?: SupportSlotMode;
      location?: string;
      note?: string;
      available?: boolean;
    }
  ) {
    return this.support.createSlot({ ...input, counselorId });
  }

  updateMySlot(
    counselorId: string,
    id: string,
    input: Partial<{
      startTime: string;
      endTime: string;
      capacity: number;
      mode: SupportSlotMode;
      location: string;
      note: string;
      available: boolean;
    }>
  ) {
    return this.support.updateCounselorSlot(counselorId, id, input);
  }

  deleteMySlot(counselorId: string, id: string) {
    return this.support.deleteCounselorSlot(counselorId, id);
  }

  async listMyRequests(counselorId: string) {
    const result = await this.database.query(
      supportRequestSql + " WHERE requests.counselor_id = $1 ORDER BY requests.created_at DESC",
      [counselorId]
    );
    return result.rows.map(mapRequest);
  }

  async updateMyRequest(counselorId: string, id: string, status: "noted" | "closed") {
    const existing = await this.database.query<{ id: string }>(
      "SELECT id FROM support_requests WHERE id = $1 AND counselor_id = $2",
      [id, counselorId]
    );
    if (!existing.rows[0]) {
      throw new BadRequestException("没有找到这条请求。");
    }

    await this.database.query("UPDATE support_requests SET status = $1, updated_at = now() WHERE id = $2", [
      status,
      id
    ]);
    return this.listMyRequests(counselorId);
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildUsernameFromEmail(email: string) {
  return email
    .replace("@", "-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 64);
}

const supportRequestSql = `
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
       assessments.score_summary AS assessment_score_summary,
       assessments.scale_version AS assessment_scale_version,
       assessments.source_profile AS assessment_source_profile,
       requests.created_at,
       requests.updated_at,
       requests.withdrawn_at
FROM support_requests requests
INNER JOIN support_slots slots ON slots.id = requests.slot_id
LEFT JOIN assessments ON assessments.id = requests.assessment_id
LEFT JOIN counselors ON counselors.id = requests.counselor_id
`;

function mapCounselor(row: any) {
  return {
    id: row.id,
    displayName: row.display_name,
    title: row.title,
    intro: row.intro,
    specialties: row.specialties ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRequest(row: any) {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    preferredName: row.preferred_name ?? undefined,
    assessmentId: row.assessment_id ?? undefined,
    assessmentRiskLevel: row.assessment_risk_level ?? undefined,
    assessmentScoreSummary: normalizeJsonArray(row.assessment_score_summary),
    assessmentScaleVersion: row.assessment_scale_version ?? undefined,
    assessmentSourceProfile: row.assessment_source_profile ?? undefined,
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

function normalizeJsonArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function mapSlot(row: any) {
  return {
    id: row.id,
    counselorId: row.counselor_id ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    mode: row.mode ?? "offline",
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    activeCount: Number(row.active_count ?? 0),
    remainingCapacity: Math.max(Number(row.capacity) - Number(row.active_count ?? 0), 0),
    available: row.available,
    deletedAt: row.deleted_at ?? undefined
  };
}

import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { hashPassword, signAdminToken, verifyPassword } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";
import { SupportService } from "../support/support.service.js";

@Injectable()
export class CounselorService {
  constructor(
    private readonly database: DatabaseService,
    private readonly support: SupportService
  ) {}

  async login(identifier: string, password: string) {
    const normalized = identifier.trim().toLowerCase();
    const result = await this.database.query<{
      id: string;
      username: string;
      password_hash: string;
      status: string;
      counselor_id: string;
      display_name: string;
      counselor_status: string;
    }>(
      `SELECT accounts.id,
              accounts.username,
              accounts.password_hash,
              accounts.status,
              accounts.counselor_id,
              counselors.display_name,
              counselors.status AS counselor_status
       FROM counselor_accounts accounts
       INNER JOIN counselors ON counselors.id = accounts.counselor_id
       WHERE accounts.username = $1 OR accounts.work_email = $1`,
      [normalized]
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
        counselorId: account.counselor_id
      }),
      user: {
        username: account.username,
        role: "counselor",
        counselorId: account.counselor_id,
        displayName: account.display_name
      }
    };
  }

  async register(input: {
    username: string;
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
    const username = input.username.trim().toLowerCase();
    const existing = await this.database.query<{ id: string }>(
      `SELECT id FROM counselor_accounts WHERE username = $1
       UNION
       SELECT id FROM counselor_accounts WHERE staff_id = $3 AND organization = $4
       UNION
       SELECT id FROM counselor_accounts WHERE work_email = $5
       UNION
       SELECT id FROM counselors WHERE display_name = $2`,
      [username, input.displayName.trim(), input.staffId.trim(), input.organization.trim(), input.workEmail.trim().toLowerCase()]
    );
    if (existing.rows[0]) {
      throw new BadRequestException("账号名、公开称呼或身份信息已经被使用。");
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
          input.workEmail.trim().toLowerCase()
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

  listMySlots(counselorId: string) {
    return this.support.listSlots(counselorId);
  }

  createMySlot(counselorId: string, input: { startTime: string; endTime: string; capacity: number; available?: boolean }) {
    return this.support.createSlot({ ...input, counselorId });
  }

  updateMySlot(counselorId: string, id: string, input: Partial<{ startTime: string; endTime: string; capacity: number; available: boolean }>) {
    return this.support.updateCounselorSlot(counselorId, id, input);
  }

  async listMyRequests(counselorId: string) {
    const result = await this.database.query(
      supportRequestSql + " WHERE requests.counselor_id = $1 ORDER BY requests.created_at DESC",
      [counselorId]
    );
    return result.rows.map(mapRequest);
  }

  async updateMyRequest(counselorId: string, id: string, status: "viewed" | "noted" | "closed") {
    const existing = await this.database.query<{ id: string }>(
      "SELECT id FROM support_requests WHERE id = $1 AND counselor_id = $2",
      [id, counselorId]
    );
    if (!existing.rows[0]) {
      throw new BadRequestException("没有找到这条请求。");
    }

    await this.database.query("UPDATE support_requests SET status = $1, updated_at = now() WHERE id = $2", [status, id]);
    return this.listMyRequests(counselorId);
  }
}

const supportRequestSql = `
SELECT requests.id,
       requests.counselor_id,
       counselors.display_name AS counselor_name,
       requests.slot_id,
       slots.start_time AS slot_start_time,
       slots.end_time AS slot_end_time,
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
    preferredName: row.preferred_name ?? undefined,
    assessmentId: row.assessment_id ?? undefined,
    assessmentRiskLevel: row.assessment_risk_level ?? undefined,
    counselorId: row.counselor_id ?? undefined,
    counselorName: row.counselor_name ?? undefined,
    slotId: row.slot_id,
    slotStartTime: row.slot_start_time,
    slotEndTime: row.slot_end_time,
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

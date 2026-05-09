import { Injectable, UnauthorizedException } from "@nestjs/common";
import { signAdminToken, verifyPassword } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async login(emailInput: string, password: string) {
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }
    const result = await this.database.query<{
      id: string;
      username: string;
      work_email: string | null;
      display_name: string;
      password_hash: string;
      role: string;
      status: string;
      token_version: number;
    }>(
      `SELECT id, username, work_email, display_name, password_hash, role, status, token_version
       FROM admin_users
       WHERE work_email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user || user.status !== "active" || !verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException("账号或密码不正确。");
    }

    return {
      token: signAdminToken({
        sub: user.id,
        username: user.username,
        role: user.role,
        tokenVersion: Number(user.token_version ?? 0)
      }),
      user: {
        id: user.id,
        username: user.username,
        email: user.work_email ?? email,
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

  async listCounselorReviews() {
    const result = await this.database.query(
      `SELECT counselors.id,
              accounts.id AS account_id,
              counselors.display_name,
              counselors.title,
              counselors.intro,
              counselors.specialties,
              counselors.status,
              accounts.status AS account_status,
              accounts.legal_name,
              accounts.staff_id,
              accounts.organization,
              accounts.work_email,
              counselors.created_at,
              counselors.updated_at
       FROM counselors
       INNER JOIN counselor_accounts accounts ON accounts.counselor_id = counselors.id
       WHERE counselors.status IN ('pending_review', 'approved', 'suspended')
       ORDER BY counselors.created_at DESC`
    );

    return result.rows.map(mapCounselorReview);
  }

  async reviewCounselor(counselorId: string, decision: "approve" | "reject", reason: string | undefined, adminUserId: string) {
    const nextCounselorStatus = decision === "approve" ? "approved" : "suspended";
    const nextAccountStatus = decision === "approve" ? "active" : "disabled";
    await this.database.transaction(async (client) => {
      await client.query(
        "UPDATE counselors SET status = $2, updated_at = now() WHERE id = $1",
        [counselorId, nextCounselorStatus]
      );
      await client.query(
        "UPDATE counselor_accounts SET status = $2, token_version = token_version + 1, updated_at = now() WHERE counselor_id = $1",
        [counselorId, nextAccountStatus]
      );
      await client.query(
        `INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, detail, created_at)
         VALUES (gen_random_uuid(), $1, 'counselor.review', 'counselor', $2, $3, now())`,
        [adminUserId, counselorId, JSON.stringify({ decision, reason: reason || "" })]
      );
    });
    return this.getCounselorReview(counselorId);
  }

  async updateCounselorStatus(counselorId: string, status: "approved" | "suspended", adminUserId: string) {
    const accountStatus = status === "approved" ? "active" : "disabled";
    await this.database.transaction(async (client) => {
      await client.query("UPDATE counselors SET status = $2, updated_at = now() WHERE id = $1", [counselorId, status]);
      await client.query(
        "UPDATE counselor_accounts SET status = $2, token_version = token_version + 1, updated_at = now() WHERE counselor_id = $1",
        [counselorId, accountStatus]
      );
      await client.query(
        `INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, detail, created_at)
         VALUES (gen_random_uuid(), $1, 'counselor.status.update', 'counselor', $2, $3, now())`,
        [adminUserId, counselorId, status]
      );
    });
    return this.getCounselorReview(counselorId);
  }

  async getDashboard() {
    const requestTotals = await this.database.query<{
      total: string;
      pending: string;
      confirmed: string;
      completed: string;
      today: string;
      high_risk: string;
    }>(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE requests.status IN ('new', 'viewed')) AS pending,
              COUNT(*) FILTER (WHERE requests.status = 'noted') AS confirmed,
              COUNT(*) FILTER (WHERE requests.status = 'closed') AS completed,
              COUNT(*) FILTER (WHERE requests.created_at::date = current_date) AS today,
              COUNT(*) FILTER (WHERE assessments.risk_level = 'high') AS high_risk
       FROM support_requests requests
       LEFT JOIN assessments ON assessments.id = requests.assessment_id`
    );
    const counselorTotals = await this.database.query<{ total: string; pending_review: string }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'approved') AS total,
              COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_review
       FROM counselors`
    );
    const slotTotals = await this.database.query<{ capacity: string | null; active_count: string | null }>(
      `SELECT SUM(slots.capacity) AS capacity,
              COUNT(requests.id) FILTER (WHERE requests.status IN ('new', 'viewed', 'noted')) AS active_count
       FROM support_slots slots
       LEFT JOIN support_requests requests ON requests.slot_id = slots.id
       WHERE slots.start_time > now() - interval '30 days'`
    );
    const trend = await this.database.query<{ date: string; count: string }>(
      `SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
              COUNT(requests.id) AS count
       FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS days(day)
       LEFT JOIN support_requests requests ON requests.created_at::date = days.day::date
       GROUP BY days.day
       ORDER BY days.day ASC`
    );
    const workload = await this.database.query<{ counselor_id: string; counselor_name: string; request_count: string; pending_count: string }>(
      `SELECT counselors.id AS counselor_id,
              counselors.display_name AS counselor_name,
              COUNT(requests.id) AS request_count,
              COUNT(requests.id) FILTER (WHERE requests.status IN ('new', 'viewed')) AS pending_count
       FROM counselors
       LEFT JOIN support_requests requests ON requests.counselor_id = counselors.id
       WHERE counselors.status = 'approved'
       GROUP BY counselors.id
       ORDER BY request_count DESC, counselors.sort_order ASC
       LIMIT 8`
    );
    const risk = await this.database.query<{ low: string; medium: string; high: string }>(
      `SELECT COUNT(*) FILTER (WHERE risk_level = 'low') AS low,
              COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium,
              COUNT(*) FILTER (WHERE risk_level = 'high') AS high
       FROM assessments`
    );
    const recentHighRisk = await this.database.query(
      requestSelectSql + " WHERE assessments.risk_level = 'high' ORDER BY requests.created_at DESC LIMIT 8"
    );

    const totals = requestTotals.rows[0];
    const counselors = counselorTotals.rows[0];
    const slots = slotTotals.rows[0];
    const capacity = Number(slots?.capacity ?? 0);
    const activeCount = Number(slots?.active_count ?? 0);

    return {
      requestTotal: Number(totals?.total ?? 0),
      pendingCount: Number(totals?.pending ?? 0),
      confirmedCount: Number(totals?.confirmed ?? 0),
      completedCount: Number(totals?.completed ?? 0),
      todayCount: Number(totals?.today ?? 0),
      highRiskCount: Number(totals?.high_risk ?? 0),
      counselorCount: Number(counselors?.total ?? 0),
      pendingCounselorReviewCount: Number(counselors?.pending_review ?? 0),
      slotUtilizationPercent: capacity ? Math.round((activeCount / capacity) * 100) : 0,
      requestTrend: trend.rows.map((row) => ({ date: row.date, count: Number(row.count) })),
      counselorWorkload: workload.rows.map((row) => ({
        counselorId: row.counselor_id,
        counselorName: row.counselor_name,
        requestCount: Number(row.request_count),
        pendingCount: Number(row.pending_count)
      })),
      riskDistribution: {
        low: Number(risk.rows[0]?.low ?? 0),
        medium: Number(risk.rows[0]?.medium ?? 0),
        high: Number(risk.rows[0]?.high ?? 0)
      },
      recentHighRisk: recentHighRisk.rows.map(mapRequest)
    };
  }

  private async getCounselorReview(counselorId: string) {
    const result = await this.database.query(
      `SELECT counselors.id,
              accounts.id AS account_id,
              counselors.display_name,
              counselors.title,
              counselors.intro,
              counselors.specialties,
              counselors.status,
              accounts.status AS account_status,
              accounts.legal_name,
              accounts.staff_id,
              accounts.organization,
              accounts.work_email,
              counselors.created_at,
              counselors.updated_at
       FROM counselors
       INNER JOIN counselor_accounts accounts ON accounts.counselor_id = counselors.id
       WHERE counselors.id = $1`,
      [counselorId]
    );
    return result.rows[0] ? mapCounselorReview(result.rows[0]) : null;
  }
}

const requestSelectSql = `
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

function mapCounselorReview(row: any) {
  return {
    id: row.id,
    accountId: row.account_id,
    displayName: row.display_name,
    title: row.title,
    intro: row.intro,
    specialties: row.specialties ?? [],
    status: row.status,
    accountStatus: row.account_status,
    legalName: row.legal_name ?? undefined,
    staffId: row.staff_id ?? undefined,
    organization: row.organization ?? undefined,
    workEmail: row.work_email ?? undefined,
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

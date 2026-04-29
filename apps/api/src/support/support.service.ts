import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { AbuseStatus, SupportIssueType, SupportRequestStatus } from "@teacher-support/shared";
import { normalizeOptional } from "@teacher-support/shared";
import { contentFingerprint, createId, createReceiptCode, hashReceiptCode, stableHash } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";
import type { PoolClient } from "pg";

const activeStatuses: SupportRequestStatus[] = ["new", "viewed", "noted"];

interface CreateRequestInput {
  counselorId: string;
  slotId: string;
  issueType?: SupportIssueType;
  preferredName?: string;
  assessmentId?: string;
  contactEmail?: string;
  contactNote?: string;
  remark?: string;
  anonymousSessionId: string;
  ipAddress: string;
}

@Injectable()
export class SupportService {
  constructor(private readonly database: DatabaseService) {}

  async listCounselors() {
    const result = await this.database.query(
      `SELECT counselors.id,
              counselors.display_name,
              counselors.title,
              counselors.intro,
              counselors.specialties,
              counselors.status,
              counselors.created_at,
              counselors.updated_at,
              MIN(slots.start_time) FILTER (
                WHERE slots.available = true
                  AND slots.start_time > now()
                  AND COALESCE(slot_counts.active_count, 0) < slots.capacity
              ) AS next_available_time
       FROM counselors
       LEFT JOIN support_slots slots ON slots.counselor_id = counselors.id
       LEFT JOIN (
         SELECT slots.id,
                COUNT(requests.id) FILTER (WHERE requests.status = ANY($1)) AS active_count
         FROM support_slots slots
         LEFT JOIN support_requests requests ON requests.slot_id = slots.id
         GROUP BY slots.id
       ) slot_counts ON slot_counts.id = slots.id
       WHERE counselors.status = 'approved'
       GROUP BY counselors.id
       ORDER BY counselors.sort_order ASC, counselors.created_at ASC`,
      [activeStatuses]
    );

    return result.rows.map(mapCounselor);
  }

  async getCounselor(id: string) {
    const result = await this.database.query(
      `SELECT id, display_name, title, intro, specialties, status, created_at, updated_at
       FROM counselors
       WHERE id = $1 AND status = 'approved'`,
      [id]
    );

    return result.rows[0] ? mapCounselor(result.rows[0]) : null;
  }

  async listSlots(counselorId?: string) {
    const params: unknown[] = [activeStatuses];
    const counselorWhere = counselorId ? " AND slots.counselor_id = $2" : "";
    if (counselorId) {
      params.push(counselorId);
    }

    const result = await this.database.query<{
      id: string;
      counselor_id: string;
      counselor_name: string;
      start_time: string;
      end_time: string;
      capacity: number;
      available: boolean;
      active_count: string;
    }>(
      `SELECT slots.id,
              slots.counselor_id,
              counselors.display_name AS counselor_name,
              slots.start_time,
              slots.end_time,
              slots.capacity,
              slots.available,
              COUNT(requests.id) FILTER (WHERE requests.status = ANY($1)) AS active_count
       FROM support_slots slots
       INNER JOIN counselors ON counselors.id = slots.counselor_id AND counselors.status = 'approved'
       LEFT JOIN support_requests requests ON requests.slot_id = slots.id
       WHERE slots.available = true AND slots.start_time > now()${counselorWhere}
       GROUP BY slots.id, counselors.display_name
       ORDER BY slots.start_time ASC`,
      params
    );

    return result.rows
      .map((row) => ({
        id: row.id,
        counselorId: row.counselor_id,
        counselorName: row.counselor_name,
        startTime: row.start_time,
        endTime: row.end_time,
        capacity: row.capacity,
        remainingCapacity: Math.max(row.capacity - Number(row.active_count), 0),
        available: row.available && Number(row.active_count) < row.capacity
      }))
      .filter((slot) => slot.available);
  }

  async listAdminSlots() {
    const result = await this.database.query<{
      id: string;
      counselor_id: string;
      counselor_name: string;
      start_time: string;
      end_time: string;
      capacity: number;
      available: boolean;
      active_count: string;
    }>(
      `SELECT slots.id,
              slots.counselor_id,
              counselors.display_name AS counselor_name,
              slots.start_time,
              slots.end_time,
              slots.capacity,
              slots.available,
              COUNT(requests.id) FILTER (WHERE requests.status = ANY($1)) AS active_count
       FROM support_slots slots
       LEFT JOIN counselors ON counselors.id = slots.counselor_id
       LEFT JOIN support_requests requests ON requests.slot_id = slots.id
       GROUP BY slots.id, counselors.display_name
       ORDER BY slots.start_time DESC`,
      [activeStatuses]
    );

    return result.rows.map((row) => ({
      id: row.id,
      counselorId: row.counselor_id,
      counselorName: row.counselor_name,
      startTime: row.start_time,
      endTime: row.end_time,
      capacity: row.capacity,
      activeCount: Number(row.active_count),
      remainingCapacity: Math.max(row.capacity - Number(row.active_count), 0),
      available: row.available
    }));
  }

  async createRequest(input: CreateRequestInput) {
    const anonymousSessionHash = stableHash(input.anonymousSessionId);
    const ipHash = stableHash(input.ipAddress);
    const normalizedPreferredName = normalizeOptional(input.preferredName);
    const normalizedRemark = normalizeOptional(input.remark);
    const normalizedEmail = normalizeOptional(input.contactEmail);
    const normalizedContactNote = normalizeOptional(input.contactNote);
    const normalizedIssueType = input.issueType ?? "other";
    const fingerprint = contentFingerprint(`${input.counselorId}:${input.slotId}:${normalizedIssueType}:${normalizedRemark ?? ""}`);

    await this.assertRateLimit({ anonymousSessionHash, ipHash, fingerprint });

    const receiptCode = createReceiptCode();
    const receiptCodeHash = hashReceiptCode(receiptCode);
    const requestId = createId();

    await this.database.transaction(async (client) => {
      if (input.assessmentId) {
        const assessment = await client.query<{ id: string }>(
          "SELECT id FROM assessments WHERE id = $1 AND anonymous_session_hash = $2",
          [input.assessmentId, anonymousSessionHash]
        );
        if (!assessment.rows[0]) {
          throw new BadRequestException("测评结果暂时无法关联，请重新提交测评后再试。");
        }
      }

      const slot = await client.query<{ capacity: number; active_count: string }>(
        `SELECT slots.capacity,
                COUNT(requests.id) FILTER (WHERE requests.status = ANY($2)) AS active_count
         FROM support_slots slots
         INNER JOIN counselors ON counselors.id = slots.counselor_id AND counselors.status = 'approved'
         LEFT JOIN support_requests requests ON requests.slot_id = slots.id
         WHERE slots.id = $1
           AND slots.counselor_id = $3
           AND slots.available = true
           AND slots.start_time > now()
         GROUP BY slots.id`,
        [input.slotId, activeStatuses, input.counselorId]
      );

      if (!slot.rows[0]) {
        throw new BadRequestException("这个时段暂时不可选择，请换一个时间。");
      }

      if (Number(slot.rows[0].active_count) >= slot.rows[0].capacity) {
        throw new BadRequestException("这个时段已经满了，请换一个时间。");
      }

      await client.query(
        `INSERT INTO support_requests (
          id, receipt_code_hash, anonymous_session_hash, ip_hash, preferred_name, assessment_id, counselor_id, slot_id, issue_type,
          contact_email, contact_note, remark, status, abuse_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'new', 'clean', now(), now())`,
        [
          requestId,
          receiptCodeHash,
          anonymousSessionHash,
          ipHash,
          normalizedPreferredName ?? null,
          input.assessmentId ?? null,
          input.counselorId,
          input.slotId,
          normalizedIssueType,
          normalizedEmail ?? null,
          normalizedContactNote ?? null,
          normalizedRemark ?? null
        ]
      );

      await client.query(
        `INSERT INTO support_request_events (id, request_id, actor_type, event_type, detail, created_at)
         VALUES ($1, $2, 'anonymous_user', 'request.created', $3, now())`,
        [createId(), requestId, fingerprint]
      );
    });

    return {
      id: requestId,
      receiptCode,
      status: "new" as const
    };
  }

  async getByReceiptCode(receiptCode: string) {
    const result = await this.database.query(
      requestSelectSql + " WHERE requests.receipt_code_hash = $1",
      [hashReceiptCode(receiptCode)]
    );

    return result.rows[0] ? mapRequest(result.rows[0]) : null;
  }

  async withdraw(receiptCode: string) {
    const receiptHash = hashReceiptCode(receiptCode);
    const result = await this.database.query<{ id: string; status: SupportRequestStatus }>(
      "SELECT id, status FROM support_requests WHERE receipt_code_hash = $1",
      [receiptHash]
    );
    const request = result.rows[0];

    if (!request) {
      return null;
    }

    if (!activeStatuses.includes(request.status)) {
      throw new BadRequestException("这个请求当前不能撤回。");
    }

    await this.database.transaction(async (client) => {
      await client.query(
        "UPDATE support_requests SET status = 'withdrawn', withdrawn_at = now(), updated_at = now() WHERE id = $1",
        [request.id]
      );
      await client.query(
        `INSERT INTO support_request_events (id, request_id, actor_type, event_type, detail, created_at)
         VALUES ($1, $2, 'anonymous_user', 'request.withdrawn', 'User withdrew request by receipt code.', now())`,
        [createId(), request.id]
      );
    });

    return this.getByReceiptCode(receiptCode);
  }

  async listAdminRequests(status?: string) {
    const params: unknown[] = [];
    const where = status ? " WHERE requests.status = $1" : "";
    if (status) {
      params.push(status);
    }

    const result = await this.database.query(requestSelectSql + where + " ORDER BY requests.created_at DESC", params);
    return result.rows.map(mapRequest);
  }

  async updateAdminRequest(id: string, status: "viewed" | "noted" | "closed" | "spam", adminUserId: string) {
    const abuseStatus: AbuseStatus = status === "spam" ? "spam" : "clean";

    await this.database.transaction(async (client) => {
      await client.query(
        "UPDATE support_requests SET status = $1, abuse_status = $2, updated_at = now() WHERE id = $3",
        [status, abuseStatus, id]
      );
      await client.query(
        `INSERT INTO support_request_events (id, request_id, actor_type, actor_id, event_type, detail, created_at)
         VALUES ($1, $2, 'center_staff', $3, 'request.status.updated', $4, now())`,
        [createId(), id, adminUserId, status]
      );
      await client.query(
        `INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, detail, created_at)
         VALUES ($1, $2, 'support_request.update', 'support_request', $3, $4, now())`,
        [createId(), adminUserId, id, status]
      );
    });

    const result = await this.database.query(requestSelectSql + " WHERE requests.id = $1", [id]);
    return result.rows[0] ? mapRequest(result.rows[0]) : null;
  }

  async createSlot(
    input: { counselorId?: string; startTime: string; endTime: string; capacity: number; available?: boolean },
    adminUserId?: string
  ) {
    this.assertSlotTime(input.startTime, input.endTime);

    const id = createId();
    return this.database.transaction(async (client) => {
      const counselorId = input.counselorId ?? (await this.getDefaultCounselorId(client));
      const result = await client.query(
        `INSERT INTO support_slots (id, counselor_id, start_time, end_time, capacity, available, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now(), now())
         RETURNING id, counselor_id, start_time, end_time, capacity, available`,
        [id, counselorId, input.startTime, input.endTime, input.capacity, input.available ?? true]
      );

      if (adminUserId) {
        await client.query(
          `INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, detail, created_at)
           VALUES ($1, $2, 'support_slot.create', 'support_slot', $3, $4, now())`,
          [createId(), adminUserId, id, JSON.stringify(input)]
        );
      }

      return mapSlot(result.rows[0]);
    });
  }

  async updateSlot(
    id: string,
    input: Partial<{ startTime: string; endTime: string; capacity: number; available: boolean }>,
    adminUserId?: string
  ) {
    const current = await this.database.query("SELECT * FROM support_slots WHERE id = $1", [id]);
    if (!current.rows[0]) {
      return null;
    }

    const nextStartTime = input.startTime ?? current.rows[0].start_time;
    const nextEndTime = input.endTime ?? current.rows[0].end_time;
    this.assertSlotTime(nextStartTime, nextEndTime);

    return this.database.transaction(async (client) => {
      const result = await client.query(
        `UPDATE support_slots
         SET start_time = COALESCE($2, start_time),
             end_time = COALESCE($3, end_time),
             capacity = COALESCE($4, capacity),
             available = COALESCE($5, available),
             updated_at = now()
         WHERE id = $1
         RETURNING id, start_time, end_time, capacity, available`,
        [id, input.startTime ?? null, input.endTime ?? null, input.capacity ?? null, input.available ?? null]
      );

      if (adminUserId) {
        await client.query(
          `INSERT INTO audit_logs (id, admin_user_id, action, target_type, target_id, detail, created_at)
           VALUES ($1, $2, 'support_slot.update', 'support_slot', $3, $4, now())`,
          [createId(), adminUserId, id, JSON.stringify(input)]
        );
      }

      return mapSlot(result.rows[0]);
    });
  }

  async updateCounselorSlot(
    counselorId: string,
    id: string,
    input: Partial<{ startTime: string; endTime: string; capacity: number; available: boolean }>
  ) {
    const current = await this.database.query("SELECT * FROM support_slots WHERE id = $1 AND counselor_id = $2", [id, counselorId]);
    if (!current.rows[0]) {
      return null;
    }

    const nextStartTime = input.startTime ?? current.rows[0].start_time;
    const nextEndTime = input.endTime ?? current.rows[0].end_time;
    this.assertSlotTime(nextStartTime, nextEndTime);

    const result = await this.database.query(
      `UPDATE support_slots
       SET start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           capacity = COALESCE($5, capacity),
           available = COALESCE($6, available),
           updated_at = now()
       WHERE id = $1 AND counselor_id = $2
       RETURNING id, counselor_id, start_time, end_time, capacity, available`,
      [id, counselorId, input.startTime ?? null, input.endTime ?? null, input.capacity ?? null, input.available ?? null]
    );

    return result.rows[0] ? mapSlot(result.rows[0]) : null;
  }

  async listEvents(requestId: string) {
    const result = await this.database.query(
      `SELECT id, actor_type, actor_id, event_type, detail, created_at
       FROM support_request_events
       WHERE request_id = $1
       ORDER BY created_at ASC`,
      [requestId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      actorType: row.actor_type,
      actorId: row.actor_id,
      eventType: row.event_type,
      detail: row.detail,
      createdAt: row.created_at
    }));
  }

  private async assertRateLimit(input: { anonymousSessionHash: string; ipHash: string; fingerprint: string }) {
    const sessionCount = await this.database.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM support_requests WHERE anonymous_session_hash = $1 AND created_at > now() - interval '1 hour'",
      [input.anonymousSessionHash]
    );
    if (Number(sessionCount.rows[0]?.count ?? 0) >= 3) {
      throw new HttpException("我们已经收到你的请求，请稍后再试。", HttpStatus.TOO_MANY_REQUESTS);
    }

    const ipCount = await this.database.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM support_requests WHERE ip_hash = $1 AND created_at > now() - interval '1 hour'",
      [input.ipHash]
    );
    if (Number(ipCount.rows[0]?.count ?? 0) >= 10) {
      throw new HttpException("当前提交较频繁，请稍后再试。", HttpStatus.TOO_MANY_REQUESTS);
    }

    const duplicate = await this.database.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM support_request_events
       WHERE event_type = 'request.created'
         AND detail = $1
         AND created_at > now() - interval '10 minutes'`,
      [input.fingerprint]
    );
    if (Number(duplicate.rows[0]?.count ?? 0) > 0) {
      throw new HttpException("相似请求已经收到，请不必重复提交。", HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private assertSlotTime(startTime: string, endTime: string) {
    if (new Date(startTime).getTime() >= new Date(endTime).getTime()) {
      throw new BadRequestException("结束时间需要晚于开始时间。");
    }
  }

  private async getDefaultCounselorId(client: PoolClient) {
    const result = await client.query<{ id: string }>(
      "SELECT id FROM counselors WHERE status = 'approved' ORDER BY sort_order ASC, created_at ASC LIMIT 1"
    );
    const counselorId = result.rows[0]?.id;
    if (!counselorId) {
      throw new BadRequestException("当前没有可用咨询师，请先完成咨询师资料配置。");
    }
    return counselorId;
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

function mapSlot(row: any) {
  return {
    id: row.id,
    counselorId: row.counselor_id ?? undefined,
    counselorName: row.counselor_name ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    available: row.available
  };
}

function mapCounselor(row: any) {
  return {
    id: row.id,
    displayName: row.display_name,
    title: row.title,
    intro: row.intro,
    specialties: row.specialties ?? [],
    status: row.status,
    nextAvailableTime: row.next_available_time ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

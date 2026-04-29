import { BadRequestException, Injectable } from "@nestjs/common";
import {
  assessmentQuestions,
  assessmentRiskLabels,
  type AssessmentRiskLevel
} from "@teacher-support/shared";
import { createId, createReceiptCode, hashReceiptCode, stableHash } from "../common/security.js";
import { DatabaseService } from "../database/database.service.js";

interface CreateAssessmentInput {
  preferredName?: string;
  answers: Record<string, number>;
  anonymousSessionId: string;
}

@Injectable()
export class AssessmentService {
  constructor(private readonly database: DatabaseService) {}

  async createAssessment(input: CreateAssessmentInput) {
    this.assertAnswers(input.answers);

    const anonymousSessionHash = stableHash(input.anonymousSessionId);
    const receiptCode = createReceiptCode();
    const id = createId();
    const summary = summarizeAssessment(input.answers);

    await this.database.query(
      `INSERT INTO assessments (
        id, receipt_code_hash, anonymous_session_hash, preferred_name,
        who5_score, phq9_score, gad7_score,
        wellbeing_level, depression_level, anxiety_level, risk_level, safety_flag, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())`,
      [
        id,
        hashReceiptCode(receiptCode),
        anonymousSessionHash,
        input.preferredName?.trim() || null,
        summary.who5Score,
        summary.phq9Score,
        summary.gad7Score,
        summary.wellbeingLevel,
        summary.depressionLevel,
        summary.anxietyLevel,
        summary.riskLevel,
        summary.safetyFlag
      ]
    );

    return {
      id,
      receiptCode,
      preferredName: input.preferredName?.trim() || undefined,
      ...summary,
      riskLabel: assessmentRiskLabels[summary.riskLevel],
      createdAt: new Date().toISOString()
    };
  }

  async getByReceiptCode(receiptCode: string) {
    const result = await this.database.query(
      `SELECT id, preferred_name, who5_score, phq9_score, gad7_score,
              wellbeing_level, depression_level, anxiety_level, risk_level, safety_flag, created_at
       FROM assessments
       WHERE receipt_code_hash = $1`,
      [hashReceiptCode(receiptCode)]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      preferredName: row.preferred_name ?? undefined,
      who5Score: row.who5_score,
      phq9Score: row.phq9_score,
      gad7Score: row.gad7_score,
      wellbeingLevel: row.wellbeing_level,
      depressionLevel: row.depression_level,
      anxietyLevel: row.anxiety_level,
      riskLevel: row.risk_level,
      safetyFlag: row.safety_flag,
      riskLabel: assessmentRiskLabels[row.risk_level as AssessmentRiskLevel],
      createdAt: row.created_at
    };
  }

  async getAdminStats() {
    const totals = await this.database.query<{
      total_count: string;
      high_risk_count: string;
      medium_risk_count: string;
    }>(
      `SELECT COUNT(*) AS total_count,
              COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk_count,
              COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_risk_count
       FROM assessments`
    );

    const recent = await this.database.query(
      `SELECT id, preferred_name, who5_score, phq9_score, gad7_score,
              wellbeing_level, depression_level, anxiety_level, risk_level, safety_flag, created_at
       FROM assessments
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return {
      totalCount: Number(totals.rows[0]?.total_count ?? 0),
      highRiskCount: Number(totals.rows[0]?.high_risk_count ?? 0),
      mediumRiskCount: Number(totals.rows[0]?.medium_risk_count ?? 0),
      recent: recent.rows.map((row) => ({
        id: row.id,
        preferredName: row.preferred_name ?? undefined,
        who5Score: row.who5_score,
        phq9Score: row.phq9_score,
        gad7Score: row.gad7_score,
        wellbeingLevel: row.wellbeing_level,
        depressionLevel: row.depression_level,
        anxietyLevel: row.anxiety_level,
        riskLevel: row.risk_level,
        safetyFlag: row.safety_flag,
        createdAt: row.created_at
      }))
    };
  }

  private assertAnswers(answers: Record<string, number>) {
    for (const question of assessmentQuestions) {
      if (!Object.prototype.hasOwnProperty.call(answers, question.id)) {
        throw new BadRequestException("请完成全部测评题目后再提交。");
      }
    }
  }
}

function summarizeAssessment(answers: Record<string, number>) {
  const who5Score = sumByPrefix(answers, "who5_") * 4;
  const phq9Score = sumByPrefix(answers, "phq9_");
  const gad7Score = sumByPrefix(answers, "gad7_");
  const selfHarmScore = answers.phq9_9 ?? 0;

  const wellbeingLevel =
    who5Score <= 28 ? "整体状态偏低，建议尽快给自己留出支持空间。" : who5Score <= 50 ? "整体状态有些吃力，建议持续留意。" : "整体状态暂时稳定。";
  const depressionLevel =
    phq9Score >= 20
      ? "抑郁相关困扰较重，建议尽快寻求专业支持。"
      : phq9Score >= 10
        ? "抑郁相关困扰已有一定累积，建议主动获得支持。"
        : "抑郁相关困扰暂未达到较高水平。";
  const anxietyLevel =
    gad7Score >= 15
      ? "焦虑相关困扰较重，建议尽快获得支持。"
      : gad7Score >= 10
        ? "焦虑相关困扰较明显，建议留意并及时支持自己。"
        : "焦虑相关困扰暂未达到较高水平。";

  const riskLevel: AssessmentRiskLevel =
    selfHarmScore >= 1 || phq9Score >= 20 || gad7Score >= 15 || who5Score <= 20
      ? "high"
      : phq9Score >= 10 || gad7Score >= 10 || who5Score <= 40
        ? "medium"
        : "low";

  return {
    who5Score,
    phq9Score,
    gad7Score,
    wellbeingLevel,
    depressionLevel,
    anxietyLevel,
    riskLevel,
    safetyFlag: selfHarmScore >= 1
  };
}

function sumByPrefix(answers: Record<string, number>, prefix: string) {
  return Object.entries(answers)
    .filter(([key]) => key.startsWith(prefix))
    .reduce((total, [, value]) => total + value, 0);
}

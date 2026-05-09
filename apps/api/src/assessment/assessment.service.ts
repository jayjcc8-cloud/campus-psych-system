import { BadRequestException, Injectable } from "@nestjs/common";
import {
  assessmentCatalogVersion,
  assessmentQuestions,
  assessmentRiskLabels,
  assessmentScaleDefinitions,
  assessmentSourceProfile,
  type AssessmentScaleId,
  type AssessmentScaleScore,
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
        scale_version, source_profile, score_summary, recommendations,
        who5_score, phq9_score, gad7_score,
        wellbeing_level, depression_level, anxiety_level, risk_level, safety_flag, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16, now())`,
      [
        id,
        hashReceiptCode(receiptCode),
        anonymousSessionHash,
        input.preferredName?.trim() || null,
        summary.scaleVersion,
        summary.sourceProfile,
        JSON.stringify(summary.scoreSummary),
        JSON.stringify(summary.recommendations),
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
      `SELECT id, preferred_name, scale_version, source_profile, score_summary, recommendations,
              who5_score, phq9_score, gad7_score,
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
      scaleVersion: row.scale_version ?? assessmentCatalogVersion,
      sourceProfile: row.source_profile ?? assessmentSourceProfile,
      scoreSummary: normalizeJsonArray<AssessmentScaleScore>(row.score_summary),
      recommendations: normalizeJsonArray<string>(row.recommendations),
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
      low_risk_count: string;
    }>(
      `SELECT COUNT(*) AS total_count,
              COUNT(*) FILTER (WHERE risk_level = 'high') AS high_risk_count,
              COUNT(*) FILTER (WHERE risk_level = 'medium') AS medium_risk_count,
              COUNT(*) FILTER (WHERE risk_level = 'low') AS low_risk_count
       FROM assessments`
    );

    const recent = await this.database.query(
      `SELECT id, preferred_name, scale_version, source_profile, score_summary, recommendations,
              who5_score, phq9_score, gad7_score,
              wellbeing_level, depression_level, anxiety_level, risk_level, safety_flag, created_at
       FROM assessments
       ORDER BY created_at DESC
       LIMIT 20`
    );
    const averages = await this.database.query<{
      who5_raw: string | null;
      who5_normalized: string | null;
      phq9_raw: string | null;
      phq9_normalized: string | null;
      gad7_raw: string | null;
      gad7_normalized: string | null;
      sample_count: string;
    }>(
      `SELECT AVG(who5_score / 4.0) AS who5_raw,
              AVG(who5_score) AS who5_normalized,
              AVG(phq9_score) AS phq9_raw,
              AVG((phq9_score / 27.0) * 100) AS phq9_normalized,
              AVG(gad7_score) AS gad7_raw,
              AVG((gad7_score / 21.0) * 100) AS gad7_normalized,
              COUNT(*) AS sample_count
       FROM assessments`
    );
    const averageRow = averages.rows[0];
    const sampleCount = Number(averageRow?.sample_count ?? 0);

    return {
      totalCount: Number(totals.rows[0]?.total_count ?? 0),
      highRiskCount: Number(totals.rows[0]?.high_risk_count ?? 0),
      mediumRiskCount: Number(totals.rows[0]?.medium_risk_count ?? 0),
      riskDistribution: {
        low: Number(totals.rows[0]?.low_risk_count ?? 0),
        medium: Number(totals.rows[0]?.medium_risk_count ?? 0),
        high: Number(totals.rows[0]?.high_risk_count ?? 0)
      },
      averageScores: buildAverageScores(averageRow, sampleCount),
      scaleVersion: assessmentCatalogVersion,
      sourceProfile: assessmentSourceProfile,
      recent: recent.rows.map((row) => ({
        id: row.id,
        preferredName: row.preferred_name ?? undefined,
        scaleVersion: row.scale_version ?? assessmentCatalogVersion,
        sourceProfile: row.source_profile ?? assessmentSourceProfile,
        scoreSummary: normalizeJsonArray<AssessmentScaleScore>(row.score_summary),
        recommendations: normalizeJsonArray<string>(row.recommendations),
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

function buildAverageScores(
  row:
    | {
        who5_raw: string | null;
        who5_normalized: string | null;
        phq9_raw: string | null;
        phq9_normalized: string | null;
        gad7_raw: string | null;
        gad7_normalized: string | null;
      }
    | undefined,
  sampleCount: number
) {
  if (!row || sampleCount === 0) {
    return [];
  }

  return [
    buildScaleScore("who5", Math.round(Number(row.who5_raw ?? 0)), Math.round(Number(row.who5_normalized ?? 0))),
    buildScaleScore("phq9", Math.round(Number(row.phq9_raw ?? 0)), Math.round(Number(row.phq9_normalized ?? 0))),
    buildScaleScore("gad7", Math.round(Number(row.gad7_raw ?? 0)), Math.round(Number(row.gad7_normalized ?? 0)))
  ];
}

function summarizeAssessment(answers: Record<string, number>) {
  const who5RawScore = sumByPrefix(answers, "who5_");
  const phq9Score = sumByPrefix(answers, "phq9_");
  const gad7Score = sumByPrefix(answers, "gad7_");
  const who5Score = who5RawScore * 4;
  const selfHarmScore = answers.phq9_9 ?? 0;
  const scoreSummary: AssessmentScaleScore[] = [
    buildScaleScore("who5", who5RawScore, who5Score),
    buildScaleScore("phq9", phq9Score),
    buildScaleScore("gad7", gad7Score)
  ];

  const wellbeingLevel = scoreSummary[0].interpretation;
  const depressionLevel = scoreSummary[1].interpretation;
  const anxietyLevel = scoreSummary[2].interpretation;

  const riskLevel: AssessmentRiskLevel =
    selfHarmScore >= 1 || phq9Score >= 20 || gad7Score >= 15 || who5Score <= 20
      ? "high"
      : phq9Score >= 10 || gad7Score >= 10 || who5Score <= 40
        ? "medium"
        : "low";
  const recommendations = buildRecommendations(riskLevel, Boolean(selfHarmScore >= 1), scoreSummary);

  return {
    scaleVersion: assessmentCatalogVersion,
    sourceProfile: assessmentSourceProfile,
    scoreSummary,
    recommendations,
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

function buildScaleScore(scale: AssessmentScaleId, rawScore: number, normalizedOverride?: number): AssessmentScaleScore {
  const definition = assessmentScaleDefinitions[scale];
  const maxScore = definition.rawScoreRange[1];
  const normalizedScore = normalizedOverride ?? Math.round((rawScore / maxScore) * 100);
  const scoreForBand = scale === "who5" ? normalizedScore : rawScore;
  const band = definition.bands.find((item) => scoreForBand >= item.min && scoreForBand <= item.max) ?? definition.bands[definition.bands.length - 1];

  return {
    scale,
    label: definition.label,
    rawScore,
    normalizedScore,
    maxScore,
    bandKey: band.key,
    bandLabel: band.label,
    interpretation: band.interpretation,
    recommendation: band.recommendation
  };
}

function buildRecommendations(riskLevel: AssessmentRiskLevel, safetyFlag: boolean, scores: AssessmentScaleScore[]) {
  const recommendations = new Set<string>();

  if (safetyFlag) {
    recommendations.add("如果此刻担心自己的安全，请优先联系可信赖的人或紧急支持资源。");
  }

  if (riskLevel === "high") {
    recommendations.add("建议尽快预约咨询师或联系专业支持资源，不必等到状态进一步加重。");
  } else if (riskLevel === "medium") {
    recommendations.add("建议在近期安排一次支持，帮助自己梳理压力来源和可用资源。");
  } else {
    recommendations.add("目前未提示明显高风险，可以把本次结果作为近期状态基线。");
  }

  for (const score of scores) {
    if (["low", "very_low", "moderate", "moderately_severe", "severe"].includes(score.bandKey)) {
      recommendations.add(score.recommendation);
    }
  }

  recommendations.add("本结果是筛查参考，不作为医学诊断；如有持续困扰，请联系专业人员进一步评估。");
  return Array.from(recommendations).slice(0, 5);
}

function normalizeJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function sumByPrefix(answers: Record<string, number>, prefix: string) {
  return Object.entries(answers)
    .filter(([key]) => key.startsWith(prefix))
    .reduce((total, [, value]) => total + value, 0);
}

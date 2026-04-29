import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { createAssessmentSchema } from "@teacher-support/shared";
import type { Request } from "express";
import { getAnonymousSessionId } from "../common/request-context.js";
import { AssessmentService } from "./assessment.service.js";

@Controller("assessments")
export class AssessmentController {
  constructor(private readonly assessments: AssessmentService) {}

  @Post()
  createAssessment(@Body() body: unknown, @Req() request: Request) {
    const payload = createAssessmentSchema.parse(body);
    return this.assessments.createAssessment({
      ...payload,
      preferredName: payload.preferredName || undefined,
      anonymousSessionId: getAnonymousSessionId(request)
    });
  }

  @Get(":receiptCode")
  getAssessment(@Param("receiptCode") receiptCode: string) {
    return this.assessments.getByReceiptCode(receiptCode);
  }
}

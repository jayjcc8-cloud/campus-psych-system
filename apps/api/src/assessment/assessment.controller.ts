import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { createAssessmentSchema } from "@teacher-support/shared";
import type { Request } from "express";
import { getAnonymousSessionId } from "../common/request-context.js";
import { UserAuthGuard, type UserRequest } from "../user/user-auth.guard.js";
import { UserService } from "../user/user.service.js";
import { AssessmentService } from "./assessment.service.js";

@Controller("assessments")
export class AssessmentController {
  constructor(
    private readonly assessments: AssessmentService,
    private readonly users: UserService
  ) {}

  @Post()
  @UseGuards(UserAuthGuard)
  async createAssessment(@Body() body: unknown, @Req() request: UserRequest & Request) {
    const payload = createAssessmentSchema.parse(body);
    await this.users.assertEmailVerified(request.user!.userId!);
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

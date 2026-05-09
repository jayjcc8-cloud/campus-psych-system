import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  adminLoginSchema,
  counselorReviewSchema,
  counselorStatusUpdateSchema,
  createSupportSlotSchema,
  updateSupportRequestSchema,
  updateSupportSlotSchema
} from "@teacher-support/shared";
import { AssessmentService } from "../assessment/assessment.service.js";
import { SupportService } from "../support/support.service.js";
import { AdminAuthGuard, type AdminRequest } from "./admin-auth.guard.js";
import { AdminService } from "./admin.service.js";

@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly assessments: AssessmentService,
    private readonly support: SupportService
  ) {}

  @Post("auth/login")
  login(@Body() body: unknown) {
    const payload = adminLoginSchema.parse(body);
    return this.admin.login(payload.email, payload.password);
  }

  @Get("dashboard")
  @UseGuards(AdminAuthGuard)
  dashboard() {
    return this.admin.getDashboard();
  }

  @Get("counselors/reviews")
  @UseGuards(AdminAuthGuard)
  listCounselorReviews() {
    return this.admin.listCounselorReviews();
  }

  @Patch("counselors/:id/review")
  @UseGuards(AdminAuthGuard)
  reviewCounselor(@Param("id") id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    const payload = counselorReviewSchema.parse(body);
    return this.admin.reviewCounselor(id, payload.decision, payload.reason || undefined, request.admin!.sub);
  }

  @Patch("counselors/:id/status")
  @UseGuards(AdminAuthGuard)
  updateCounselorStatus(@Param("id") id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    const payload = counselorStatusUpdateSchema.parse(body);
    return this.admin.updateCounselorStatus(id, payload.status, request.admin!.sub);
  }

  @Get("support-requests")
  @UseGuards(AdminAuthGuard)
  listRequests() {
    return this.support.listAdminRequests();
  }

  @Patch("support-requests/:id")
  @UseGuards(AdminAuthGuard)
  updateRequest(@Param("id") id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    const payload = updateSupportRequestSchema.parse(body);
    return this.support.updateAdminRequest(id, payload.status, request.admin!.sub);
  }

  @Get("support-requests/:id/events")
  @UseGuards(AdminAuthGuard)
  listEvents(@Param("id") id: string) {
    return this.support.listEvents(id);
  }

  @Post("support-slots")
  @UseGuards(AdminAuthGuard)
  createSlot(@Body() body: unknown, @Req() request: AdminRequest) {
    const payload = createSupportSlotSchema.parse(body);
    return this.support.createSlot(payload, request.admin!.sub);
  }

  @Get("support-slots")
  @UseGuards(AdminAuthGuard)
  listSlots() {
    return this.support.listAdminSlots();
  }

  @Patch("support-slots/:id")
  @UseGuards(AdminAuthGuard)
  updateSlot(@Param("id") id: string, @Body() body: unknown, @Req() request: AdminRequest) {
    const payload = updateSupportSlotSchema.parse(body);
    return this.support.updateSlot(id, payload, request.admin!.sub);
  }

  @Delete("support-slots/:id")
  @UseGuards(AdminAuthGuard)
  deleteSlot(@Param("id") id: string, @Req() request: AdminRequest) {
    return this.support.deleteSlot(id, request.admin!.sub);
  }

  @Get("audit-logs")
  @UseGuards(AdminAuthGuard)
  listAuditLogs() {
    return this.admin.listAuditLogs();
  }

  @Get("assessment-stats")
  @UseGuards(AdminAuthGuard)
  listAssessmentStats() {
    return this.assessments.getAdminStats();
  }
}

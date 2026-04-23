import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  adminLoginSchema,
  createSupportSlotSchema,
  updateSupportRequestSchema,
  updateSupportSlotSchema
} from "@teacher-support/shared";
import { SupportService } from "../support/support.service.js";
import { AdminAuthGuard, type AdminRequest } from "./admin-auth.guard.js";
import { AdminService } from "./admin.service.js";

@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly support: SupportService
  ) {}

  @Post("auth/login")
  login(@Body() body: unknown) {
    const payload = adminLoginSchema.parse(body);
    return this.admin.login(payload.username, payload.password);
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

  @Get("audit-logs")
  @UseGuards(AdminAuthGuard)
  listAuditLogs() {
    return this.admin.listAuditLogs();
  }
}

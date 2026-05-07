import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { createSupportRequestSchema } from "@teacher-support/shared";
import type { Request } from "express";
import { getAnonymousSessionId, getIpAddress } from "../common/request-context.js";
import { UserAuthGuard } from "../user/user-auth.guard.js";
import { SupportService } from "./support.service.js";

@Controller("support")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get("slots")
  listSlots() {
    return this.support.listSlots();
  }

  @Get("counselors")
  listCounselors() {
    return this.support.listCounselors();
  }

  @Get("counselors/:id")
  getCounselor(@Param("id") id: string) {
    return this.support.getCounselor(id);
  }

  @Get("counselors/:id/slots")
  listCounselorSlots(@Param("id") id: string) {
    return this.support.listSlots(id);
  }

  @Post("requests")
  @UseGuards(UserAuthGuard)
  createRequest(@Body() body: unknown, @Req() request: Request) {
    const payload = createSupportRequestSchema.parse(body);
    return this.support.createRequest({
      ...payload,
      contactEmail: payload.contactEmail || undefined,
      contactNote: payload.contactNote || undefined,
      remark: payload.remark || undefined,
      anonymousSessionId: getAnonymousSessionId(request),
      ipAddress: getIpAddress(request)
    });
  }

  @Get("requests/:receiptCode")
  getRequest(@Param("receiptCode") receiptCode: string) {
    return this.support.getByReceiptCode(receiptCode);
  }

  @Patch("requests/:receiptCode/withdraw")
  withdraw(@Param("receiptCode") receiptCode: string) {
    return this.support.withdraw(receiptCode);
  }
}

import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  counselorLoginSchema,
  createSupportSlotSchema,
  updateCounselorProfileSchema,
  updateSupportRequestSchema,
  updateSupportSlotSchema
} from "@teacher-support/shared";
import { CounselorAuthGuard, type CounselorRequest } from "./counselor-auth.guard.js";
import { CounselorService } from "./counselor.service.js";

@Controller("counselor")
export class CounselorController {
  constructor(private readonly counselor: CounselorService) {}

  @Post("auth/login")
  login(@Body() body: unknown) {
    const payload = counselorLoginSchema.parse(body);
    return this.counselor.login(payload.username, payload.password);
  }

  @Get("me")
  @UseGuards(CounselorAuthGuard)
  getMe(@Req() request: CounselorRequest) {
    return this.counselor.getMe(request.counselor!.counselorId!);
  }

  @Patch("me")
  @UseGuards(CounselorAuthGuard)
  updateMe(@Req() request: CounselorRequest, @Body() body: unknown) {
    const payload = updateCounselorProfileSchema.parse(body);
    return this.counselor.updateMe(request.counselor!.counselorId!, payload);
  }

  @Get("slots")
  @UseGuards(CounselorAuthGuard)
  listSlots(@Req() request: CounselorRequest) {
    return this.counselor.listMySlots(request.counselor!.counselorId!);
  }

  @Post("slots")
  @UseGuards(CounselorAuthGuard)
  createSlot(@Req() request: CounselorRequest, @Body() body: unknown) {
    const payload = createSupportSlotSchema.omit({ counselorId: true }).parse(body);
    return this.counselor.createMySlot(request.counselor!.counselorId!, payload);
  }

  @Patch("slots/:id")
  @UseGuards(CounselorAuthGuard)
  updateSlot(@Req() request: CounselorRequest, @Param("id") id: string, @Body() body: unknown) {
    const payload = updateSupportSlotSchema.omit({ counselorId: true }).parse(body);
    return this.counselor.updateMySlot(request.counselor!.counselorId!, id, payload);
  }

  @Get("support-requests")
  @UseGuards(CounselorAuthGuard)
  listRequests(@Req() request: CounselorRequest) {
    return this.counselor.listMyRequests(request.counselor!.counselorId!);
  }

  @Patch("support-requests/:id")
  @UseGuards(CounselorAuthGuard)
  updateRequest(@Req() request: CounselorRequest, @Param("id") id: string, @Body() body: unknown) {
    const payload = updateSupportRequestSchema.parse(body);
    if (payload.status === "spam") {
      throw new BadRequestException("咨询师端不能标记垃圾请求。");
    }
    return this.counselor.updateMyRequest(request.counselor!.counselorId!, id, payload.status);
  }
}

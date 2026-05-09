import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  counselorRegisterSchema,
  counselorLoginSchema,
  createCounselorSupportSlotSchema,
  updateCounselorProfileSchema,
  updateCounselorSupportSlotSchema,
  updateSupportRequestSchema
} from "@teacher-support/shared";
import { CounselorAuthGuard, type CounselorRequest } from "./counselor-auth.guard.js";
import { CounselorService } from "./counselor.service.js";

@Controller("counselor")
export class CounselorController {
  constructor(private readonly counselor: CounselorService) {}

  @Post("auth/login")
  login(@Body() body: unknown) {
    const payload = counselorLoginSchema.parse(body);
    return this.counselor.login(payload.email, payload.password);
  }

  @Post("auth/register")
  register(@Body() body: unknown) {
    const payload = counselorRegisterSchema.parse(body);
    return this.counselor.register(payload);
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
    const payload = createCounselorSupportSlotSchema.parse(body);
    return this.counselor.createMySlot(request.counselor!.counselorId!, payload);
  }

  @Patch("slots/:id")
  @UseGuards(CounselorAuthGuard)
  updateSlot(@Req() request: CounselorRequest, @Param("id") id: string, @Body() body: unknown) {
    const payload = updateCounselorSupportSlotSchema.parse(body);
    return this.counselor.updateMySlot(request.counselor!.counselorId!, id, payload);
  }

  @Delete("slots/:id")
  @UseGuards(CounselorAuthGuard)
  deleteSlot(@Req() request: CounselorRequest, @Param("id") id: string) {
    return this.counselor.deleteMySlot(request.counselor!.counselorId!, id);
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
    if (payload.status === "spam" || payload.status === "viewed") {
      throw new BadRequestException("咨询师端只支持确认或完成预约。");
    }
    return this.counselor.updateMyRequest(request.counselor!.counselorId!, id, payload.status);
  }
}

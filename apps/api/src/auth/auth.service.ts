import { Injectable, UnauthorizedException } from "@nestjs/common";
import { CounselorService } from "../counselor/counselor.service.js";
import { UserService } from "../user/user.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly counselors: CounselorService
  ) {}

  async login(identifier: string, password: string) {
    const normalized = identifier.trim();

    if (normalized.toUpperCase().startsWith("U-")) {
      const result = await this.users.login(normalized, password);
      return { token: result.token, role: "user" as const, profile: result.user };
    }

    try {
      const result = await this.counselors.login(normalized, password);
      return { token: result.token, role: "counselor" as const, profile: result.user };
    } catch (counselorError) {
      try {
        const result = await this.users.login(normalized, password);
        return { token: result.token, role: "user" as const, profile: result.user };
      } catch {
        if (counselorError instanceof UnauthorizedException && counselorError.message.includes("审核")) {
          throw counselorError;
        }
        throw new UnauthorizedException("账号或密码不正确。");
      }
    }
  }
}

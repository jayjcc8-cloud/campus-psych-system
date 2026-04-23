import type { Request } from "express";

export function getAnonymousSessionId(request: Request) {
  const value = request.header("x-anonymous-session-id")?.trim();
  return value && value.length >= 12 ? value : "missing-anonymous-session";
}

export function getIpAddress(request: Request) {
  const forwarded = request.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.ip || request.socket.remoteAddress || "unknown-ip";
}

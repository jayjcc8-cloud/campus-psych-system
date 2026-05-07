import { createHash, createHmac, pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

const hashSecret = process.env.HASH_SECRET ?? "local-anonymous-hash-secret";
const tokenSecret = process.env.ADMIN_TOKEN_SECRET ?? "local-admin-token-secret";

export function stableHash(value: string) {
  return createHmac("sha256", hashSecret).update(value).digest("hex");
}

export function contentFingerprint(value: string) {
  return createHash("sha256").update(value.trim().replace(/\s+/g, " ").toLowerCase()).digest("hex");
}

export function createReceiptCode() {
  const raw = randomBytes(6).toString("hex").toUpperCase();
  return `TS-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function hashReceiptCode(code: string) {
  return stableHash(code.replace(/\s+/g, "").toUpperCase());
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$120000$${salt}$${digest}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterationsText, salt, digest] = encoded.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !salt || !digest) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, Number(iterationsText), 32, "sha256");
  const stored = Buffer.from(digest, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}

export interface AdminTokenPayload {
  sub: string;
  username: string;
  role: string;
  counselorId?: string;
  userId?: string;
  exp: number;
}

export function signAdminToken(payload: Omit<AdminTokenPayload, "exp">) {
  const body: AdminTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  };
  const encoded = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const signature = createHmac("sha256", tokenSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = createHmac("sha256", tokenSecret).update(encoded).digest("base64url");
  if (expected !== signature) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminTokenPayload;
  return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
}

export function createId() {
  return randomUUID();
}

const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";
const unique = Date.now();
const userEmail = `smoke-user-${unique}@example.com`;
const counselorEmail = `smoke-counselor-${unique}@example.com`;
const userPassword = "User@123456";
const counselorPassword = "Counselor@123456";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "center-admin@local.test";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD ?? "Admin@123456";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-anonymous-session-id": `smoke-session-${unique}`,
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

function allAnswers(value = 0) {
  return Object.fromEntries([
    ...Array.from({ length: 5 }, (_, index) => [`who5_${index + 1}`, value]),
    ...Array.from({ length: 9 }, (_, index) => [`phq9_${index + 1}`, value]),
    ...Array.from({ length: 7 }, (_, index) => [`gad7_${index + 1}`, value])
  ]);
}

async function main() {
  await request("/health");

  const adminLogin = await request("/admin/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });

  const userRegister = await request("/user/auth/register", {
    method: "POST",
    body: { email: userEmail, password: userPassword, preferredName: "Smoke User" }
  });
  if (!userRegister.devVerificationToken) {
    throw new Error("devVerificationToken missing in non-production smoke run");
  }
  await request("/auth/email-verification/confirm", {
    method: "POST",
    body: { token: userRegister.devVerificationToken }
  });
  const userLogin = await request("/auth/login", {
    method: "POST",
    body: { identifier: userEmail, password: userPassword }
  });

  const assessment = await request("/assessments", {
    method: "POST",
    token: userLogin.token,
    body: { preferredName: "Smoke User", answers: allAnswers(1) }
  });
  await request(`/assessments/${encodeURIComponent(assessment.receiptCode)}`);

  const counselors = await request("/support/counselors");
  if (!counselors.length) {
    throw new Error("No approved counselor available for smoke request");
  }
  const slots = await request(`/support/counselors/${encodeURIComponent(counselors[0].id)}/slots`);
  if (!slots.length) {
    throw new Error("No slot available for smoke request");
  }
  const supportRequest = await request("/support/requests", {
    method: "POST",
    token: userLogin.token,
    body: {
      counselorId: counselors[0].id,
      slotId: slots[0].id,
      preferredName: "Smoke User",
      assessmentId: assessment.id,
      remark: `Smoke预约-${unique}`
    }
  });
  if (!supportRequest.id || supportRequest.receiptCode) {
    throw new Error("Support request should return account appointment id without user-facing receiptCode");
  }
  const appointments = await request("/user/appointments", { token: userLogin.token });
  if (!appointments.find((item) => item.id === supportRequest.id)) {
    throw new Error("Created appointment missing from user appointments");
  }

  await request("/counselor/auth/register", {
    method: "POST",
    body: {
      password: counselorPassword,
      legalName: "Smoke Counselor",
      staffId: `SMOKE-${unique}`,
      organization: "Smoke Org",
      workEmail: counselorEmail,
      displayName: `Smoke咨询师${unique}`,
      title: "心理咨询师",
      intro: "用于集成测试的咨询师申请资料，审核后验证登录流程。",
      specialties: ["压力支持"]
    }
  });
  const reviews = await request("/admin/counselors/reviews", { token: adminLogin.token });
  const reviewTarget = reviews.find((item) => item.workEmail === counselorEmail);
  if (!reviewTarget) {
    throw new Error("Counselor review target missing");
  }
  await request(`/admin/counselors/${reviewTarget.id}/review`, {
    method: "PATCH",
    token: adminLogin.token,
    body: { decision: "approve", reason: "Smoke approved" }
  });
  const counselorLogin = await request("/auth/login", {
    method: "POST",
    body: { identifier: counselorEmail, password: counselorPassword }
  });
  if (counselorLogin.role !== "counselor") {
    throw new Error("Counselor login did not return counselor role");
  }

  await request("/admin/dashboard", { token: adminLogin.token });
  await request("/admin/assessment-stats", { token: adminLogin.token });
  await request("/auth/logout", { method: "POST", token: userLogin.token });

  console.log("integration smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

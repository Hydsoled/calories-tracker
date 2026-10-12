import assert from "node:assert/strict";
import { test } from "node:test";
import { loginSchema, registerSchema, emailSchema, passwordSchema } from "../lib/validations/auth.ts";
import { safeAuthDestination } from "../lib/validations/auth-redirect.ts";
test("registration validates email and enforces password boundaries", () => {
    assert.equal(registerSchema.safeParse({ email: "reader@example.com", password: "12345678" }).success, true);
    for (const data of [{ email: "bad", password: "12345678" }, { email: "reader@example.com", password: "short" }, { email: "reader@example.com", password: "a".repeat(129) }])
        assert.equal(registerSchema.safeParse(data).success, false);
});
test("login accepts existing shorter passwords but rejects empty passwords", () => {
    assert.equal(loginSchema.safeParse({ email: "reader@example.com", password: "short" }).success, true);
    assert.equal(loginSchema.safeParse({ email: "reader@example.com", password: "" }).success, false);
});
test("recovery and new password have independent validation", () => {
    assert.equal(emailSchema.safeParse({ email: "reader@example.com" }).success, true);
    assert.equal(passwordSchema.safeParse({ password: "new-pass-123" }).success, true);
    assert.equal(passwordSchema.safeParse({ password: "" }).success, false);
});
test("callback redirects are restricted to supported local auth destinations", () => {
    assert.equal(safeAuthDestination("/reset-password"), "/reset-password");
    for (const input of [null, "https://evil.example", "//evil.example", "/\\evil.example", "/reset-password?next=https://evil.example", "/settings"])
        assert.equal(safeAuthDestination(input), "/dashboard");
});

test("signup diagnostics keep credentials and raw provider messages private", async () => {
  const { describeSignupError, signupDiagnostic } = await import("../lib/validations/signup-error.ts");
  const error = { code: "unexpected_failure", status: 500, message: "Database error saving user private@example.com" };
  assert.deepEqual(signupDiagnostic(error), { code: "unexpected_failure", status: 500, category: "database" });
  assert.equal(describeSignupError(error).includes("private@example.com"), false);
  assert.equal(describeSignupError({ message: "Email rejected", code: "email_address_not_authorized" }).includes("Confirmation emails"), true);
  assert.equal(describeSignupError({ message: "Limit", code: "over_email_send_rate_limit" }).includes("Please wait"), true);
});

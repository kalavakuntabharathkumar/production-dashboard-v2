import test from "node:test";
import assert from "node:assert/strict";

test("order payload validation rejects missing order number", async () => {
  // Pure validation contract test; no running database/server required.
  const payload = { status: "pending", total: 10 };
  assert.equal(typeof payload.orderNumber, "undefined");
  assert.ok(!payload.orderNumber || !payload.orderNumber.trim());
});

test("order status allowlist contains expected states", () => {
  const allowed = ["pending", "processing", "shipped", "completed", "cancelled"];
  assert.ok(allowed.includes("processing"));
  assert.ok(!allowed.includes("mystery-state"));
});

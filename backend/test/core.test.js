import test from "node:test";
import assert from "node:assert/strict";
import {
  categorize,
  computeRiskScore,
  isProfileComplete,
} from "../src/services/riskService.js";
import { buildPlan } from "../src/services/planService.js";
import {
  createAuthToken,
  requireAuth,
} from "../src/services/authToken.js";
import { connectDB } from "../src/config/db.js";

test("risk scoring increases with horizon and volatility comfort", () => {
  const conservative = computeRiskScore({
    horizonYears: 3,
    monthlyIncome: 100000,
    monthlyInvestable: 10000,
    fearTolerance: "low",
    lifeStage: "family",
  });
  const growth = computeRiskScore({
    horizonYears: 25,
    monthlyIncome: 100000,
    monthlyInvestable: 50000,
    fearTolerance: "high",
    lifeStage: "early career",
  });

  assert.ok(growth > conservative);
  assert.equal(categorize(conservative), "Conservative");
});

test("profile completeness requires goals and all core fields", () => {
  assert.equal(isProfileComplete({ goals: ["Retirement"] }), false);
  assert.equal(
    isProfileComplete({
      goals: ["Retirement"],
      horizonYears: 25,
      monthlyIncome: 100000,
      monthlyInvestable: 30000,
      fearTolerance: "high",
      lifeStage: "family",
    }),
    true,
  );
});

test("emergency plans protect liquidity and avoid equity", () => {
  const plan = buildPlan({
    goals: ["Emergency fund"],
    horizonYears: 2,
    monthlyIncome: 100000,
    monthlyInvestable: 20000,
    fearTolerance: "low",
    lifeStage: "family",
  });

  const equity = plan.allocation.find((item) => /equity/i.test(item.asset));
  const liquid = plan.allocation.find((item) => /liquid|cash/i.test(item.asset));
  assert.equal(equity?.percent || 0, 0);
  assert.ok((liquid?.percent || 0) >= 70);
  assert.equal(plan.allocation.reduce((sum, item) => sum + item.percent, 0), 100);
});

test("auth tokens are accepted through bearer authentication", () => {
  const token = createAuthToken("person@example.com");
  const request = { headers: { authorization: `Bearer ${token}` } };
  const response = {
    status() {
      return this;
    },
    json() {
      return this;
    },
  };
  requireAuth(request, response, () => {});
  assert.equal(request.auth.email, "person@example.com");
});

test("production refuses to start without MongoDB", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  await assert.rejects(connectDB(""), /MONGODB_URI must be set/);
  if (previous === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previous;
});

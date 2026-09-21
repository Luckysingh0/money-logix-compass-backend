import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { computeRiskScore, categorize } from "./riskService.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const portfolios = JSON.parse(
  readFileSync(join(__dirname, "../data/portfolios.json"), "utf-8"),
);

const DISCLAIMER =
  "This is educational guidance, not registered financial advice. Mutual fund investments " +
  "are subject to market risks. The SIP return assumption used here is illustrative and not guaranteed. " +
  "Please read all scheme-related documents carefully.";

function pickTemplate(riskScore) {
  return (
    portfolios.templates.find(
      (t) => riskScore >= t.riskRange[0] && riskScore <= t.riskRange[1],
    ) || portfolios.templates[1]
  );
}

/**
 * Build a personalized plan object from a risk profile.
 * @param {object} profile RiskProfile-like object
 * @returns {object} plan payload (matches Plan schema)
 */
export function buildPlan(profile) {
  const riskScore = profile.riskScore ?? computeRiskScore(profile);
  const category = profile.riskCategory ?? categorize(riskScore);
  const template = pickTemplate(riskScore);

  const monthlySIP = Number(profile.monthlyInvestable) || 0;
  const horizon = Number(profile.horizonYears) || 10;

  // Illustrative SIP projection only: this is a planning assumption, not a forecast.
  const r = 0.11 / 12;
  const n = horizon * 12;
  const fv =
    monthlySIP > 0
      ? monthlySIP * (((Math.pow(1 + r, n) - 1) / r) * (1 + r))
      : 0;

  const milestones = buildMilestones(profile, horizon, monthlySIP, fv);

  return {
    conversationId: profile.conversationId,
    templateId: template.id,
    templateName: template.name,
    tagline: template.tagline,
    expectedReturn: template.expectedReturn,
    monthlySIP,
    allocation: template.allocation,
    milestones,
    riskScore,
    riskCategory: category,
    disclaimer: DISCLAIMER,
  };
}

function buildMilestones(profile, horizon, sip, fv) {
  const ms = [];
  if (sip > 0) {
    ms.push({
      label: `Start a ₹${sip.toLocaleString("en-IN")}/mo SIP`,
      targetAmount: sip,
      targetYear: new Date().getFullYear(),
      done: false,
    });
    ms.push({
      label: "Consider a 6-month emergency fund buffer as a separate goal",
      targetAmount: (profile.monthlyIncome || sip * 3) * 6,
      targetYear: new Date().getFullYear() + 1,
      done: false,
    });
  }
  const mid = Math.max(1, Math.round(horizon / 2));
  ms.push({
    label: `Mid-way review at year ${mid} — rebalance allocation`,
    targetYear: new Date().getFullYear() + mid,
    done: false,
  });
  ms.push({
    label: `Goal corpus ≈ ₹${Math.round(fv).toLocaleString("en-IN")} by year ${horizon}`,
    targetAmount: Math.round(fv),
    targetYear: new Date().getFullYear() + horizon,
    done: false,
  });
  return ms;
}

export function listTemplates() {
  return portfolios.templates;
}

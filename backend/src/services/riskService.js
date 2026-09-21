// Rule-based risk scoring (0-100). Pure config-driven, no ML.
// Inputs come from the progressively-built RiskProfile.

const FEAR_SCORE = { low: 30, medium: 15, high: 0 }; // low fear -> can take more risk

/**
 * Compute a 0-100 risk score from a profile.
 * Higher score = higher risk capacity/appetite.
 */
export function computeRiskScore(profile) {
  let score = 0;

  // Horizon: longer horizon -> more risk capacity (max 40 pts).
  const horizon = Number(profile.horizonYears) || 0;
  if (horizon >= 20) score += 40;
  else if (horizon >= 10) score += 30;
  else if (horizon >= 5) score += 18;
  else if (horizon >= 3) score += 10;
  else score += 4;

  // Fear tolerance (max 30 pts) — note: low fear adds the most.
  score += FEAR_SCORE[profile.fearTolerance] ?? 12;

  // Investable ratio: how much of income is investable (max 20 pts).
  const income = Number(profile.monthlyIncome) || 0;
  const investable = Number(profile.monthlyInvestable) || 0;
  if (income > 0 && investable > 0) {
    const ratio = investable / income;
    if (ratio >= 0.4) score += 20;
    else if (ratio >= 0.25) score += 14;
    else if (ratio >= 0.15) score += 9;
    else score += 4;
  } else {
    score += 6;
  }

  // Life stage nudge (max ~10 pts).
  const stage = (profile.lifeStage || "").toLowerCase();
  if (/student|early|young|20s/.test(stage)) score += 10;
  else if (/family|mid|30s|40s/.test(stage)) score += 5;
  else if (/retire|senior|60/.test(stage)) score += 0;
  else score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function categorize(score) {
  if (score <= 30) return "Conservative";
  if (score <= 55) return "Balanced";
  if (score <= 80) return "Aggressive";
  return "Growth";
}

/** Whether we have enough to compute a meaningful score & build a plan. */
export function isProfileComplete(profile) {
  return Boolean(
    profile &&
    profile.horizonYears != null &&
    profile.monthlyIncome != null &&
    profile.monthlyInvestable != null &&
    profile.fearTolerance != null &&
    profile.lifeStage != null &&
    (profile.goals?.length || 0) > 0,
  );
}

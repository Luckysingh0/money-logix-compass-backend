// Deterministic emotion / panic safety-net.
// This layer runs INDEPENDENTLY of the LLM. If clear distress language appears,
// panic mode is force-triggered no matter what the model returns. This guarantees
// the flagship feature works on demo day.
//
// The keyword/regex lexicons below are compiled from publicly documented sources
// of investor-distress and FOMO vocabulary, including:
//   - NRC Emotion Lexicon (fear / sadness / anger word families)
//   - LIWC-style anxiety & negative-affect terms
//   - Loughran-McDonald financial sentiment dictionary (negative / uncertainty)
//   - Behavioural-finance "panic selling" & "FOMO trading" glossaries
//   - Common retail-investor forum slang (Reddit r/IndiaInvestments, WSB, etc.)
// They are grouped by theme so teammates can extend any single category easily.

// ── PANIC: urge to exit / dump positions ───────────────────────────────
const PANIC_EXIT = [
  /\bsell (everything|it all|all of it|now|today|immediately|right now)\b/i,
  /\bdump (everything|it all|my (stocks?|shares?|holdings?|portfolio))\b/i,
  /\bpull (out|everything|my money|the plug)\b/i,
  /\bwithdraw (everything|it all|all my money|now)\b/i,
  /\bcash (out|everything)( now)?\b/i,
  /\bexit (everything|all|now|my positions?)\b/i,
  /\bliquidate (everything|all|my portfolio)\b/i,
  /\bget me out\b/i,
  /\bget out (now|while i can)\b/i,
  /\bstop the bleeding\b/i,
  /\bbail (out|on (everything|this))\b/i,
  /\bbook (my )?loss(es)?\b/i,
  /\bcut my losses\b/i,
];

// ── PANIC: fear / anxiety / dread ──────────────────────────────────────
const PANIC_FEAR = [
  /\bi('?m| am) panicking\b/i,
  /\bi('?m| am) (in a )?panic\b/i,
  /\bi('?m| am) freaking out\b/i,
  /\bi('?m| am) (so )?(scared|terrified|frightened|petrified)\b/i,
  /\bi('?m| am) (really |so |very )?(anxious|nervous|worried|stressed)\b/i,
  /\bi('?m| am) (so )?(afraid|fearful)\b/i,
  /\bfreaking out\b/i,
  /\bscared to death\b/i,
  /\bsick to my stomach\b/i,
  /\bheart (is )?(racing|pounding)\b/i,
  /\bhaving a (panic attack|breakdown|meltdown)\b/i,
  /\bi (can'?t|cannot) (do|handle|deal with) this\b/i,
  /\bso much anxiety\b/i,
  /\bfilled with (dread|fear)\b/i,
];

// ── PANIC: despair / loss / ruin ───────────────────────────────────────
const PANIC_DESPAIR = [
  /\blost (it all|everything|all my (money|savings))\b/i,
  /\blosing (everything|it all|all my money)\b/i,
  /\beverything is gone\b/i,
  /\b(it'?s |i'?m )?(all )?gone\b/i,
  /\bwiped out\b/i,
  /\bruined\b/i,
  /\bi('?m| am) (financially )?(ruined|broke|destroyed|finished)\b/i,
  /\bi('?m| am) (so )?(hopeless|helpless|devastated|crushed)\b/i,
  /\bgive up\b/i,
  /\bgiving up\b/i,
  /\bno (hope|point|future)\b/i,
  /\bmy life (savings|is over)\b/i,
  /\bi(’|'| ha)?ve lost everything\b/i,
  /\bdown (50|60|70|80|90|100)%/i,
  /\bin the red\b/i,
  /\bbleeding money\b/i,
];

// ── PANIC: market crash / collapse ─────────────────────────────────────
const PANIC_MARKET = [
  /\b(?:market|stocks?|portfolio|investments?)(?:\s+is)?\s+(?:crashing|crash(?:ing)?|tanking|plummeting|melting down|falling apart)\b/i,
  /\b(?:market|stocks?|portfolio|investments?)\s+(?:collapse|collapsing|bloodbath)\b/i,
  /\b(?:i'?m|we'?re|it'?s)\s+(?:down|losing|bleeding)\s+(?:50|60|70|80|90|100)%\b/i,
  /\b(?:market|index|portfolio)\s+(?:free[- ]?fall|nosedive|panic)\b/i,
  /\b(?:sell|exit|get out|dump)\s+(?:everything|all|my holdings?|my shares?)\b/i,
  /\b(?:i'?m|we'?re)\s+on\s+the\s+brink\b/i,
  /\b(?:stock|market|portfolio)\s+is\s+(?:crashing|collapsing|melting down|tanking)\b/i,
  /\b(?:economic|market)\s+(?:recession|depression)\b/i,
];

// ── PANIC: physical / sleep / overwhelm ────────────────────────────────
const PANIC_HEALTH = [
  /\bcan'?t sleep\b/i,
  /\bcan'?t eat\b/i,
  /\bcan'?t (take|stand|bear) (it|this)( anymore)?\b/i,
  /\bcan'?t breathe\b/i,
  /\bcan'?t stop (checking|worrying|thinking)\b/i,
  /\bup all night\b/i,
  /\blosing sleep\b/i,
  /\bcrying\b/i,
  /\bi('?m| am) (overwhelmed|breaking down)\b/i,
  /\bmaking me (sick|ill)\b/i,
];

const PANIC_PATTERNS = [
  ...PANIC_EXIT,
  ...PANIC_FEAR,
  ...PANIC_DESPAIR,
  ...PANIC_MARKET,
  ...PANIC_HEALTH,
];

// ── FOMO: greed / hype / impulsive buying ──────────────────────────────
const FOMO_PATTERNS = [
  /\ball in\b/i,
  /\bgo(ing)? all in\b/i,
  /\bput (everything|it all|my (whole|entire) )?(in|into)\b/i,
  /\binvest everything\b/i,
  /\bbet (it all|everything|the house)\b/i,
  /\bmax out\b/i,
  /\byolo\b/i,
  /\bbefore it'?s too late\b/i,
  /\bmiss(ing)? out\b/i,
  /\bfomo\b/i,
  /\bcan'?t miss (this|out)?\b/i,
  /\bdon'?t want to miss\b/i,
  /\bguaranteed (returns?|profit|money|gains?)\b/i,
  /\bsure ?(thing|shot)\b/i,
  /\bzero risk\b/i,
  /\bno (way it|chance to) los(e|ing)\b/i,
  /\bto the moon\b/i,
  /\bmoon(ing|shot)\b/i,
  /\bnext (bitcoin|tesla|10x|100x|multibagger)\b/i,
  /\b(?:10x|100x|10 ?x|hundred ?x)\b/i,
  /\bmultibagger\b/i,
  /\bget rich (quick|fast)\b/i,
  /\beveryone(’|'| i)?s? (is )?buying\b/i,
  /\beveryone is (making|getting) (money|rich)\b/i,
  /\bdouble my money\b/i,
  /\btriple my money\b/i,
  /\bquick (money|buck|profit|gains?)\b/i,
  /\bhot (tip|stock|pick)\b/i,
  /\b(?:stock|market|coin|sector|index).*?(?:pumps?|pump(?:ing)?)\b/i,
  /\b(?:stock|market|coin|sector|index).*?(?:rocket(?:s|ed)?|rocketing)\b/i,
  /\b(?:i want to|let'?s|should i|can i|we should).*\b(?:buy the dip|buy the dip now)\b/i,
  /\b(?:i|we)\s+(?:must|need to|should|can)\s+buy\s+(?:now|today|immediately)\b/i,
  /\bcan'?t lose\b/i,
];

/**
 * @param {string} text user message
 * @returns {{ panic: boolean, fomo: boolean, matched: string[] }}
 */
export function scanEmotionSafetyNet(text) {
  if (!text || typeof text !== "string") {
    return { panic: false, fomo: false, matched: [] };
  }
  const matched = [];
  let panic = false;
  let fomo = false;

  for (const re of PANIC_PATTERNS) {
    if (re.test(text)) {
      panic = true;
      matched.push(re.source);
    }
  }
  for (const re of FOMO_PATTERNS) {
    if (re.test(text)) {
      fomo = true;
      matched.push(re.source);
    }
  }
  return { panic, fomo, matched };
}

/**
 * Combine the deterministic scan with the LLM's own judgement.
 * @param {string} userText
 * @param {object} llmResult  parsed LLM output
 */
export function resolvePanic(userText, llmResult) {
  const net = scanEmotionSafetyNet(userText);
  const llmPanic =
    llmResult?.detected_emotion === "panic" ||
    llmResult?.risk_signal === "high";

  const panicMode = net.panic || llmPanic;
  let triggeredBy = null;
  if (net.panic && llmPanic) triggeredBy = "both";
  else if (net.panic) triggeredBy = "safety-net";
  else if (llmPanic) triggeredBy = "llm";

  return {
    panicMode,
    fomo: net.fomo,
    triggeredBy,
    matched: net.matched,
  };
}

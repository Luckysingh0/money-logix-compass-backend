import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { compactShort as compact } from "../utils/formatters.js";

// Minimal professional line icons (stroke = currentColor).
const Icon = ({ name }) => {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "chat":
      return (
        <svg {...p}>
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-4-1L3 21l1.9-5A8.5 8.5 0 1 1 21 11.5Z" />
        </svg>
      );
    case "plan":
      return (
        <svg {...p}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...p}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "coin":
      return (
        <svg {...p} width="26" height="26">
          <circle cx="12" cy="12" r="9" />
          <path d="M14.8 9.3a3 3 0 0 0-2.8-1.8c-1.7 0-3 1-3 2.4 0 3 5.6 1.6 5.6 4.6 0 1.4-1.3 2.5-3 2.5a3 3 0 0 1-2.9-2" />
          <path d="M12 6v1.5M12 16.5V18" />
        </svg>
      );
    default:
      return null;
  }
};

const FEATURES = [
  {
    icon: "chat",
    title: "Talks like a friend",
    text: "No jargon, no judgement. Just a warm conversation about your money and goals.",
  },
  {
    icon: "plan",
    title: "A plan made for you",
    text: "Answer a few natural questions and get a personalized, risk-aware investment plan.",
  },
  {
    icon: "sliders",
    title: "Simulate & explore",
    text: "Drag sliders across sectors to see how your money could grow over time.",
  },
  {
    icon: "shield",
    title: "Calm in the chaos",
    text: "When markets get scary, NiveshMitra helps you avoid panic decisions.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Talk",
    text: "Chat naturally about your goals, income and how you feel about risk.",
  },
  {
    n: "02",
    title: "Understand",
    text: "We read your words and emotions to build an honest risk profile.",
  },
  {
    n: "03",
    title: "Plan",
    text: "Get an educational portfolio template with SIP examples and milestones.",
  },
  {
    n: "04",
    title: "Stay calm",
    text: "Panic-aware coaching keeps you on track when markets swing.",
  },
];

const STATS = [
  { value: "4", label: "Personalized risk profiles" },
  { value: "100%", label: "Conversational onboarding" },
  { value: "0", label: "Jargon, ever" },
  { value: "Anytime", label: "Calm-mode guidance" },
];

// Sample SIP wealth projection (₹15k/mo @ ~11% p.a.) for the hero chart.
function projectionData() {
  const monthly = 15000;
  const rate = 0.11 / 12;
  const out = [];
  for (let y = 0; y <= 15; y += 3) {
    const n = y * 12;
    const value =
      n === 0
        ? 0
        : monthly * (((Math.pow(1 + rate, n) - 1) / rate) * (1 + rate));
    out.push({
      year: `Y${y}`,
      Invested: monthly * 12 * y,
      Value: Math.round(value),
    });
  }
  return out;
}

const DEMO_ALLOC = [
  { name: "Equity", value: 55, color: "#8ab4f8" },
  { name: "Debt", value: 25, color: "#81c995" },
  { name: "Gold", value: 12, color: "#fdd663" },
  { name: "Liquid", value: 8, color: "#9b72cb" },
];

// Mock conversation showing onboarding → plan → calm mode.
const SAMPLE_CHAT = [
  {
    who: "ai",
    text: "Hey! I'm NiveshMitra. What are you hoping money can do for you?",
  },
  {
    who: "user",
    text: "Honestly I just want to start a SIP but it all feels confusing.",
  },
  {
    who: "ai",
    text: "Totally fair — let's keep it simple. Roughly how long can you stay invested, and how do market dips make you feel?",
  },
  { who: "user", text: "Maybe 8-10 years. Big drops scare me a little." },
  {
    who: "ai",
    text: "Got it — long horizon, gentle on risk. I'll build a balanced plan: mostly index + a bit of debt and gold. Here's your dashboard 👇",
  },
  {
    who: "calm",
    text: "And if markets ever crash — breathe. I'll remind you this plan was built for exactly those days.",
  },
];

const PERSONALIZE = [
  {
    icon: "chat",
    title: "Speaks your language",
    text: "Mix Hindi and English freely — NiveshMitra mirrors how you actually talk.",
  },
  {
    icon: "plan",
    title: "Goal aware",
    text: "Your goals, horizon and income shape every suggestion — not a generic template.",
  },
  {
    icon: "shield",
    title: "Risk framed",
    text: "Plans come with the why, the trade-offs, and what would change the view.",
  },
  {
    icon: "sliders",
    title: "Yours to tweak",
    text: "Adjust sector allocations with sliders and watch the projection update live.",
  },
];

const TRUST = [
  {
    icon: "shield",
    title: "Always disclaimed",
    text: "Every plan is clearly marked educational guidance — never a buy/sell signal.",
  },
  {
    icon: "plan",
    title: "Risk-first framing",
    text: "Suggestions include horizon, trade-offs and a calm view of volatility.",
  },
  {
    icon: "chat",
    title: "System-guided responses",
    text: "Responses follow pinned system guidance and are clearly framed as educational.",
  },
  {
    icon: "sliders",
    title: "Calm-mode safety net",
    text: "A deterministic safety layer complements the model when panic language appears.",
  },
];

const CATEGORIES = [
  { name: "Index funds", tag: "Core equity", color: "#8ab4f8" },
  { name: "Flexi & large cap", tag: "Growth", color: "#9b72cb" },
  { name: "Debt funds", tag: "Stability", color: "#81c995" },
  { name: "Gold / SGB", tag: "Hedge", color: "#fdd663" },
  { name: "Liquid funds", tag: "Emergency", color: "#7cd3e0" },
  { name: "REITs", tag: "Income", color: "#f28b82" },
];

const FAQS = [
  {
    q: "Is this registered financial advice?",
    a: "No. NiveshMitra is an educational hackathon project. It explains concepts and builds illustrative plans, but every decision and its risk stays yours.",
  },
  {
    q: "Is it free?",
    a: "Yes — completely free and educational. No card, no subscription, no hidden tiers.",
  },
  {
    q: "How is this different from a normal chatbot?",
    a: "It onboards you like a friend, builds a structured risk profile, generates a real fund-based plan you can simulate, and switches to Calm Mode when it senses panic.",
  },
  {
    q: "Does it use live market data?",
    a: "No live trading or live prices. Plans are built from a curated static dataset of fund categories, so the demo always works reliably.",
  },
  {
    q: "What is Calm Mode?",
    a: "When you sound stressed ('sell everything', 'I can't sleep'), NiveshMitra slows down, reassures you, and helps you avoid panic decisions.",
  },
];

export default function Landing({ theme, onToggleTheme, onStart }) {
  const data = useMemo(() => projectionData(), []);
  const finalValue = data[data.length - 1].Value;
  const [openFaq, setOpenFaq] = React.useState(0);

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">
          <span className="logo brand-mark">
            <Icon name="coin" />
          </span>
          <h1>NiveshMitra</h1>
        </div>
        <div className="landing-nav-right">
          <a className="nav-link" href="#how">
            How it works
          </a>
          <a className="nav-link" href="#why">
            Why us
          </a>
          <button
            className="ghost icon-btn"
            onClick={onToggleTheme}
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="cta-btn small" onClick={onStart}>
            Get started
          </button>
        </div>
      </header>

      {/* ---- HERO ---- */}
      <section className="hero">
        <div className="hero-left">
          <span className="hero-eyebrow">● AI INVESTMENT COMPANION</span>
          <h2 className="hero-title">
            The smartest way to{" "}
            <span className="grad-text">start investing</span> in India.
          </h2>
          <p className="hero-sub">
            NiveshMitra understands how you <em>feel</em> about money — then
            turns your goals into a calm, personalized educational plan with fund examples,
            SIPs and milestones. No jargon. No panic. Just confidence.
          </p>
          <div className="hero-actions">
            <button className="cta-btn" onClick={onStart}>
              Start free →
            </button>
            <a className="ghost-btn" href="#how">
              See how it works
            </a>
          </div>
          <div className="stats-row">
            {STATS.map((s) => (
              <div className="stat-pill" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Product preview: chart + dashboard demo ---- */}
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-bar">
              <span className="dotrow">
                <i style={{ background: "#f28b82" }} />
                <i style={{ background: "#fdd663" }} />
                <i style={{ background: "#81c995" }} />
              </span>
              <span className="preview-title">Your wealth projection</span>
              <span className="preview-live">● live demo</span>
            </div>

            <div className="preview-chart">
              <div className="preview-chart-head">
                <div>
                  <div className="pc-label">Projected in 15 yrs</div>
                  <div className="pc-value">{compact(finalValue)}</div>
                </div>
                <div className="pc-tag">Illustrative example · ₹15,000 / mo · ~11% p.a.</div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart
                  data={data}
                  margin={{ top: 6, right: 6, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9b72cb" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#9b72cb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#8ab4f8"
                        stopOpacity={0.25}
                      />
                      <stop offset="100%" stopColor="#8ab4f8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: "#9aa0a6" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => compact(v)}
                    contentStyle={{
                      background: "#1e1f20",
                      border: "1px solid #444746",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "#e3e3e3",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Value"
                    stroke="#9b72cb"
                    strokeWidth={2}
                    fill="url(#gV)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Invested"
                    stroke="#8ab4f8"
                    strokeWidth={2}
                    fill="url(#gI)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="preview-dash">
              <div className="pd-donut">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={DEMO_ALLOC}
                      dataKey="value"
                      innerRadius={32}
                      outerRadius={52}
                      paddingAngle={2}
                    >
                      {DEMO_ALLOC.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="pd-cat">Balanced</span>
              </div>
              <div className="pd-legend">
                {DEMO_ALLOC.map((d) => (
                  <div className="pd-row" key={d.name}>
                    <span className="pd-dot" style={{ background: d.color }} />
                    <span className="pd-name">{d.name}</span>
                    <span className="pd-pct">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="preview-chat">
            <div className="pchat ai">
              I get it — markets feel scary right now. Let’s not act on fear;
              your plan was built for exactly these dips.
            </div>
            <span className="pchat-tag">Calm Mode active</span>
          </div>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="section" id="how">
        <span className="section-eyebrow">HOW IT WORKS</span>
        <h2 className="section-title">
          From a simple chat to a plan you’ll actually keep.
        </h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step-card" key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- SAMPLE CONVERSATION ---- */}
      <section className="section">
        <span className="section-eyebrow">SEE IT IN ACTION</span>
        <h2 className="section-title">A real conversation, not a form.</h2>
        <div className="chat-demo">
          {SAMPLE_CHAT.map((m, i) => (
            <div className={`cd-row ${m.who}`} key={`${m.who}-${i}`}>
              <div className={`cd-bubble ${m.who}`}>
                {m.who === "calm" && (
                  <span className="cd-calm-tag">Calm Mode</span>
                )}
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="section">
        <span className="section-eyebrow">WHAT YOU GET</span>
        <h2 className="section-title">
          Everything a first-time investor needs.
        </h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">
                <Icon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- PERSONALIZATION ---- */}
      <section className="section">
        <span className="section-eyebrow">MADE FOR YOU</span>
        <h2 className="section-title">
          It adapts to how you think about money.
        </h2>
        <div className="feature-grid">
          {PERSONALIZE.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">
                <Icon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- WHY US (comparison) ---- */}
      <section className="section" id="why">
        <span className="section-eyebrow">WHY NIVESHMITRA</span>
        <h2 className="section-title">Less generic AI. More real guidance.</h2>
        <div className="compare">
          <div className="compare-col bad">
            <h4>A generic chatbot</h4>
            <ul>
              <li>Spits out jargon and disclaimers</li>
              <li>Doesn’t know your goals or feelings</li>
              <li>No plan, no follow-through</li>
              <li>Fuels panic and FOMO</li>
            </ul>
          </div>
          <div className="compare-col good">
            <h4>NiveshMitra</h4>
            <ul>
              <li>Talks like a calm, human friend</li>
              <li>Reads your goals and emotions</li>
              <li>Builds a real plan with funds &amp; milestones</li>
              <li>Coaches you through market fear</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---- FUND CATEGORIES ---- */}
      <section className="section">
        <span className="section-eyebrow">WHAT WE BUILD FROM</span>
        <h2 className="section-title">
          Curated building blocks for every risk profile.
        </h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <div className="cat-chip" key={c.name}>
              <span className="cat-dot" style={{ background: c.color }} />
              <div className="cat-meta">
                <strong>{c.name}</strong>
                <span>{c.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- TRUST & SAFETY ---- */}
      <section className="section">
        <span className="section-eyebrow">BUILT TO BE TRUSTED</span>
        <h2 className="section-title">Guidance with guardrails.</h2>
        <div className="feature-grid">
          {TRUST.map((f) => (
            <div className="feature-card trust" key={f.title}>
              <span className="feature-icon">
                <Icon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="section">
        <span className="section-eyebrow">COMMON QUESTIONS</span>
        <h2 className="section-title">Everything before you start.</h2>
        <div className="faq">
          {FAQS.map((f, i) => (
            <button
              type="button"
              className={`faq-item ${openFaq === i ? "open" : ""}`}
              key={f.q}
              onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
            >
              <div className="faq-q">
                <span>{f.q}</span>
                <span className="faq-sign">{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && <p className="faq-a">{f.a}</p>}
            </button>
          ))}
        </div>
      </section>

      {/* ---- FREE FOREVER ---- */}
      <section className="section">
        <div className="free-band">
          <span className="free-eyebrow">PRICING</span>
          <h2 className="free-price">
            Always <span className="grad-text">free</span>.
          </h2>
          <p className="free-sub">
            NiveshMitra is an educational project — no card, no subscription, no
            locked features. Just open it and start.
          </p>
          <ul className="free-list">
            <li>Unlimited conversational onboarding</li>
            <li>Personalized, simulatable investment plans</li>
            <li>Calm Mode panic support, always on</li>
          </ul>
          <button className="cta-btn" onClick={onStart}>
            Start free →
          </button>
        </div>
      </section>

      {/* ---- CTA BAND ---- */}
      <section className="cta-band">
        <h2>Your calmest money decision starts with one message.</h2>
        <button className="cta-btn" onClick={onStart}>
          Start free →
        </button>
        <span className="hero-note">
          Free · educational · no card, no jargon
        </span>
      </section>

      <footer className="landing-foot">
        Educational guidance only · not registered financial advice. Mutual fund
        investments are subject to market risks.
      </footer>
    </div>
  );
}

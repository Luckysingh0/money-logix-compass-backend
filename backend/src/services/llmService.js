import {
  CALM_MODE_DIRECTIVE,
  DETAILED_MODE_DIRECTIVE,
  TITLE_GENERATION_SYSTEM_PROMPT,
} from "../prompts/systemPrompts.js";

// ---- Provider config ---------------------------------------------------
// Google Gemini via its NATIVE REST API (X-goog-api-key header).
function resolveProvider() {
  const requestedProvider = String(process.env.LLM_PROVIDER || "gemini")
    .trim()
    .toLowerCase();

  if (
    requestedProvider === "openai" ||
    requestedProvider === "openai-compatible"
  ) {
    return {
      name: "openai",
      mode: "openai-compatible",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      fallbackModels: (process.env.OPENAI_FALLBACK_MODELS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }

  return {
    name: "gemini",
    mode: "gemini-native",
    apiKey: process.env.GEMINI_API_KEY,
    baseURL:
      process.env.GEMINI_BASE_URL_NATIVE ||
      "https://generativelanguage.googleapis.com/v1beta",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    // Tried in order if the primary returns 503/overloaded.
    fallbackModels: (
      process.env.GEMINI_FALLBACK_MODELS ||
      "gemini-flash-lite-latest,gemini-3-flash-preview"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

const provider = resolveProvider();
const apiKey =
  provider.apiKey &&
  !/^replace_with_|^your_|^paste_|^<.*>$/.test(provider.apiKey.trim())
    ? provider.apiKey.trim()
    : "";
const MOCK = process.env.MOCK_LLM === "true" || !apiKey;
const MODEL = provider.model;

export function isMockMode() {
  return MOCK;
}

export function providerInfo() {
  return {
    provider: provider.name,
    model: MODEL,
    mode: provider.mode,
    mock: MOCK,
  };
}

export function safeParseJSON(raw) {
  if (!raw || typeof raw !== "string") return null;
  let text = raw.trim();
  // Strip code fences.
  text = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  // Direct parse.
  try {
    return JSON.parse(text);
  } catch (_) {
    /* fall through */
  }
  // Grab the outermost {...} block.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {
      /* give up */
    }
  }
  return null;
}

/**
 * Call the LLM with a system prompt + prior turns + current user message.
 * Returns parsed JSON (per system prompt contract) plus the raw text fallback.
 *
 * @param {Object}   opts
 * @param {string}   opts.systemPrompt
 * @param {Array}    opts.history          [{ role, content }]
 * @param {string}   opts.userMessage
 * @param {boolean}  opts.calmMode         append calm-mode directive
 * @param {boolean}  opts.thinkMode        enable deeper reasoning + richer reply
 */
export async function chatJSON({
  systemPrompt,
  history = [],
  userMessage,
  calmMode = false,
  thinkMode = false,
}) {
  let system = calmMode
    ? `${systemPrompt}\n\n${CALM_MODE_DIRECTIVE}`
    : systemPrompt;
  if (thinkMode) {
    system = `${system}\n\n${DETAILED_MODE_DIRECTIVE}`;
  }

  if (MOCK) {
    return mockResponse(userMessage, calmMode);
  }

  // ---- Native Gemini REST path (X-goog-api-key header) ----
  if (provider.mode === "gemini-native") {
    try {
      const raw = await callGeminiNative({
        system,
        history,
        userMessage,
        thinkMode,
      });
      const parsed = safeParseJSON(raw);
      if (parsed && parsed.response_text) {
        return { ...normalize(parsed), _raw: raw, _mock: false };
      }
      return {
        response_text:
          raw ||
          "Sorry, I had trouble forming a reply. Could you say that again?",
        detected_emotion: "neutral",
        risk_signal: "none",
        confidence: 0.3,
        profile_updates: {},
        onboarding_complete: false,
        _raw: raw,
        _mock: false,
      };
    } catch (err) {
      console.error("Gemini call failed:", err.message);
      return {
        ...mockResponse(userMessage, calmMode),
        response_text:
          "I'm having a little trouble reaching my brain right now — but I'm still here. Want to try again?",
        _error: err.message,
      };
    }
  }

  if (provider.mode === "openai-compatible") {
    try {
      const raw = await callOpenAICompatible({
        system,
        history,
        userMessage,
        thinkMode,
      });
      const parsed = safeParseJSON(raw);
      if (parsed && parsed.response_text) {
        return { ...normalize(parsed), _raw: raw, _mock: false };
      }
      return {
        response_text:
          raw ||
          "Sorry, I had trouble forming a reply. Could you say that again?",
        detected_emotion: "neutral",
        risk_signal: "none",
        confidence: 0.3,
        profile_updates: {},
        onboarding_complete: false,
        _raw: raw,
        _mock: false,
      };
    } catch (err) {
      console.error("OpenAI call failed:", err.message);
      return {
        ...mockResponse(userMessage, calmMode),
        response_text:
          "I'm having a little trouble reaching my brain right now — but I'm still here. Want to try again?",
        _error: err.message,
      };
    }
  }
}

export async function generateJSON({ systemPrompt, userMessage }) {
  if (MOCK) {
    return {};
  }

  const raw =
    provider.mode === "openai-compatible"
      ? await callOpenAICompatible({
          system: systemPrompt,
          history: [],
          userMessage,
          thinkMode: false,
        })
      : await callGeminiNative({
          system: systemPrompt,
          history: [],
          userMessage,
          thinkMode: false,
        });

  const parsed = safeParseJSON(raw);

  if (!parsed) {
    throw new Error("Failed to parse JSON response.");
  }

  return parsed;
}

function openAIChatURL() {
  const base = provider.baseURL.replace(/\/+$/, "");
  return base.endsWith("/v1")
    ? `${base}/chat/completions`
    : `${base}/v1/chat/completions`;
}

async function callOpenAICompatible({
  system,
  history,
  userMessage,
  thinkMode = false,
}) {
  const messages = [
    { role: "system", content: system },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || ""),
    })),
    { role: "user", content: userMessage },
  ];
  const modelsToTry = [provider.model, ...(provider.fallbackModels || [])];
  let lastErr = "unknown error";

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 30000);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(openAIChatURL(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: Number(
            process.env.OPENAI_MAX_TOKENS || (thinkMode ? 4096 : 2048),
          ),
        }),
        signal: controller.signal,
      });
      if (res.ok) {
        const json = await res.json();
        return json.choices?.[0]?.message?.content || "";
      }
      const bodyText = await res.text();
      lastErr = `HTTP ${res.status} ${bodyText.slice(0, 160)}`;
      if (![401, 429, 500, 502, 503, 504].includes(res.status)) break;
    } catch (err) {
      lastErr =
        err?.name === "AbortError"
          ? "OpenAI request timed out."
          : err?.message || "unknown error";
      if (err?.name === "AbortError") break;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error(lastErr);
}

async function callGeminiNative({
  system,
  history,
  userMessage,
  thinkMode = false,
}) {
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  // thinkMode ON  -> dynamic thinking budget (-1) so the model reasons before
  //                  replying, and a larger output cap (thinking tokens count).
  // thinkMode OFF -> thinking disabled (0) for fast, concise JSON.
  const maxOutputTokens = thinkMode
    ? Number(process.env.GEMINI_THINK_MAX_TOKENS || 4096)
    : Number(process.env.GEMINI_MAX_TOKENS || 2048);

  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: thinkMode ? -1 : 0 },
    },
  };

  const modelsToTry = [provider.model, ...(provider.fallbackModels || [])];
  let lastErr = "unknown error";

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 20000);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(
          `${provider.baseURL}/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": apiKey,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          },
        );

        if (res.ok) {
          const json = await res.json();
          const text =
            json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
            "";
          return text;
        }

        const bodyText = await res.text();
        lastErr = `HTTP ${res.status} ${bodyText.slice(0, 160)}`;
        if (res.status === 503) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        break;
      } catch (err) {
        lastErr =
          err?.name === "AbortError"
            ? "Gemini request timed out."
            : err?.message || "unknown error";
        if (err?.name === "AbortError") break;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }
  throw new Error(lastErr);
}

export async function generateConversationTitle(message) {
  try {
    const result = await generateJSON({
      systemPrompt: TITLE_GENERATION_SYSTEM_PROMPT,
      userMessage: message,
    });
    return result?.title || "New Chat";
  } catch (err) {
    console.warn(
      "Conversation title generation failed; using fallback title.",
      err.message,
    );
    return "New Chat";
  }
}

function normalize(p) {
  const payload = p || {};
  const confidenceValue = Number(payload.confidence);
  const validConfidence =
    Number.isFinite(confidenceValue) &&
    confidenceValue >= 0 &&
    confidenceValue <= 1
      ? confidenceValue
      : 0.5;

  return {
    response_text: String(payload.response_text || ""),
    detected_emotion: payload.detected_emotion || "neutral",
    risk_signal: ["none", "low", "medium", "high"].includes(payload.risk_signal)
      ? payload.risk_signal
      : "none",
    confidence: validConfidence,
    profile_updates:
      payload.profile_updates && typeof payload.profile_updates === "object"
        ? payload.profile_updates
        : {},
    onboarding_complete: Boolean(payload.onboarding_complete),
  };
}

function mockResponse(userMessage, calmMode) {
  if (calmMode) {
    return {
      response_text:
        "I hear you — that fear is completely valid. Take a breath. Markets dip; your plan was built for exactly these moments. Let's not act on panic. Can we look at your goals together before doing anything?",
      detected_emotion: "panic",
      risk_signal: "high",
      confidence: 0.9,
      profile_updates: {},
      onboarding_complete: false,
      _mock: true,
    };
  }
  return {
    response_text:
      "(mock) Thanks for sharing that! To tailor your plan, what's your biggest financial goal right now — and roughly how many years away is it?",
    detected_emotion: "neutral",
    risk_signal: "none",
    confidence: 0.6,
    profile_updates: {},
    onboarding_complete: false,
    _mock: true,
  };
}

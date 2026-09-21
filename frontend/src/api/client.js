// Tiny fetch wrapper. Vite proxies /api -> backend:5000.

async function req(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("nm_auth_token")
          ? { Authorization: `Bearer ${localStorage.getItem("nm_auth_token")}` }
          : {}),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    console.error("API request failed:", path, error);
    throw new Error("We could not reach NiveshMitra. Please try again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const friendly = {
      401: "Please sign in again to continue.",
      403: "You do not have access to that information.",
      404: "That information is no longer available.",
      429: "Too many requests. Please wait a moment and try again.",
    };
    console.error("API error:", path, res.status, body);
    throw new Error(
      friendly[res.status] ||
        body.error ||
        "Something went wrong. Please try again.",
    );
  }
  if (res.status === 204) return null;
  return res.json().catch(() => ({}));
}

export const api = {
  sendMessage: ({ email, conversationId = null, message, thinkMode = false }) =>
    req("/chat", {
      method: "POST",
      body: JSON.stringify({ email, conversationId, message, thinkMode }),
    }),
  getHistory: (conversationId, email) =>
    req(
      `/profile/${encodeURIComponent(conversationId)}/history?email=${encodeURIComponent(email)}`,
    ),
  getPlan: (conversationId, email) =>
    req(
      `/plan/${encodeURIComponent(conversationId)}?email=${encodeURIComponent(email)}`,
    ),
  getProfile: (conversationId, email) =>
    req(
      `/profile/${encodeURIComponent(conversationId)}?email=${encodeURIComponent(email)}`,
    ),
  health: () => req("/health"),
  login: (email, password) =>
    req("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email, password) =>
    req("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  googleLogin: (credential) =>
    req("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
  saveBasicInfo: (email, info) =>
    req("/auth/basic-info", {
      method: "POST",
      body: JSON.stringify({ email, ...info }),
    }),
};

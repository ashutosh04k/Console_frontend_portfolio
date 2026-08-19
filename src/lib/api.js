// Thin API wrapper. In dev, Vite proxies /api to the Express server.
// In prod, set VITE_API_BASE to your deployed API origin.
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // playground sharing
  saveSnippet: (payload) =>
    request("/api/snippets", { method: "POST", body: JSON.stringify(payload) }),
  getSnippet: (slug) => request(`/api/snippets/${slug}`),

  // contact
  sendMessage: (payload) =>
    request("/api/messages", { method: "POST", body: JSON.stringify(payload) }),
};

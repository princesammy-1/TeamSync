import { MOCK_LATENCY_MS } from "../constants/apiEndpoints.js";

export function getApiBaseUrl() {
  return (
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE_URL) ||
    ""
  );
}

export function getSessionToken() {
  try {
    return localStorage.getItem("teamsync.token");
  } catch {
    return null;
  }
}

export function setSessionToken(token) {
  try {
    if (token) localStorage.setItem("teamsync.token", token);
    else localStorage.removeItem("teamsync.token");
  } catch {
    // localStorage unavailable
  }
}

export function resolveApiUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone(value) {
  return structuredClone(value);
}

export async function requestJson(url, options = {}) {
  const { body, headers, ...rest } = options;
  const isBodyJson =
    body !== undefined && body !== null && typeof body !== "string";
  const requestUrl = resolveApiUrl(url);
  const token = getSessionToken();

  const response = await fetch(requestUrl, {
    ...rest,
    credentials: "include",
    headers: {
      ...(isBodyJson ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body:
      body === undefined || body === null
        ? undefined
        : isBodyJson
          ? JSON.stringify(body)
          : String(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || "Request failed.";
    throw new ApiError(message, response.status);
  }

  return payload;
}

export async function mockRequest(fn, ms = MOCK_LATENCY_MS) {
  await delay(ms);
  return clone(await fn());
}

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

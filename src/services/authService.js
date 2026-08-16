import { store, session } from "./store";
import { ApiError, getSessionToken, requestJson, setSessionToken } from "./mockApi.js";
import { validateEmail } from "../utils/validateEmail";
import { API_ENDPOINTS } from "../constants/apiEndpoints.js";

const SESSION_KEY = "teamsync.session";

function sanitize(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user;
  return safe;
}

export async function login(email, password) {
  const payload = await requestJson(API_ENDPOINTS.AUTH.LOGIN, {
    method: "POST",
    body: { email, password },
  });

  const user = sanitize(payload.user ?? payload);
  if (payload.token) setSessionToken(payload.token);
  session.userId = user?.id ?? null;
  if (user?.id) localStorage.setItem(SESSION_KEY, user.id);

  return user;
}

export async function register(name, email, password) {
  const payload = await requestJson(API_ENDPOINTS.AUTH.REGISTER, {
    method: "POST",
    body: { name, email, password },
  });

  const user = sanitize(payload.user ?? payload);
  if (payload.token) setSessionToken(payload.token);
  session.userId = user?.id ?? null;
  if (user?.id) localStorage.setItem(SESSION_KEY, user.id);

  return user;
}

export async function logout() {
  try {
    const result = await requestJson(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
    });
    return result?.ok ?? true;
  } finally {
    setSessionToken(null);
    session.userId = null;
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function forgotPassword(email) {
  if (!validateEmail(email)) {
    throw new ApiError("Please enter a valid email address.");
  }

  return requestJson(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token, password) {
  return requestJson(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
    method: "POST",
    body: { token, password },
  });
}

export async function acceptInvite(token, password, name) {
  const payload = await requestJson(API_ENDPOINTS.AUTH.ACCEPT_INVITE, {
    method: "POST",
    body: { token, password, name },
  });

  const user = sanitize(payload.user ?? payload);
  if (payload.token) setSessionToken(payload.token);
  session.userId = user?.id ?? null;
  if (user?.id) localStorage.setItem(SESSION_KEY, user.id);

  return user;
}

export async function changePassword(currentPassword, newPassword) {
  const payload = await requestJson(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
    method: "POST",
    body: { currentPassword, newPassword },
  });
  if (payload?.token) setSessionToken(payload.token);
  return payload;
}

export async function getCurrentUser() {
  const savedId = localStorage.getItem(SESSION_KEY) || session.userId;
  if (!savedId && !getSessionToken()) return null;

  try {
    const payload = await requestJson(API_ENDPOINTS.AUTH.ME);
    return sanitize(payload.user ?? payload);
  } catch {
    if (!savedId) return null;
    const me = store.users.find((user) => user.id === savedId);
    return sanitize(me);
  }
}

export function setCurrentUserId(userId) {
  session.userId = userId;
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}

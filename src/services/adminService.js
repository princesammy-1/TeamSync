import { requestJson } from "./mockApi.js";
import { API_ENDPOINTS } from "../constants/apiEndpoints.js";

export function getAdminOverview() {
  return requestJson(API_ENDPOINTS.ADMIN.OVERVIEW);
}

export function listAdminUsers() {
  return requestJson(API_ENDPOINTS.ADMIN.USERS);
}

export function listAdminActivity({ actorId, action, limit } = {}) {
  const params = new URLSearchParams();
  if (actorId) params.set("actorId", actorId);
  if (action) params.set("action", action);
  if (limit) params.set("limit", String(limit));

  const query = params.toString();
  return requestJson(
    query
      ? `${API_ENDPOINTS.ADMIN.ACTIVITY}?${query}`
      : API_ENDPOINTS.ADMIN.ACTIVITY,
  );
}
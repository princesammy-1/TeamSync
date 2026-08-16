import { requestJson } from "./mockApi.js";
import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { logActivity } from "./activityService";

export function getWorkspace() {
  return requestJson(API_ENDPOINTS.WORKSPACE);
}

export async function updateWorkspace(actorId, patch) {
  const ws = await requestJson(API_ENDPOINTS.WORKSPACE, {
    method: "PATCH",
    body: patch,
  });

  await logActivity(actorId, "workspace.updated", {
    type: "workspace",
    name: "Workspace settings updated",
    id: ws.id,
  });
  return ws;
}

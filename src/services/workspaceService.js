import { store } from "./store";
import { mockRequest } from "./mockApi";
import { logActivity } from "./activityService";

export function getWorkspace() {
  return mockRequest(() => ({ ...store.workspace }), 150);
}

export async function updateWorkspace(actorId, patch) {
  const ws = await mockRequest(() => {
    store.workspace = { ...store.workspace, ...patch };
    return { ...store.workspace };
  });

  await logActivity(actorId, "workspace.updated", {
    type: "workspace",
    name: "Workspace settings updated",
    id: ws.id,
  });
  return ws;
}

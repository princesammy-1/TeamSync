import { store } from "./store";
import { mockRequest, ApiError } from "./mockApi";
import { generateId } from "../utils/generateId";
import { activities as seedActivities } from "../data";

const actions = [
  "task.created",
  "task.updated",
  "task.completed",
  "task.moved",
  "task.assigned",
  "task.deleted",
  "meeting.scheduled",
  "meeting.completed",
  "team.created",
  "team.updated",
  "member.invited",
  "member.joined",
  "member.removed",
  "role.changed",
  "file.uploaded",
  "file.deleted",
  "comment.added",
  "login",
  "logout",
  "workspace.created",
  "workspace.updated",
  "invite.sent",
];

export const ACTIVITY_ACTIONS = new Set(actions);

export async function logActivity(actorId, action, target, teamId = null) {
  if (!ACTIVITY_ACTIONS.has(action)) {
    throw new ApiError(`Unknown activity action: ${action}`);
  }

  const entry = {
    id: generateId("act"),
    actorId,
    action,
    target: {
      type: target.type,
      name: target.name,
      id: target.id ?? null,
    },
    teamId,
    createdAt: new Date().toISOString(),
  };

  store.activities.unshift(entry);
  return entry;
}

export async function listActivities() {
  return mockRequest(() =>
    [...store.activities].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    ),
  );
}

export async function listAuditLog() {
  return mockRequest(() => {
    const auditActions = new Set([
      "member.invited",
      "member.joined",
      "member.removed",
      "role.changed",
      "invite.sent",
      "workspace.updated",
      "team.created",
      "team.updated",
      "login",
      "logout",
    ]);

    return [...store.activities]
      .filter((a) => auditActions.has(a.action))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });
}

export function seedSomeActivities() {
  return seedActivities;
}

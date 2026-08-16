import { requestJson } from "./mockApi.js";
import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { logActivity } from "./activityService";

export function sanitizeUser(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user;
  return safe;
}

export function listMembers() {
  return requestJson(API_ENDPOINTS.USERS);
}

export function getMember(id) {
  return requestJson(`${API_ENDPOINTS.USERS}/${id}`);
}

export function updateMember(id, patch) {
  return requestJson(`${API_ENDPOINTS.USERS}/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

export async function changeRole(actorId, memberId, role) {
  const member = await getMember(memberId);
  const updated = await requestJson(`${API_ENDPOINTS.USERS}/${memberId}`, {
    method: "PATCH",
    body: { role },
  });

  if (member) {
    await logActivity(actorId, "role.changed", {
      type: "member",
      name: `${member.name} is now ${role}`,
      id: member.id,
    });
  }
  return sanitizeUser(updated);
}

export async function inviteMember(
  actorId,
  { name, email, role, teamIds = [] },
) {
  const user = await requestJson(API_ENDPOINTS.USERS, {
    method: "POST",
    body: { name, email, role, teamIds },
  });

  await logActivity(actorId, "invite.sent", {
    type: "member",
    name: `Invited ${user.name} (${role})`,
    id: user.id,
  });

  return user;
}

export async function removeMember(actorId, memberId) {
  const user = await requestJson(`${API_ENDPOINTS.USERS}/${memberId}`, {
    method: "DELETE",
  });

  if (user) {
    await logActivity(actorId, "member.removed", {
      type: "member",
      name: `${user.name} was removed`,
      id: user.id,
    });
  }
  return user;
}

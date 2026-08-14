import { store } from "./store";
import { mockRequest } from "./mockApi";
import { generateId } from "../utils/generateId";
import { logActivity } from "./activityService";

export function sanitizeUser(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user;
  return safe;
}

export function listMembers() {
  return mockRequest(() => store.users.map(sanitizeUser), 150);
}

export function getMember(id) {
  return mockRequest(() => {
    const user = store.users.find((u) => u.id === id);
    return sanitizeUser(user) ?? null;
  }, 100);
}

export function updateMember(id, patch) {
  return mockRequest(() => {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...patch };
    return sanitizeUser(store.users[idx]);
  });
}

export async function changeRole(actorId, memberId, role) {
  const result = await mockRequest(() => {
    const idx = store.users.findIndex((u) => u.id === memberId);
    if (idx === -1) return null;
    const oldRole = store.users[idx].role;
    store.users[idx].role = role;
    return {
      user: sanitizeUser(store.users[idx]),
      oldRole,
    };
  });

  const member = store.users.find((u) => u.id === memberId);
  if (member) {
    await logActivity(actorId, "role.changed", {
      type: "member",
      name: `${member.name} is now ${role}`,
      id: member.id,
    });
  }
  return result.user;
}

export async function inviteMember(actorId, { name, email, role, teamIds = [] }) {
  const user = await mockRequest(() => {
    const existing = store.users.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase().trim(),
    );
    if (existing) {
      teamIds.forEach((teamId) => {
        const team = store.teams.find((t) => t.id === teamId);
        if (team && !team.memberIds.includes(existing.id)) {
          team.memberIds.push(existing.id);
        }
      });
      return sanitizeUser(existing);
    }

    const member = {
      id: generateId("u"),
      name: name || email.split("@")[0],
      email,
      password: "demo1234",
      role,
      title: role === "guest" ? "External collaborator" : "New member",
      bio: "",
      location: "",
      presence: "offline",
      statusMessage: null,
      joinedAt: new Date().toISOString(),
      pending: true,
    };
    store.users.push(member);

    teamIds.forEach((teamId) => {
      const team = store.teams.find((t) => t.id === teamId);
      if (team && !team.memberIds.includes(member.id)) {
        team.memberIds.push(member.id);
      }
    });

    return sanitizeUser(member);
  }, 450);

  await logActivity(actorId, "invite.sent", {
    type: "member",
    name: `Invited ${user.name} (${role})`,
    id: user.id,
  });

  return user;
}

export async function removeMember(actorId, memberId) {
  const user = await mockRequest(() => {
    const idx = store.users.findIndex((u) => u.id === memberId);
    if (idx === -1) return null;
    const [removed] = store.users.splice(idx, 1);
    store.teams.forEach((team) => {
      team.memberIds = team.memberIds.filter((id) => id !== memberId);
    });
    return sanitizeUser(removed);
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

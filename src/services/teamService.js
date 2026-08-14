import { store } from "./store";
import { mockRequest, ApiError } from "./mockApi";
import { generateId } from "../utils/generateId";
import { logActivity } from "./activityService";

export function listTeams() {
  return mockRequest(() => store.teams.map((t) => ({ ...t, memberIds: [...t.memberIds] })), 200);
}

export function getTeam(id) {
  return mockRequest(() => {
    const team = store.teams.find((t) => t.id === id);
    return team ? { ...team, memberIds: [...team.memberIds] } : null;
  }, 150);
}

export async function createTeam(actorId, input) {
  const team = await mockRequest(() => {
    if (!input.name || input.name.trim().length < 2) {
      throw new ApiError("Team name must be at least 2 characters.");
    }
    const created = {
      id: generateId("t"),
      name: input.name.trim(),
      description: input.description?.trim() || "",
      color: input.color || "from-slate-500 to-slate-600",
      emoji: input.emoji || "👥",
      memberIds: input.memberIds?.length ? [...input.memberIds] : [],
      createdAt: new Date().toISOString(),
    };
    store.teams.push(created);
    return { ...created };
  }, 400);

  await logActivity(actorId, "team.created", {
    type: "team",
    name: team.name,
    id: team.id,
  });
  return team;
}

export async function updateTeam(actorId, id, patch) {
  const team = await mockRequest(() => {
    const idx = store.teams.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    store.teams[idx] = { ...store.teams[idx], ...patch };
    return { ...store.teams[idx], memberIds: [...store.teams[idx].memberIds] };
  });

  if (team) {
    await logActivity(actorId, "team.updated", {
      type: "team",
      name: team.name,
      id: team.id,
    });
  }
  return team;
}

export async function deleteTeam(actorId, id) {
  const team = await mockRequest(() => {
    const idx = store.teams.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const [removed] = store.teams.splice(idx, 1);
    return { ...removed };
  });

  if (team) {
    await logActivity(actorId, "team.deleted", {
      type: "team",
      name: team.name,
      id: team.id,
    });
  }
  return team;
}

export async function addMembers(teamId, memberIds) {
  return mockRequest(() => {
    const team = store.teams.find((t) => t.id === teamId);
    if (!team) return null;
    memberIds.forEach((id) => {
      if (!team.memberIds.includes(id)) team.memberIds.push(id);
    });
    return { ...team, memberIds: [...team.memberIds] };
  });
}

export async function removeMember(teamId, memberId) {
  return mockRequest(() => {
    const team = store.teams.find((t) => t.id === teamId);
    if (!team) return null;
    team.memberIds = team.memberIds.filter((id) => id !== memberId);
    return { ...team, memberIds: [...team.memberIds] };
  });
}

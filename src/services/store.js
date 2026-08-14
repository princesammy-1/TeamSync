import { seedData } from "../data";

export const store = {
  workspace: { ...seedData.workspace },
  users: seedData.users.map((u) => ({ ...u })),
  teams: seedData.teams.map((t) => ({ ...t })),
  tasks: seedData.tasks.map((t) => ({ ...t })),
  chatRooms: seedData.chatRooms.map((r) => ({ ...r })),
  chatMessages: seedData.chatMessages.map((m) => ({ ...m })),
  meetings: seedData.meetings.map((m) => ({ ...m })),
  events: seedData.events.map((e) => ({ ...e })),
  files: seedData.files.map((f) => ({ ...f })),
  notifications: seedData.notifications.map((n) => ({ ...n })),
  activities: seedData.activities.map((a) => ({ ...a })),
};

export const session = {
  userId: localStorage.getItem("teamsync.session") || null,
};

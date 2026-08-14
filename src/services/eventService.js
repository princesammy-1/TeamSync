import { store } from "./store";
import { mockRequest, ApiError } from "./mockApi";
import { generateId } from "../utils/generateId";

export function listEvents() {
  return mockRequest(() => store.events.map((e) => ({ ...e })), 200);
}

export async function createEvent(input) {
  return mockRequest(() => {
    if (!input.title || input.title.trim().length < 2) {
      throw new ApiError("Event title must be at least 2 characters.");
    }
    const created = {
      id: generateId("evt"),
      title: input.title.trim(),
      description: input.description?.trim() || "",
      startTime: input.startTime,
      endTime: input.endTime || input.startTime,
      type: input.type || "event",
      teamId: input.teamId || null,
      color: input.color || "bg-violet-500/20 text-violet-300 border-violet-500/30",
    };
    store.events.push(created);
    return { ...created };
  }, 300);
}

export async function updateEvent(id, patch) {
  return mockRequest(() => {
    const idx = store.events.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    store.events[idx] = { ...store.events[idx], ...patch };
    return { ...store.events[idx] };
  });
}

export async function deleteEvent(id) {
  return mockRequest(() => {
    const idx = store.events.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const [removed] = store.events.splice(idx, 1);
    return { ...removed };
  });
}

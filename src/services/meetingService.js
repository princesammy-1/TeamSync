import { store } from "./store";
import { mockRequest, ApiError } from "./mockApi";
import { generateId } from "../utils/generateId";
import { logActivity } from "./activityService";
import { createNotification } from "./notificationService";

function publicMeeting(m) {
  return { ...m, attendeeIds: [...m.attendeeIds] };
}

export function listMeetings() {
  return mockRequest(() => store.meetings.map(publicMeeting), 220);
}

export function getMeeting(id) {
  return mockRequest(() => {
    const m = store.meetings.find((x) => x.id === id);
    return m ? publicMeeting(m) : null;
  }, 120);
}

export async function createMeeting(actorId, input) {
  const meeting = await mockRequest(() => {
    if (!input.title || input.title.trim().length < 3) {
      throw new ApiError("Meeting title must be at least 3 characters.");
    }
    if (!input.startTime) {
      throw new ApiError("Meeting needs a start time.");
    }
    const created = {
      id: generateId("mtg"),
      title: input.title.trim(),
      description: input.description?.trim() || "",
      startTime: input.startTime,
      durationMin: Number(input.durationMin) || 30,
      hostId: actorId,
      attendeeIds: input.attendeeIds || [],
      status: "upcoming",
      recurring: Boolean(input.recurring),
      roomId: generateId("mtg-room"),
    };
    store.meetings.push(created);
    return publicMeeting(created);
  }, 450);

  await logActivity(actorId, "meeting.scheduled", {
    type: "meeting",
    name: meeting.title,
    id: meeting.id,
  });

  meeting.attendeeIds.forEach(async (userId) => {
    if (userId !== actorId) {
      await createNotification({
        userId,
        type: "meeting",
        title: "Meeting invitation",
        message: `You were invited to "${meeting.title}".`,
        link: "/app/meetings",
      });
    }
  });

  return meeting;
}

export async function updateMeeting(actorId, id, patch) {
  const meeting = await mockRequest(() => {
    const idx = store.meetings.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    store.meetings[idx] = { ...store.meetings[idx], ...patch };
    return publicMeeting(store.meetings[idx]);
  });

  if (meeting) {
    await logActivity(actorId, "meeting.scheduled", {
      type: "meeting",
      name: meeting.title,
      id: meeting.id,
    });
  }
  return meeting;
}

export async function deleteMeeting(actorId, id) {
  const meeting = await mockRequest(() => {
    const idx = store.meetings.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    const [removed] = store.meetings.splice(idx, 1);
    return publicMeeting(removed);
  });

  if (meeting) {
    await logActivity(actorId, "meeting.completed", {
      type: "meeting",
      name: meeting.title,
      id: meeting.id,
    });
  }
  return meeting;
}

export async function joinMeeting(id) {
  return mockRequest(() => {
    const idx = store.meetings.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    store.meetings[idx] = { ...store.meetings[idx], status: "live" };
    return publicMeeting(store.meetings[idx]);
  }, 150);
}

export async function endMeeting(actorId, id) {
  return mockRequest(() => {
    const idx = store.meetings.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    store.meetings[idx] = { ...store.meetings[idx], status: "ended" };
    return publicMeeting(store.meetings[idx]);
  }, 150);
}

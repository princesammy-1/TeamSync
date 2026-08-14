import { store } from "./store";
import { mockRequest } from "./mockApi";
import { generateId } from "../utils/generateId";

function getDmPartner(room, userId) {
  if (room.type !== "dm") return null;
  return room.memberIds.find((id) => id !== userId) ?? null;
}

export function listRooms(userId) {
  return mockRequest(() =>
    store.chatRooms
      .filter((room) => room.memberIds.includes(userId))
      .map((room) => {
        const messages = store.chatMessages.filter((m) => m.roomId === room.id);
        const last = messages[messages.length - 1];
        return {
          ...room,
          memberIds: [...room.memberIds],
          lastMessage: last ? { text: last.text, createdAt: last.createdAt } : null,
          dmPartnerId: getDmPartner(room, userId),
        };
      })
      .sort((a, b) => {
        const ta = a.lastMessage?.createdAt || a.createdAt;
        const tb = b.lastMessage?.createdAt || b.createdAt;
        return new Date(tb) - new Date(ta);
      }),
    250,
  );
}

export function getMessages(roomId) {
  return mockRequest(() =>
    store.chatMessages
      .filter((m) => m.roomId === roomId)
      .map((m) => ({ ...m })),
    150,
  );
}

export async function sendMessage(roomId, authorId, text) {
  const message = await mockRequest(() => {
    const clean = text.trim();
    if (!clean) return null;
    const created = {
      id: generateId("m"),
      roomId,
      authorId,
      text: clean,
      createdAt: new Date().toISOString(),
    };
    store.chatMessages.push(created);
    const room = store.chatRooms.find((r) => r.id === roomId);
    if (room) room.lastMessageAt = created.createdAt;
    return { ...created };
  }, 80);

  return message;
}

export async function startDm(userId, otherId) {
  return mockRequest(() => {
    const existing = store.chatRooms.find(
      (r) =>
        r.type === "dm" &&
        r.memberIds.includes(userId) &&
        r.memberIds.includes(otherId),
    );
    if (existing) return { ...existing, memberIds: [...existing.memberIds] };

    const room = {
      id: generateId("room-dm"),
      type: "dm",
      name: "",
      memberIds: [userId, otherId],
      createdAt: new Date().toISOString(),
    };
    store.chatRooms.push(room);
    return { ...room, memberIds: [...room.memberIds] };
  }, 300);
}

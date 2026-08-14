import { store } from "./store";
import { mockRequest } from "./mockApi";
import { generateId } from "../utils/generateId";

export async function listNotifications(userId) {
  return mockRequest(() =>
    store.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  );
}

export async function markAllRead(userId) {
  return mockRequest(() => {
    store.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    return true;
  }, 120);
}

export async function markRead(id) {
  return mockRequest(() => {
    const n = store.notifications.find((x) => x.id === id);
    if (n) n.read = true;
    return n ? { ...n } : null;
  }, 120);
}

export async function clearRead(userId) {
  return mockRequest(() => {
    store.notifications = store.notifications.filter(
      (n) => !(n.userId === userId && n.read),
    );
    return true;
  }, 120);
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link = null,
}) {
  const entry = {
    id: generateId("ntf"),
    userId,
    type,
    title,
    message,
    link,
    createdAt: new Date().toISOString(),
    read: false,
  };
  store.notifications.unshift(entry);
  return entry;
}

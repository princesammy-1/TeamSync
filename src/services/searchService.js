import { store } from "./store";
import { mockRequest } from "./mockApi";

function matches(query, ...fields) {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  return fields.some((f) => String(f || "").toLowerCase().includes(q));
}

export function search(query) {
  return mockRequest(() => {
    const q = query.trim();
    if (!q) return { query: "", results: {} };

    const results = {
      tasks: [],
      users: [],
      teams: [],
      files: [],
      messages: [],
      meetings: [],
    };

    store.tasks.forEach((t) => {
      if (matches(q, t.title, t.description, ...(t.tags || []))) {
        results.tasks.push({ ...t, assigneeIds: [...t.assigneeIds] });
      }
    });

    store.users.forEach((u) => {
      if (matches(q, u.name, u.email, u.title)) {
        const { password: _password, ...safe } = u;
        results.users.push(safe);
      }
    });

    store.teams.forEach((t) => {
      if (matches(q, t.name, t.description)) {
        results.teams.push({ ...t, memberIds: [...t.memberIds] });
      }
    });

    store.files.forEach((f) => {
      if (matches(q, f.name, f.kind)) {
        results.files.push({ ...f });
      }
    });

    store.chatMessages.forEach((m) => {
      const author = store.users.find((u) => u.id === m.authorId);
      if (matches(q, m.text, author?.name)) {
        results.messages.push({ ...m });
      }
    });

    store.meetings.forEach((m) => {
      if (matches(q, m.title, m.description)) {
        results.meetings.push({ ...m, attendeeIds: [...m.attendeeIds] });
      }
    });

    return { query: q, results };
  }, 260);
}

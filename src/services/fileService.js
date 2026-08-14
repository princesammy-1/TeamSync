import { store } from "./store";
import { mockRequest, ApiError } from "./mockApi";
import { generateId } from "../utils/generateId";
import { logActivity } from "./activityService";

function publicFile(f) {
  return { ...f };
}

export function listFiles() {
  return mockRequest(() => store.files.map(publicFile), 220);
}

export async function uploadFile(actorId, input) {
  const file = await mockRequest(() => {
    if (!input.name || input.name.trim().length < 2) {
      throw new ApiError("File name must be at least 2 characters.");
    }
    const created = {
      id: generateId("file"),
      name: input.name.trim(),
      kind: input.kind || "other",
      size: Number(input.size) || 1024,
      uploadedById: actorId,
      teamId: input.teamId || null,
      downloads: 0,
      createdAt: new Date().toISOString(),
    };
    store.files.push(created);
    return publicFile(created);
  }, 500);

  await logActivity(actorId, "file.uploaded", {
    type: "file",
    name: file.name,
    id: file.id,
  }, file.teamId);

  return file;
}

export async function renameFile(id, name) {
  return mockRequest(() => {
    const idx = store.files.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    store.files[idx].name = name;
    return publicFile(store.files[idx]);
  });
}

export async function deleteFile(actorId, id) {
  const file = await mockRequest(() => {
    const idx = store.files.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const [removed] = store.files.splice(idx, 1);
    return publicFile(removed);
  });

  if (file) {
    await logActivity(actorId, "file.deleted", {
      type: "file",
      name: file.name,
      id: file.id,
    }, file.teamId);
  }
  return file;
}

export function downloadFile() {
  return mockRequest(() => ({ ok: true }), 500);
}

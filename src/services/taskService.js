import { store } from "./store";
import { mockRequest, ApiError } from "./mockApi";
import { generateId } from "../utils/generateId";
import { logActivity } from "./activityService";
import { createNotification } from "./notificationService";
import { TASK_STATUS } from "../constants/tasks";

function publicTask(task) {
  return { ...task, assigneeIds: [...task.assigneeIds] };
}

export function listTasks() {
  return mockRequest(() => store.tasks.map(publicTask), 250);
}

export function getTask(id) {
  return mockRequest(() => {
    const task = store.tasks.find((t) => t.id === id);
    return task ? publicTask(task) : null;
  }, 120);
}

export async function createTask(actorId, input) {
  const task = await mockRequest(() => {
    if (!input.title || input.title.trim().length < 3) {
      throw new ApiError("Task title must be at least 3 characters.");
    }
    const now = new Date().toISOString();
    const created = {
      id: generateId("task"),
      title: input.title.trim(),
      description: input.description?.trim() || "",
      status: input.status || TASK_STATUS.TODO,
      priority: input.priority || "medium",
      teamId: input.teamId || null,
      assigneeIds: input.assigneeIds || [],
      createdById: actorId,
      tags: input.tags || [],
      dueDate: input.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };
    store.tasks.push(created);
    return publicTask(created);
  }, 400);

  await logActivity(actorId, "task.created", {
    type: "task",
    name: task.title,
    id: task.id,
  }, task.teamId);

  task.assigneeIds.forEach(async (userId) => {
    if (userId !== actorId) {
      await createNotification({
        userId,
        type: "task",
        title: "Task assigned to you",
        message: `You were assigned "${task.title}".`,
        link: "/app/tasks",
      });
    }
  });

  return task;
}

export async function updateTask(actorId, id, patch) {
  const task = await mockRequest(() => {
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const before = store.tasks[idx];
    store.tasks[idx] = { ...before, ...patch, updatedAt: new Date().toISOString() };
    return publicTask(store.tasks[idx]);
  });

  if (task && patch.status === TASK_STATUS.DONE && store.tasks.find((t) => t.id === id)?.status) {
    // status change already applied above; no-op to keep simple
  }

  if (task) {
    await logActivity(actorId, "task.updated", {
      type: "task",
      name: task.title,
      id: task.id,
    }, task.teamId);
  }
  return task;
}

export async function completeTask(actorId, id, completed = true) {
  return updateTask(actorId, id, { status: completed ? TASK_STATUS.DONE : TASK_STATUS.TODO });
}

export async function deleteTask(actorId, id) {
  const task = await mockRequest(() => {
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const [removed] = store.tasks.splice(idx, 1);
    return publicTask(removed);
  });

  if (task) {
    await logActivity(actorId, "task.deleted", {
      type: "task",
      name: task.title,
      id: task.id,
    }, task.teamId);
  }
  return task;
}

export async function moveTask(actorId, id, newStatus, order = null) {
  const task = await mockRequest(() => {
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const moved = { ...store.tasks[idx], status: newStatus, updatedAt: new Date().toISOString() };
    store.tasks[idx] = moved;
    if (order != null) moved.order = order;
    return publicTask(moved);
  }, 150);

  if (task) {
    await logActivity(actorId, "task.moved", {
      type: "task",
      name: task.title,
      id: task.id,
    }, task.teamId);
  }
  return task;
}

import { requestJson } from "./mockApi.js";
import { API_ENDPOINTS } from "../constants/apiEndpoints.js";
import { logActivity } from "./activityService";
import { createNotification } from "./notificationService";
import { TASK_STATUS } from "../constants/tasks";

function publicTask(task) {
  return { ...task, assigneeIds: [...(task.assigneeIds || [])] };
}

export function listTasks() {
  return requestJson(API_ENDPOINTS.TASKS);
}

export function getTask(id) {
  return requestJson(`${API_ENDPOINTS.TASKS}/${id}`);
}

export async function createTask(actorId, input) {
  const task = await requestJson(API_ENDPOINTS.TASKS, {
    method: "POST",
    body: {
      ...input,
      createdById: actorId,
    },
  });

  await logActivity(
    actorId,
    "task.created",
    {
      type: "task",
      name: task.title,
      id: task.id,
    },
    task.teamId,
  );

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

  return publicTask(task);
}

export async function updateTask(actorId, id, patch) {
  const task = await requestJson(`${API_ENDPOINTS.TASKS}/${id}`, {
    method: "PATCH",
    body: patch,
  });

  if (task) {
    await logActivity(
      actorId,
      "task.updated",
      {
        type: "task",
        name: task.title,
        id: task.id,
      },
      task.teamId,
    );
  }
  return publicTask(task);
}

export async function completeTask(actorId, id, completed = true) {
  return updateTask(actorId, id, {
    status: completed ? TASK_STATUS.DONE : TASK_STATUS.TODO,
  });
}

export async function deleteTask(actorId, id) {
  const task = await requestJson(`${API_ENDPOINTS.TASKS}/${id}`, {
    method: "DELETE",
  });

  if (task) {
    await logActivity(
      actorId,
      "task.deleted",
      {
        type: "task",
        name: task.title,
        id: task.id,
      },
      task.teamId,
    );
  }
  return publicTask(task);
}

export async function moveTask(actorId, id, newStatus, order = null) {
  const task = await requestJson(`${API_ENDPOINTS.TASKS}/${id}/move`, {
    method: "PATCH",
    body: { status: newStatus, order },
  });

  if (task) {
    await logActivity(
      actorId,
      "task.moved",
      {
        type: "task",
        name: task.title,
        id: task.id,
      },
      task.teamId,
    );
  }
  return publicTask(task);
}

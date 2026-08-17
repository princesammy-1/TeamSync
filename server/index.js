import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { can } from "../src/constants/roles.js";

import {
  createStore,
  authenticateUser,
  sanitizeUser,
  saveUsers,
  hashPassword,
  verifyPassword,
} from "./store.js";
import {
  requireAuth,
  requirePermission,
  setSessionCookie,
  clearSessionCookie,
  signSessionToken,
  readSessionToken,
  verifySessionToken,
  createPasswordResetToken,
  createInviteToken,
  hashOpaqueToken,
} from "./auth.js";
import {
  sendEmail,
  passwordResetEmailHtml,
  inviteEmailHtml,
  appBaseUrl,
  createEmailRateLimiter,
} from "./email.js";
import { createLogger } from "./logger.js";
import { scheduleBackups } from "./backup.js";

const __filename = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1]
  ? path.resolve(process.argv[1]) === __filename
  : false;

function parseAllowedOrigins() {
  const raw = process.env.TEAMSYNC_ALLOWED_ORIGINS || "";
  if (!raw) {
    return [
      "http://localhost:4173",
      "http://localhost:5173",
      "http://localhost:4180",
      "http://127.0.0.1:4173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:4180",
    ];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function createRateLimiter(windowMs = 60_000, maxRequests = 90) {
  const hits = new Map();

  return function rateLimiter(req, res, next) {
    const key = req.ip || "unknown";
    const now = Date.now();
    const previous = hits.get(key) || [];
    const active = previous.filter((time) => time > now - windowMs);

    if (active.length >= maxRequests) {
      return res
        .status(429)
        .json({ message: "Too many requests. Please retry later." });
    }

    active.push(now);
    hits.set(key, active);
    return next();
  };
}

export function createApp({ persist = false } = {}) {
  const app = express();
  const logger = createLogger();
  const store = createStore({ persist });
  const allowedOrigins = parseAllowedOrigins();
  const rateLimiter = createRateLimiter();
  const emailRateLimiter = createEmailRateLimiter();
  const auth = requireAuth(store);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function buildError(message, status = 400) {
    return { message, status };
  }

  function publicTask(task) {
    return { ...task, assigneeIds: [...(task.assigneeIds || [])] };
  }

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3001 http://localhost:4173 http://localhost:5173 http://127.0.0.1:3001 http://127.0.0.1:4173 http://127.0.0.1:5173;",
    );
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.options("*", cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(rateLimiter);
  app.use(logger.requestLogger());

  app.get("/api/health", (_, res) => {
    res.json({
      ok: true,
      service: "teamsync-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/ready", (_, res) => {
    res.json({
      ok: true,
      ready: true,
      persist: Boolean(persist),
      timestamp: new Date().toISOString(),
    });
  });

  const adminOnly = [auth, requirePermission("manageMembers")];

  app.get("/api/admin/overview", adminOnly, (_, res) => {
    const roleCounts = store.users.reduce((counts, user) => {
      counts[user.role] = (counts[user.role] ?? 0) + 1;
      return counts;
    }, {});

    const statusCounts = store.tasks.reduce((counts, task) => {
      counts[task.status] = (counts[task.status] ?? 0) + 1;
      return counts;
    }, {});

    const pendingInvites = store.users.filter((user) => user.pending).length;

    const recentActivity = [...store.activities]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 20);

    res.json({
      metrics: {
        members: store.users.length,
        teams: store.teams.length,
        tasks: store.tasks.length,
        meetings: store.meetings.length,
        events: store.events.length,
        files: store.files.length,
        chatMessages: store.chatMessages.length,
        pendingInvites,
        seats: {
          used: store.workspace?.seats?.used ?? store.users.length,
          limit: store.workspace?.seats?.limit ?? 100,
        },
      },
      roleCounts,
      statusCounts,
      recentActivity: clone(recentActivity),
    });
  });

  app.get("/api/admin/users", adminOnly, (_, res) => {
    res.json(store.users.map((user) => sanitizeUser(user)));
  });

  app.get("/api/admin/activity", adminOnly, (req, res) => {
    const actorId = String(req.query.actorId ?? "").trim();
    const action = String(req.query.action ?? "").trim();
    const limit = Number(req.query.limit) || 100;

    let list = store.activities;
    if (actorId) list = list.filter((entry) => entry.actorId === actorId);
    if (action) list = list.filter((entry) => entry.action === action);

    list = [...list]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    res.json(clone(list));
  });

  app.get("/api/workspace", (_, res) => {
    res.json(clone(store.workspace));
  });

  app.patch("/api/workspace", auth, requirePermission("manageWorkspace"), (req, res) => {
    store.workspace = { ...store.workspace, ...req.body };
    res.json(clone(store.workspace));
  });

  app.get("/api/users", (_, res) => {
    res.json(store.users.map((user) => sanitizeUser(user)));
  });

  app.post("/api/users", auth, requirePermission("inviteMembers"), async (req, res) => {
    const input = req.body ?? {};
    const name = String(input.name ?? "").trim();
    const email = String(input.email ?? "")
      .trim()
      .toLowerCase();
    const role = String(input.role ?? "member").trim();
    const teamIds = Array.isArray(input.teamIds) ? input.teamIds : [];

    if (!name || name.length < 2) {
      return res.status(400).json(buildError("Please enter a valid name."));
    }

    if (!email || !email.includes("@")) {
      return res
        .status(400)
        .json(buildError("Please enter a valid email address."));
    }

    if (store.users.some((user) => user.email.toLowerCase() === email)) {
      return res
        .status(409)
        .json(buildError("An account with this email already exists."));
    }

    const invite = createInviteToken();

    const user = {
      id: `u-${Date.now()}`,
      name,
      email,
      password: hashPassword(`invite-${Date.now()}`),
      role,
      title: "Pending invite",
      bio: "",
      location: "",
      presence: "offline",
      statusMessage: "Pending invitation",
      joinedAt: new Date().toISOString(),
      pending: true,
      invite: {
        tokenHash: invite.hash,
        expiresAt: invite.expiresAt,
      },
    };

    store.users.push(user);

    teamIds.forEach((teamId) => {
      const team = store.teams.find((entry) => entry.id === teamId);
      if (!team) return;
      if (!team.memberIds.includes(user.id)) team.memberIds.push(user.id);
    });

    if (persist) saveUsers(store);

    const acceptUrl = `${appBaseUrl()}/accept-invite?token=${invite.raw}`;
    try {
      await sendEmail({
        to: user.email,
        subject: `You're invited to ${store.workspace.name}`,
        html: inviteEmailHtml({
          inviteeName: user.name,
          workspaceName: store.workspace.name,
          acceptUrl,
        }),
      });
    } catch (error) {
      logger.error("Failed to send invitation email", { error });
    }

    return res.status(201).json({ user: sanitizeUser(user) });
  });

  app.get("/api/users/:id", (req, res) => {
    const user = store.users.find((entry) => entry.id === req.params.id);
    if (!user) {
      return res.status(404).json(buildError("User not found.", 404));
    }

    return res.json(sanitizeUser(user));
  });

  app.patch("/api/users/:id", auth, (req, res) => {
    const index = store.users.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("User not found.", 404));
    }

    const target = store.users[index];
    const isSelf = target.id === req.user.id;

    if (!isSelf && !can(req.user.role, "manageMembers")) {
      return res.status(403).json(
        buildError("You don't have permission to update this member.", 403),
      );
    }

    if (req.body.role && !isSelf && !can(req.user.role, "editRoles")) {
      return res
        .status(403)
        .json(buildError("You don't have permission to change roles.", 403));
    }

    if (target.role === "owner" && req.body.role && req.body.role !== "owner") {
      return res
        .status(403)
        .json(buildError("The owner role cannot be changed.", 403));
    }

    store.users[index] = { ...target, ...req.body };
    if (persist) saveUsers(store);
    return res.json(sanitizeUser(store.users[index]));
  });

  app.delete("/api/users/:id", auth, requirePermission("manageMembers"), (req, res) => {
    const index = store.users.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("User not found.", 404));
    }

    const [removed] = store.users.splice(index, 1);
    store.teams.forEach((team) => {
      team.memberIds = team.memberIds.filter(
        (memberId) => memberId !== req.params.id,
      );
    });

    if (persist) saveUsers(store);

    return res.json(sanitizeUser(removed));
  });

  app.get("/api/teams", (_, res) => {
    res.json(clone(store.teams));
  });

  app.get("/api/teams/:id", (req, res) => {
    const team = store.teams.find((entry) => entry.id === req.params.id);
    if (!team) {
      return res.status(404).json(buildError("Team not found.", 404));
    }

    return res.json(clone(team));
  });

  app.post("/api/teams", auth, requirePermission("createTeam"), (req, res) => {
    const input = req.body ?? {};
    const name = String(input.name ?? "").trim();
    if (!name || name.length < 2) {
      return res
        .status(400)
        .json(buildError("Team name must be at least 2 characters."));
    }

    const team = {
      id: `t-${Date.now()}`,
      name,
      description: String(input.description ?? "").trim(),
      color: input.color || "from-slate-500 to-slate-600",
      emoji: input.emoji || "👥",
      memberIds: Array.isArray(input.memberIds) ? input.memberIds : [],
      createdAt: new Date().toISOString(),
    };

    store.teams.push(team);
    return res.status(201).json(clone(team));
  });

  app.patch("/api/teams/:id", auth, requirePermission("manageWorkspace"), (req, res) => {
    const team = store.teams.find((entry) => entry.id === req.params.id);
    if (!team) {
      return res.status(404).json(buildError("Team not found.", 404));
    }

    Object.assign(team, req.body);
    return res.json(clone(team));
  });

  app.delete("/api/teams/:id", auth, requirePermission("deleteTeam"), (req, res) => {
    const index = store.teams.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("Team not found.", 404));
    }

    const [removed] = store.teams.splice(index, 1);
    return res.json(clone(removed));
  });

  app.patch("/api/teams/:teamId/members", auth, requirePermission("manageMembers"), (req, res) => {
    const team = store.teams.find((entry) => entry.id === req.params.teamId);
    if (!team) {
      return res.status(404).json(buildError("Team not found.", 404));
    }

    const memberIds = Array.isArray(req.body?.memberIds)
      ? req.body.memberIds
      : [];
    memberIds.forEach((id) => {
      if (!team.memberIds.includes(id)) team.memberIds.push(id);
    });

    return res.json(clone(team));
  });

  app.delete("/api/teams/:teamId/members/:memberId", auth, requirePermission("manageMembers"), (req, res) => {
    const team = store.teams.find((entry) => entry.id === req.params.teamId);
    if (!team) {
      return res.status(404).json(buildError("Team not found.", 404));
    }

    team.memberIds = team.memberIds.filter((id) => id !== req.params.memberId);
    return res.json(clone(team));
  });

  app.get("/api/tasks", (_, res) => {
    res.json(store.tasks.map((task) => publicTask(task)));
  });

  app.get("/api/tasks/:id", (req, res) => {
    const task = store.tasks.find((entry) => entry.id === req.params.id);
    if (!task) {
      return res.status(404).json(buildError("Task not found.", 404));
    }

    return res.json(publicTask(task));
  });

  app.post("/api/tasks", (req, res) => {
    const input = req.body ?? {};
    if (
      !String(input.title ?? "").trim() ||
      String(input.title).trim().length < 3
    ) {
      return res
        .status(400)
        .json(buildError("Task title must be at least 3 characters."));
    }

    const task = {
      id: `task-${Date.now()}`,
      title: String(input.title).trim(),
      description: String(input.description ?? "").trim(),
      status: input.status || "todo",
      priority: input.priority || "medium",
      teamId: input.teamId || null,
      assigneeIds: Array.isArray(input.assigneeIds) ? input.assigneeIds : [],
      createdById: input.createdById || "system",
      tags: Array.isArray(input.tags) ? input.tags : [],
      dueDate: input.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.tasks.push(task);
    return res.status(201).json(publicTask(task));
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const index = store.tasks.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("Task not found.", 404));
    }

    store.tasks[index] = {
      ...store.tasks[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    return res.json(publicTask(store.tasks[index]));
  });

  app.patch("/api/tasks/:id/move", (req, res) => {
    const index = store.tasks.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("Task not found.", 404));
    }

    store.tasks[index] = {
      ...store.tasks[index],
      status: req.body?.status || store.tasks[index].status,
      updatedAt: new Date().toISOString(),
    };
    return res.json(publicTask(store.tasks[index]));
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const index = store.tasks.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("Task not found.", 404));
    }

    const [removed] = store.tasks.splice(index, 1);
    return res.json(publicTask(removed));
  });

  app.get("/api/chat/rooms", (_, res) => {
    res.json(clone(store.chatRooms));
  });

  app.get("/api/chat/rooms/:roomId/messages", (req, res) => {
    const roomId = req.params.roomId;
    const messages = store.chatMessages.filter(
      (message) => message.roomId === roomId,
    );
    return res.json(clone(messages));
  });

  app.post("/api/chat/rooms/:roomId/messages", (req, res) => {
    const message = {
      id: `m-${Date.now()}`,
      roomId: req.params.roomId,
      authorId: req.body?.authorId || "system",
      text: String(req.body?.text ?? "").trim(),
      createdAt: new Date().toISOString(),
    };

    if (!message.text) {
      return res.status(400).json(buildError("Message text cannot be empty."));
    }

    store.chatMessages.push(message);
    return res.status(201).json(clone(message));
  });

  app.post("/api/chat/rooms/dm", (req, res) => {
    const { userId, otherId } = req.body ?? {};
    const existing = store.chatRooms.find(
      (room) =>
        room.type === "dm" &&
        room.memberIds.includes(userId) &&
        room.memberIds.includes(otherId),
    );

    if (existing) return res.json(clone(existing));

    const room = {
      id: `room-dm-${Date.now()}`,
      type: "dm",
      name: "",
      memberIds: [userId, otherId],
      createdAt: new Date().toISOString(),
    };

    store.chatRooms.push(room);
    return res.status(201).json(clone(room));
  });

  app.get("/api/meetings", (_, res) => {
    res.json(clone(store.meetings));
  });

  app.post("/api/meetings", (req, res) => {
    const input = req.body ?? {};
    if (
      !String(input.title ?? "").trim() ||
      String(input.title).trim().length < 3
    ) {
      return res
        .status(400)
        .json(buildError("Meeting title must be at least 3 characters."));
    }

    const meeting = {
      id: `mtg-${Date.now()}`,
      title: String(input.title).trim(),
      description: String(input.description ?? "").trim(),
      startTime: input.startTime,
      durationMin: Number(input.durationMin) || 30,
      hostId: input.hostId || "user-1",
      attendeeIds: Array.isArray(input.attendeeIds) ? input.attendeeIds : [],
      status: "upcoming",
      recurring: Boolean(input.recurring),
      roomId: `mtg-room-${Date.now()}`,
    };

    store.meetings.push(meeting);
    return res.status(201).json(clone(meeting));
  });

  app.patch("/api/meetings/:id", (req, res) => {
    const index = store.meetings.findIndex(
      (entry) => entry.id === req.params.id,
    );
    if (index === -1) {
      return res.status(404).json(buildError("Meeting not found.", 404));
    }

    store.meetings[index] = { ...store.meetings[index], ...req.body };
    return res.json(clone(store.meetings[index]));
  });

  app.delete("/api/meetings/:id", (req, res) => {
    const index = store.meetings.findIndex(
      (entry) => entry.id === req.params.id,
    );
    if (index === -1) {
      return res.status(404).json(buildError("Meeting not found.", 404));
    }

    const [removed] = store.meetings.splice(index, 1);
    return res.json(clone(removed));
  });

  app.patch("/api/meetings/:id/join", (req, res) => {
    const index = store.meetings.findIndex(
      (entry) => entry.id === req.params.id,
    );
    if (index === -1) {
      return res.status(404).json(buildError("Meeting not found.", 404));
    }

    store.meetings[index].status = "live";
    return res.json(clone(store.meetings[index]));
  });

  app.get("/api/events", (_, res) => {
    res.json(clone(store.events));
  });

  app.post("/api/events", (req, res) => {
    const input = req.body ?? {};
    if (
      !String(input.title ?? "").trim() ||
      String(input.title).trim().length < 2
    ) {
      return res
        .status(400)
        .json(buildError("Event title must be at least 2 characters."));
    }

    const event = {
      id: `evt-${Date.now()}`,
      title: String(input.title).trim(),
      description: String(input.description ?? "").trim(),
      startTime: input.startTime,
      endTime: input.endTime || input.startTime,
      type: input.type || "event",
      teamId: input.teamId || null,
      color:
        input.color || "bg-violet-500/20 text-violet-300 border-violet-500/30",
    };

    store.events.push(event);
    return res.status(201).json(clone(event));
  });

  app.patch("/api/events/:id", (req, res) => {
    const index = store.events.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("Event not found.", 404));
    }

    store.events[index] = { ...store.events[index], ...req.body };
    return res.json(clone(store.events[index]));
  });

  app.delete("/api/events/:id", (req, res) => {
    const index = store.events.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("Event not found.", 404));
    }

    const [removed] = store.events.splice(index, 1);
    return res.json(clone(removed));
  });

  app.get("/api/files", (_, res) => {
    res.json(clone(store.files));
  });

  app.post("/api/files", (req, res) => {
    const input = req.body ?? {};
    const file = {
      id: `file-${Date.now()}`,
      name: String(input.name ?? "").trim() || "Untitled file",
      kind: input.kind || "other",
      size: Number(input.size) || 1024,
      uploadedById: input.uploadedById || "system",
      teamId: input.teamId || null,
      downloads: 0,
      createdAt: new Date().toISOString(),
    };

    store.files.push(file);
    return res.status(201).json(clone(file));
  });

  app.patch("/api/files/:id", (req, res) => {
    const index = store.files.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("File not found.", 404));
    }

    store.files[index] = { ...store.files[index], ...req.body };
    return res.json(clone(store.files[index]));
  });

  app.delete("/api/files/:id", (req, res) => {
    const index = store.files.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      return res.status(404).json(buildError("File not found.", 404));
    }

    const [removed] = store.files.splice(index, 1);
    return res.json(clone(removed));
  });

  app.get("/api/notifications", (req, res) => {
    const userId = req.query.userId;
    const list = userId
      ? store.notifications.filter(
          (notification) => notification.userId === userId,
        )
      : store.notifications;
    return res.json(clone(list));
  });

  app.patch("/api/notifications/mark-all-read", (req, res) => {
    const { userId } = req.body ?? {};
    store.notifications.forEach((notification) => {
      if (notification.userId === userId) notification.read = true;
    });
    return res.json({ ok: true });
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    const notification = store.notifications.find(
      (entry) => entry.id === req.params.id,
    );
    if (!notification) {
      return res.status(404).json(buildError("Notification not found.", 404));
    }

    notification.read = true;
    return res.json(clone(notification));
  });

  app.delete("/api/notifications/read", (req, res) => {
    const { userId } = req.query;
    store.notifications = store.notifications.filter(
      (notification) => !(notification.userId === userId && notification.read),
    );
    return res.json({ ok: true });
  });

  app.get("/api/activities", (_, res) => {
    res.json(clone(store.activities));
  });

  app.get("/api/search", (req, res) => {
    const query = String(req.query.q ?? "")
      .trim()
      .toLowerCase();
    if (!query) {
      return res.json({ query: "", results: {} });
    }

    const results = {
      tasks: store.tasks.filter((task) =>
        `${task.title} ${task.description}`.toLowerCase().includes(query),
      ),
      users: store.users.filter((user) =>
        `${user.name} ${user.email}`.toLowerCase().includes(query),
      ),
      teams: store.teams.filter((team) =>
        `${team.name} ${team.description}`.toLowerCase().includes(query),
      ),
      files: store.files.filter((file) =>
        `${file.name} ${file.kind}`.toLowerCase().includes(query),
      ),
      meetings: store.meetings.filter((meeting) =>
        `${meeting.title} ${meeting.description}`.toLowerCase().includes(query),
      ),
    };

    return res.json({ query, results });
  });

  app.get("/api/auth/me", (req, res) => {
    const legacyUserId = String(
      req.query.userId ?? req.headers["x-user-id"] ?? "",
    ).trim();

    if (legacyUserId) {
      const user = store.users.find((entry) => entry.id === legacyUserId);
      if (!user) {
        return res.status(404).json({ message: "Session user not found." });
      }
      return res.json({ user: sanitizeUser(user) });
    }

    const token = readSessionToken(req);
    const payload = verifySessionToken(token);
    if (!payload?.sub) {
      return res.status(401).json({ message: "No active session." });
    }

    const user = store.users.find((entry) => entry.id === payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Session user not found." });
    }

    if (payload.ver !== (user.sessionVersion ?? 0)) {
      return res.status(401).json({
        message: "Session is no longer valid. Please sign in again.",
      });
    }

    return res.json({ user: sanitizeUser(user) });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body ?? {};
    const user = authenticateUser(store, email, password);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signSessionToken(user);
    setSessionCookie(res, token);
    return res.json({ user, token });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body ?? {};
    const cleanEmail = String(email ?? "")
      .trim()
      .toLowerCase();

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Please enter your full name." });
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    if (String(password ?? "").length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    if (store.users.some((user) => user.email.toLowerCase() === cleanEmail)) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const user = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password),
      role: "member",
      title: "New member",
      bio: "",
      location: "",
      presence: "online",
      statusMessage: null,
      joinedAt: new Date().toISOString(),
    };

    store.users.push(user);
    if (persist) saveUsers(store);

    const token = signSessionToken(user);
    setSessionCookie(res, token);
    return res.status(201).json({ user: sanitizeUser(user), token });
  });

  app.post("/api/auth/logout", (req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.post("/api/auth/accept-invite", async (req, res) => {
    const { token, password, name } = req.body ?? {};

    if (!token) {
      return res.status(400).json({ message: "Invite token is required." });
    }

    if (String(password ?? "").length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    const tokenHash = hashOpaqueToken(String(token));
    const user = store.users.find(
      (candidate) => candidate.invite?.tokenHash === tokenHash,
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired invite link." });
    }

    if (user.invite.expiresAt < Date.now()) {
      user.invite = undefined;
      if (persist) saveUsers(store);
      return res
        .status(400)
        .json({ message: "This invite link has expired. Please ask for a new one." });
    }

    user.password = hashPassword(password);
    if (name && String(name).trim().length >= 2) {
      user.name = String(name).trim();
    }
    user.pending = false;
    user.invite = undefined;
    user.statusMessage = null;
    user.presence = "online";
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    if (persist) saveUsers(store);

    const sessionToken = signSessionToken(user);
    setSessionCookie(res, sessionToken);
    return res
      .status(201)
      .json({ user: sanitizeUser(user), token: sessionToken });
  });

  app.post("/api/auth/forgot-password", emailRateLimiter, async (req, res) => {
    const { email } = req.body ?? {};
    const cleanEmail = String(email ?? "")
      .trim()
      .toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    // Do not reveal whether an account exists. Always resolve with ok:true
    // after generating a token when the account is present.
    const user = store.users.find(
      (candidate) => candidate.email.toLowerCase() === cleanEmail,
    );

    if (user) {
      const reset = createPasswordResetToken();
      user.passwordReset = {
        tokenHash: reset.hash,
        expiresAt: reset.expiresAt,
      };
      if (persist) saveUsers(store);

      const resetUrl = `${appBaseUrl()}/reset-password?token=${reset.raw}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your TeamSync password",
          html: passwordResetEmailHtml({ name: user.name, resetUrl }),
        });
      } catch (error) {
        // Email delivery must not break the request contract.
        logger.error("Failed to send password reset email", { error });
      }
    }

    return res.json({ ok: true });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body ?? {};

    if (!token) {
      return res.status(400).json({ message: "Reset token is required." });
    }

    if (String(password ?? "").length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    const tokenHash = hashOpaqueToken(String(token));
    const user = store.users.find(
      (candidate) => candidate.passwordReset?.tokenHash === tokenHash,
    );

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link." });
    }

    if (user.passwordReset.expiresAt < Date.now()) {
      user.passwordReset = undefined;
      if (persist) saveUsers(store);
      return res
        .status(400)
        .json({ message: "This reset link has expired. Please request a new one." });
    }

    user.password = hashPassword(password);
    user.passwordReset = undefined;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    if (persist) saveUsers(store);

    clearSessionCookie(res);
    return res.json({ ok: true, message: "Password updated. Please sign in." });
  });

  app.post("/api/auth/change-password", auth, (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }

    if (String(newPassword ?? "").length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters." });
    }

    const user = store.users.find((entry) => entry.id === req.user.id);
    if (!verifyPassword(currentPassword, user.password)) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = hashPassword(newPassword);
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    if (persist) saveUsers(store);

    clearSessionCookie(res);
    const token = signSessionToken(user);
    setSessionCookie(res, token);
    return res.json({ ok: true });
  });

  app.use(logger.errorHandler());

  return app;
}

if (isDirectRun) {
  const port = Number(process.env.PORT || process.env.TEAMSYNC_PORT || 3001);
  const persist = process.env.TEAMSYNC_PERSIST === "true";
  const logger = createLogger();
  const app = createApp({ persist });
  app.listen(port, () => {
    logger.info("TeamSync API running", { port });
  });
  if (persist) {
    scheduleBackups({ logger });
    logger.info("Daily backup scheduler armed", { hourUtc: 2 });
  }
}

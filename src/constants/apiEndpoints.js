/**
 * Central API contract. The mock services in `src/services` mirror these
 * endpoints so a real backend can replace them without touching UI code.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    ME: "/api/auth/me",
  },
  USERS: "/api/users",
  TEAMS: "/api/teams",
  TASKS: "/api/tasks",
  CHAT: {
    ROOMS: "/api/chat/rooms",
    MESSAGES: "/api/chat/rooms/:roomId/messages",
  },
  MEETINGS: "/api/meetings",
  EVENTS: "/api/events",
  FILES: "/api/files",
  NOTIFICATIONS: "/api/notifications",
  ACTIVITIES: "/api/activities",
  SEARCH: "/api/search",
  WORKSPACE: "/api/workspace",
};

export const MOCK_LATENCY_MS = 220;

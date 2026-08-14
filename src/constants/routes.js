export const ROUTES = {
  LANDING: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  APP: "/app",
  DASHBOARD: "/app",
  TEAMS: "/app/teams",
  TEAM_DETAIL: "/app/teams/:teamId",
  TASKS: "/app/tasks",
  CHAT: "/app/chat",
  MEETINGS: "/app/meetings",
  MEETING_ROOM: "/app/meetings/:meetingId",
  CALENDAR: "/app/calendar",
  FILES: "/app/files",
  NOTIFICATIONS: "/app/notifications",
  ACTIVITY: "/app/activity",
  PROFILE: "/app/profile",
  SEARCH: "/app/search",
  SETTINGS: "/app/settings",
  NOT_FOUND: "*",
};

export function teamDetailPath(teamId) {
  return `/app/teams/${teamId}`;
}

export function meetingRoomPath(meetingId) {
  return `/app/meetings/${meetingId}`;
}

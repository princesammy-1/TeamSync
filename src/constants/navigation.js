import {
  MdDashboard,
  MdOutlineTimeline,
  MdGroups,
  MdTask,
  MdCalendarMonth,
  MdVideoCall,
  MdChat,
  MdFolderShared,
  MdSettings,
  MdPerson,
  MdNotifications,
} from "react-icons/md";

export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", path: "/app", icon: MdDashboard },
      { title: "Activity", path: "/app/activity", icon: MdOutlineTimeline },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Teams", path: "/app/teams", icon: MdGroups },
      { title: "Tasks", path: "/app/tasks", icon: MdTask },
      { title: "Calendar", path: "/app/calendar", icon: MdCalendarMonth },
      { title: "Meetings", path: "/app/meetings", icon: MdVideoCall },
      { title: "Chat", path: "/app/chat", icon: MdChat },
      { title: "Files", path: "/app/files", icon: MdFolderShared },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", path: "/app/notifications", icon: MdNotifications },
      { title: "Profile", path: "/app/profile", icon: MdPerson },
      { title: "Settings", path: "/app/settings", icon: MdSettings },
    ],
  },
];

export const SEARCHABLE_PAGES = [
  { title: "Dashboard", path: "/app", keywords: "home overview analytics" },
  { title: "Activity", path: "/app/activity", keywords: "timeline history log" },
  { title: "Teams", path: "/app/teams", keywords: "groups people" },
  { title: "Tasks", path: "/app/tasks", keywords: "kanban board todo" },
  { title: "Calendar", path: "/app/calendar", keywords: "events schedule" },
  { title: "Meetings", path: "/app/meetings", keywords: "video calls schedule" },
  { title: "Chat", path: "/app/chat", keywords: "messages channels dm" },
  { title: "Files", path: "/app/files", keywords: "documents storage upload" },
  { title: "Notifications", path: "/app/notifications", keywords: "alerts bell" },
  { title: "Profile", path: "/app/profile", keywords: "account me user" },
  { title: "Settings", path: "/app/settings", keywords: "preferences workspace" },
];

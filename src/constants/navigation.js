import {
  MdDashboard,
  MdGroups,
  MdTask,
  MdChat,
  MdVideoCall,
  MdSettings,
} from "react-icons/md";

export const navigation = [
  {
    title: "Dashboard",
    path: "/",
    icon: MdDashboard,
  },

  {
    title: "Teams",
    path: "/teams",
    icon: MdGroups,
  },

  {
    title: "Tasks",
    path: "/tasks",
    icon: MdTask,
  },

  {
    title: "Chat",
    path: "/chat",
    icon: MdChat,
  },

  {
    title: "Meetings",
    path: "/meetings",
    icon: MdVideoCall,
  },

  {
    title: "Settings",
    path: "/settings",
    icon: MdSettings,
  },
];

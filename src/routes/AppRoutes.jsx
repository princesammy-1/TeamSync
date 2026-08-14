import { createBrowserRouter, RouterProvider } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import { ProtectedRoute, PublicOnlyRoute } from "./guards";

import Landing from "../pages/Landing/Landing";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import Dashboard from "../pages/Dashboard/Dashboard";
import Activity from "../pages/Activity/Activity";
import Teams from "../pages/Teams/Teams";
import TeamDetail from "../pages/Teams/TeamDetail";
import Tasks from "../pages/Tasks/Tasks";
import Calendar from "../pages/Calendar/Calendar";
import Meetings from "../pages/Meetings/Meetings";
import MeetingRoom from "../pages/Meetings/MeetingRoom";
import Chat from "../pages/Chat/Chat";
import Files from "../pages/Files/Files";
import Notifications from "../pages/Notifications/Notifications";
import Profile from "../pages/Profile/Profile";
import Search from "../pages/Search/Search";
import Settings from "../pages/Settings/Settings";
import NotFound from "../pages/NotFound/NotFound";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },

  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <Login /> },
          { path: "/register", element: <Register /> },
          { path: "/forgot-password", element: <ForgotPassword /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/app", element: <Dashboard /> },
          { path: "/app/activity", element: <Activity /> },
          { path: "/app/teams", element: <Teams /> },
          { path: "/app/teams/:teamId", element: <TeamDetail /> },
          { path: "/app/tasks", element: <Tasks /> },
          { path: "/app/calendar", element: <Calendar /> },
          { path: "/app/meetings", element: <Meetings /> },
          { path: "/app/meetings/:meetingId", element: <MeetingRoom /> },
          { path: "/app/chat", element: <Chat /> },
          { path: "/app/files", element: <Files /> },
          { path: "/app/notifications", element: <Notifications /> },
          { path: "/app/profile", element: <Profile /> },
          { path: "/app/search", element: <Search /> },
          { path: "/app/settings", element: <Settings /> },
        ],
      },
    ],
  },

  { path: "*", element: <NotFound /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}

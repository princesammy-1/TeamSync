import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from "./guards";

const Landing = lazy(() => import("../pages/Landing/Landing"));
const Login = lazy(() => import("../pages/Auth/Login"));
const Register = lazy(() => import("../pages/Auth/Register"));
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/Auth/ResetPassword"));
const AcceptInvite = lazy(() => import("../pages/Auth/AcceptInvite"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Activity = lazy(() => import("../pages/Activity/Activity"));
const Teams = lazy(() => import("../pages/Teams/Teams"));
const TeamDetail = lazy(() => import("../pages/Teams/TeamDetail"));
const Tasks = lazy(() => import("../pages/Tasks/Tasks"));
const Calendar = lazy(() => import("../pages/Calendar/Calendar"));
const Meetings = lazy(() => import("../pages/Meetings/Meetings"));
const MeetingRoom = lazy(() => import("../pages/Meetings/MeetingRoom"));
const Chat = lazy(() => import("../pages/Chat/Chat"));
const Files = lazy(() => import("../pages/Files/Files"));
const Notifications = lazy(() => import("../pages/Notifications/Notifications"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Search = lazy(() => import("../pages/Search/Search"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const AdminDashboard = lazy(() => import("../pages/Admin/AdminDashboard"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

function PageFallback() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center bg-canvas">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
        aria-label="Loading"
      />
    </div>
  );
}

function lazyElement(node) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>;
}

const router = createBrowserRouter([
  { path: "/", element: lazyElement(<Landing />) },

  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: lazyElement(<Login />) },
          { path: "/register", element: lazyElement(<Register />) },
          { path: "/forgot-password", element: lazyElement(<ForgotPassword />) },
          { path: "/reset-password", element: lazyElement(<ResetPassword />) },
          { path: "/accept-invite", element: lazyElement(<AcceptInvite />) },
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
          { path: "/app", element: lazyElement(<Dashboard />) },
          { path: "/app/activity", element: lazyElement(<Activity />) },
          { path: "/app/teams", element: lazyElement(<Teams />) },
          { path: "/app/teams/:teamId", element: lazyElement(<TeamDetail />) },
          { path: "/app/tasks", element: lazyElement(<Tasks />) },
          { path: "/app/calendar", element: lazyElement(<Calendar />) },
          { path: "/app/meetings", element: lazyElement(<Meetings />) },
          { path: "/app/meetings/:meetingId", element: lazyElement(<MeetingRoom />) },
          { path: "/app/chat", element: lazyElement(<Chat />) },
          { path: "/app/files", element: lazyElement(<Files />) },
          { path: "/app/notifications", element: lazyElement(<Notifications />) },
          { path: "/app/profile", element: lazyElement(<Profile />) },
          { path: "/app/search", element: lazyElement(<Search />) },
          { path: "/app/settings", element: lazyElement(<Settings />) },
          {
            element: <AdminRoute />,
            children: [{ path: "/app/admin", element: lazyElement(<AdminDashboard />) }],
          },
        ],
      },
    ],
  },

  { path: "*", element: lazyElement(<NotFound />) },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as teamService from "../services/teamService";
import * as taskService from "../services/taskService";
import * as meetingService from "../services/meetingService";
import * as eventService from "../services/eventService";
import * as fileService from "../services/fileService";
import * as notificationService from "../services/notificationService";
import * as activityService from "../services/activityService";
import * as workspaceService from "../services/workspaceService";
import * as userService from "../services/userService";

export const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [files, setFiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [ws, membersList, teamsList, tasksList, meetingsList, eventsList, filesList, activitiesList] =
        await Promise.all([
          workspaceService.getWorkspace(),
          userService.listMembers(),
          teamService.listTeams(),
          taskService.listTasks(),
          meetingService.listMeetings(),
          eventService.listEvents(),
          fileService.listFiles(),
          activityService.listActivities(),
        ]);
      if (!active) return;
      setWorkspace(ws);
      setMembers(membersList);
      setTeams(teamsList);
      setTasks(tasksList);
      setMeetings(meetingsList);
      setEvents(eventsList);
      setFiles(filesList);
      setActivities(activitiesList);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && members.length) {
      const me = members.find((m) => m.pending !== true);
      void me;
    }
  }, [loading, members]);

  // ---- derived lookups ----
  const userById = useCallback((id) => members.find((u) => u.id === id) || null, [members]);
  const teamById = useCallback((id) => teams.find((t) => t.id === id) || null, [teams]);
  const membersOfTeam = useCallback(
    (teamId) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return [];
      return team.memberIds.map((id) => members.find((u) => u.id === id)).filter(Boolean);
    },
    [teams, members],
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // ---- workspace ----
  const updateWorkspace = useCallback(async (actorId, patch) => {
    const updated = await workspaceService.updateWorkspace(actorId, patch);
    setWorkspace(updated);
    return updated;
  }, []);

  // ---- members ----
  const updateMember = useCallback(async (id, patch) => {
    const updated = await userService.updateMember(id, patch);
    if (updated) {
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
    return updated;
  }, []);

  const changeRole = useCallback(async (actorId, memberId, role) => {
    const updated = await userService.changeRole(actorId, memberId, role);
    if (updated) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    }
    return updated;
  }, []);

  const inviteMember = useCallback(async (actorId, input) => {
    const invited = await userService.inviteMember(actorId, input);
    setMembers((prev) => [invited, ...prev]);
    return invited;
  }, []);

  const removeMember = useCallback(async (actorId, memberId) => {
    const removed = await userService.removeMember(actorId, memberId);
    if (removed) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setTeams((prev) =>
        prev.map((t) => ({
          ...t,
          memberIds: t.memberIds.filter((id) => id !== memberId),
        })),
      );
    }
    return removed;
  }, []);

  // ---- teams ----
  const createTeam = useCallback(async (actorId, input) => {
    const created = await teamService.createTeam(actorId, input);
    setTeams((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTeam = useCallback(async (actorId, id, patch) => {
    const updated = await teamService.updateTeam(actorId, id, patch);
    if (updated) {
      setTeams((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  }, []);

  const deleteTeam = useCallback(async (actorId, id) => {
    const removed = await teamService.deleteTeam(actorId, id);
    if (removed) {
      setTeams((prev) => prev.filter((t) => t.id !== id));
      setTasks((prev) => prev.filter((t) => t.teamId !== id));
    }
    return removed;
  }, []);

  const addMembersToTeam = useCallback(async (teamId, memberIds) => {
    const updated = await teamService.addMembers(teamId, memberIds);
    if (updated) {
      setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
    }
    return updated;
  }, []);

  const removeMemberFromTeam = useCallback(async (teamId, memberId) => {
    const updated = await teamService.removeMember(teamId, memberId);
    if (updated) {
      setTeams((prev) => prev.map((t) => (t.id === teamId ? updated : t)));
    }
    return updated;
  }, []);

  // ---- tasks ----
  const createTask = useCallback(async (actorId, input) => {
    const created = await taskService.createTask(actorId, input);
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (actorId, id, patch) => {
    const updated = await taskService.updateTask(actorId, id, patch);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  }, []);

  const deleteTask = useCallback(async (actorId, id) => {
    const removed = await taskService.deleteTask(actorId, id);
    if (removed) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
    return removed;
  }, []);

  const moveTask = useCallback(async (actorId, id, newStatus, order = null) => {
    const moved = await taskService.moveTask(actorId, id, newStatus, order);
    if (moved) {
      setTasks((prev) => prev.map((t) => (t.id === id ? moved : t)));
    }
    return moved;
  }, []);

  // ---- meetings ----
  const createMeeting = useCallback(async (actorId, input) => {
    const created = await meetingService.createMeeting(actorId, input);
    setMeetings((prev) => [...prev, created]);
    return created;
  }, []);

  const updateMeeting = useCallback(async (actorId, id, patch) => {
    const updated = await meetingService.updateMeeting(actorId, id, patch);
    if (updated) {
      setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
    return updated;
  }, []);

  const deleteMeeting = useCallback(async (actorId, id) => {
    const removed = await meetingService.deleteMeeting(actorId, id);
    if (removed) {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    }
    return removed;
  }, []);

  const joinMeeting = useCallback(async (id) => {
    const updated = await meetingService.joinMeeting(id);
    if (updated) {
      setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
    return updated;
  }, []);

  // ---- events ----
  const createEvent = useCallback(async (input) => {
    const created = await eventService.createEvent(input);
    setEvents((prev) => [...prev, created]);
    return created;
  }, []);

  const updateEvent = useCallback(async (id, patch) => {
    const updated = await eventService.updateEvent(id, patch);
    if (updated) {
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    }
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    const removed = await eventService.deleteEvent(id);
    if (removed) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
    return removed;
  }, []);

  // ---- files ----
  const uploadFile = useCallback(async (actorId, input) => {
    const created = await fileService.uploadFile(actorId, input);
    setFiles((prev) => [created, ...prev]);
    return created;
  }, []);

  const deleteFile = useCallback(async (actorId, id) => {
    const removed = await fileService.deleteFile(actorId, id);
    if (removed) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
    return removed;
  }, []);

  // ---- notifications ----
  const loadNotifications = useCallback(async (userId) => {
    const list = await notificationService.listNotifications(userId);
    setNotifications(list);
    return list;
  }, []);

  const markAllNotificationsRead = useCallback(async (userId) => {
    await notificationService.markAllRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    const updated = await notificationService.markRead(id);
    if (updated) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
    return updated;
  }, []);

  const clearReadNotifications = useCallback(async (userId) => {
    await notificationService.clearRead(userId);
    setNotifications((prev) => prev.filter((n) => !n.read));
  }, []);

  // ---- activities ----
  const loadActivities = useCallback(async () => {
    const list = await activityService.listActivities();
    setActivities(list);
    return list;
  }, []);

  const value = useMemo(
    () => ({
      loading,
      workspace,
      members,
      teams,
      tasks,
      meetings,
      events,
      files,
      notifications,
      activities,
      userById,
      teamById,
      membersOfTeam,
      unreadNotifications,
      updateWorkspace,
      updateMember,
      changeRole,
      inviteMember,
      removeMember,
      createTeam,
      updateTeam,
      deleteTeam,
      addMembersToTeam,
      removeMemberFromTeam,
      createTask,
      updateTask,
      deleteTask,
      moveTask,
      createMeeting,
      updateMeeting,
      deleteMeeting,
      joinMeeting,
      createEvent,
      updateEvent,
      deleteEvent,
      uploadFile,
      deleteFile,
      loadNotifications,
      markAllNotificationsRead,
      markNotificationRead,
      clearReadNotifications,
      loadActivities,
    }),
    [
      loading,
      workspace,
      members,
      teams,
      tasks,
      meetings,
      events,
      files,
      notifications,
      activities,
      userById,
      teamById,
      membersOfTeam,
      unreadNotifications,
      updateWorkspace,
      updateMember,
      changeRole,
      inviteMember,
      removeMember,
      createTeam,
      updateTeam,
      deleteTeam,
      addMembersToTeam,
      removeMemberFromTeam,
      createTask,
      updateTask,
      deleteTask,
      moveTask,
      createMeeting,
      updateMeeting,
      deleteMeeting,
      joinMeeting,
      createEvent,
      updateEvent,
      deleteEvent,
      uploadFile,
      deleteFile,
      loadNotifications,
      markAllNotificationsRead,
      markNotificationRead,
      clearReadNotifications,
      loadActivities,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

import { Link, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiVideo,
  FiUserPlus,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUsers,
  FiArrowRight,
  FiCommand,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import AvatarStack from "../../components/ui/AvatarStack";
import Avatar from "../../components/ui/Avatar";
import Progress from "../../components/ui/Progress";
import { BarChart, DonutChart, Legend } from "../../components/shared/Charts";
import ActivityFeed from "../../components/shared/ActivityFeed";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { usePresence } from "../../hooks/usePresence";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import {
  TASK_STATUS,
  TASK_STATUS_META,
  TASK_STATUS_ORDER,
  PRIORITY_META,
} from "../../constants/tasks";
import { formatTime, isToday, relativeTime } from "../../utils/formatDate";
import { cn } from "../../utils/cn";
import { meetingRoomPath, teamDetailPath } from "../../constants/routes";

const STATUS_COLORS = {
  [TASK_STATUS.DONE]: "#10b981",
  [TASK_STATUS.IN_PROGRESS]: "#f59e0b",
  [TASK_STATUS.IN_REVIEW]: "#8b5cf6",
  [TASK_STATUS.TODO]: "#38bdf8",
  [TASK_STATUS.BACKLOG]: "#64748b",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const {
    loading,
    tasks,
    meetings,
    members,
    teams,
    activities,
    membersOfTeam,
  } = useWorkspace();
  const { presenceOf } = usePresence();
  const { selectRoom } = useChat();
  const navigate = useNavigate();

  const openTasks = tasks.filter((t) => t.status !== TASK_STATUS.DONE).length;
  const doneTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE).length;
  const upcomingToday = meetings.filter(
    (m) => m.status === "upcoming" && isToday(m.startTime) && new Date(m.startTime) >= new Date(),
  ).length;

  const statusCounts = TASK_STATUS_ORDER.map((status) => ({
    status,
    value: tasks.filter((t) => t.status === status).length,
  }));

  const statusLegend = statusCounts.map((s) => ({
    label: TASK_STATUS_META[s.status].label,
    value: s.value,
    color: STATUS_COLORS[s.status],
  }));

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekData = weekDays.map((day, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.getDate();
    const created = tasks.filter(
      (t) => new Date(t.createdAt).getDate() === label && new Date(t.createdAt).getMonth() === d.getMonth(),
    ).length;
    return { label: `${day}`, value: created };
  });

  const nextMeetings = meetings
    .filter((m) => m.status !== "ended")
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

  const dueSoon = tasks
    .filter((t) => t.status !== TASK_STATUS.DONE && t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  const teamRoster = members.slice(0, 5);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${currentUser?.name.split(" ")[0]}`}
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/tasks")}
            >
              <FiPlus size={15} /> New task
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/meetings")}
            >
              <FiVideo size={15} /> Schedule
            </Button>
            <Button size="sm" onClick={() => navigate("/app/settings")}>
              <FiUserPlus size={15} /> Invite
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open tasks" value={openTasks} icon={FiCheckCircle} accent="text-sky-300" />
        <StatCard label="Completed" value={doneTasks} icon={FiCheckCircle} accent="text-emerald-300" />
        <StatCard
          label="Members"
          value={`${members.length}`}
          icon={FiUsers}
          accent="text-brand-300"
          delta={{ positive: true, text: `${Object.values(presenceOf).filter((p) => p !== "offline").length} active now` }}
        />
        <StatCard label="Today's meetings" value={upcomingToday} icon={FiVideo} accent="text-violet-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Weekly momentum</h2>
              <p className="text-xs text-ink-mute">Tasks created over the last 7 days</p>
            </div>
            <Badge variant="brand">{tasks.length} total</Badge>
          </div>

          <div className="h-40">
            <BarChart data={weekData} height={160} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">Task distribution</h2>
          <p className="text-xs text-ink-mute">Across all teams</p>

          <div className="mt-4 flex flex-col items-center gap-4">
            <DonutChart
              segments={statusLegend
                .filter((s) => s.value > 0)
                .map((s) => ({ value: s.value, color: s.color }))}
              centerValue={tasks.length}
              centerLabel="tasks"
            />
            <div className="w-full">
              <Legend items={statusLegend} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Up next</h2>
            <Link to="/app/meetings" className="text-xs font-medium text-brand-300 hover:text-brand-200">
              All meetings
            </Link>
          </div>

          <ul className="space-y-2.5">
            {nextMeetings.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-mute">Nothing scheduled — enjoy the focus time.</p>
            )}
            {nextMeetings.map((m) => {
              const attendees = m.attendeeIds.map((id) => members.find((u) => u.id === id)).filter(Boolean);
              const dateLabel = isToday(m.startTime)
                ? `Today · ${formatTime(m.startTime)}`
                : new Date(m.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ` · ${formatTime(m.startTime)}`;

              return (
                <li key={m.id} className="rounded-lg border border-border-subtle bg-surface-2/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">{m.title}</p>
                    {m.status === "live" && <Badge variant="success">Live</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-mute">{dateLabel}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <AvatarStack users={attendees} max={3} />
                    {m.status === "live" ? (
                      <Button size="xs" onClick={() => navigate(meetingRoomPath(m.id))}>
                        Join
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-mute">{m.durationMin}m</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Due soon</h2>
            <Link to="/app/tasks" className="text-xs font-medium text-brand-300 hover:text-brand-200">
              Open board
            </Link>
          </div>

          <ul className="space-y-2.5">
            {dueSoon.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-mute">No tasks due. Clear sailing! 🎉</p>
            )}
            {dueSoon.map((t) => {
              const overdue = new Date(t.dueDate) < new Date() && t.status !== TASK_STATUS.DONE;
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-2/40 p-3">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", TASK_STATUS_META[t.status].dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{t.title}</p>
                    <p className={cn("mt-0.5 flex items-center gap-1 text-xs", overdue ? "text-rose-400" : "text-ink-mute")}>
                      {overdue ? <FiAlertCircle size={12} /> : <FiClock size={12} />}
                      {overdue ? "Overdue" : relativeTime(t.dueDate)}
                    </p>
                  </div>
                  <Badge variant={overdue ? "danger" : "default"} className="shrink-0">
                    {PRIORITY_META[t.priority].label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Team activity</h2>
            <Link to="/app/activity" className="text-xs font-medium text-brand-300 hover:text-brand-200">
              Timeline
            </Link>
          </div>
          <ActivityFeed activities={activities} limit={5} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Teams</h2>
            <Link to="/app/teams" className="text-xs font-medium text-brand-300 hover:text-brand-200">
              Manage teams
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => {
              const count = tasks.filter((t) => t.teamId === team.id && t.status !== TASK_STATUS.DONE).length;
              const done = tasks.filter((t) => t.teamId === team.id && t.status === TASK_STATUS.DONE).length;
              const all = tasks.filter((t) => t.teamId === team.id).length;
              const pct = all ? Math.round((done / all) * 100) : 0;

              return (
                <Link
                  key={team.id}
                  to={teamDetailPath(team.id)}
                  className="rounded-lg border border-border-subtle bg-surface-2/40 p-3.5 transition-colors hover:border-ink-mute/30"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-sm", team.color)}>
                      {team.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{team.name}</p>
                      <p className="text-xs text-ink-mute">
                        {membersOfTeam(team.id).length} members · {count} open
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={pct} className="flex-1" />
                    <span className="text-xs text-ink-mute">{pct}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">Who's online</h2>
          <p className="text-xs text-ink-mute">Live presence across the workspace</p>

          <ul className="mt-3 space-y-2">
            {teamRoster.map((member) => {
              const presence = presenceOf(member.id);
              return (
                <li key={member.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                  <Avatar name={member.name} size="md" presence={presence} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                    <p className="truncate text-xs text-ink-mute">{member.title}</p>
                  </div>
                  <span className="text-xs capitalize text-ink-mute">{presence}</span>
                </li>
              );
            })}
          </ul>

          <button
            onClick={() => {
              selectRoom("room-general");
              navigate("/app/chat");
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2/40 py-2 text-xs font-semibold text-brand-300 transition hover:bg-surface-2"
          >
            <FiCommand size={13} /> Jump into #general <FiArrowRight size={13} />
          </button>
        </Card>
      </div>
    </div>
  );
}

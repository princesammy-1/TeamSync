import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiUsers,
  FiMessageSquare,
  FiVideo,
  FiFolder,
  FiCheckCircle,
  FiShield,
  FiUserPlus,
  FiRefreshCw,
  FiActivity,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import Progress from "../../components/ui/Progress";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import { BarChart, DonutChart, Legend } from "../../components/shared/Charts";
import ActivityFeed from "../../components/shared/ActivityFeed";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useWorkspace } from "../../hooks/useWorkspace";
import { getAdminOverview, listAdminActivity } from "../../services/adminService";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, can } from "../../constants/roles";

const ROLE_COLORS = {
  owner: "#4f46e5",
  admin: "#8b5cf6",
  member: "#38bdf8",
  guest: "#64748b",
};

const STATUS_COLORS = {
  done: "#10b981",
  in_progress: "#f59e0b",
  in_review: "#8b5cf6",
  todo: "#38bdf8",
  backlog: "#64748b",
};

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { members } = useWorkspace();
  const { toast } = useToast();

  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = currentUser && can(currentUser.role, "manageMembers");

  const refresh = useCallback(async () => {
    try {
      const [data, log] = await Promise.all([
        getAdminOverview(),
        listAdminActivity({ limit: 50 }),
      ]);
      setOverview(data);
      setActivity(log);
    } catch {
      toast({ type: "error", title: "Couldn't load admin data" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const roleSegments = useMemo(() => {
    if (!overview) return [];
    return Object.entries(overview.roleCounts).map(([role, value]) => ({
      label: ROLE_LABELS[role] ?? role,
      value,
      color: ROLE_COLORS[role] ?? "#64748b",
    }));
  }, [overview]);

  const statusSegments = useMemo(() => {
    if (!overview) return [];
    return Object.entries(overview.statusCounts).map(([status, value]) => ({
      label: status.replace("_", " "),
      value,
      color: STATUS_COLORS[status] ?? "#64748b",
    }));
  }, [overview]);

  const seatsPct = overview
    ? Math.round(((overview.metrics.seats.used || 0) / (overview.metrics.seats.limit || 1)) * 100)
    : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast({ type: "success", title: "Admin data refreshed" });
  };

  if (loading || !overview) return <PageSkeleton />;

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin" subtitle="Workspace administration" />
        <EmptyState
          title="Admins only"
          description="You need the owner or admin role to view workspace administration."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        subtitle="Workspace usage, members, and security overview."
        actions={
          <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing}>
            <FiRefreshCw size={14} /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Members" value={overview.metrics.members} icon={FiUsers} accent="text-brand-300" />
        <StatCard label="Teams" value={overview.metrics.teams} icon={FiShield} accent="text-violet-300" />
        <StatCard label="Open invites" value={overview.metrics.pendingInvites} icon={FiUserPlus} accent="text-amber-300" />
        <StatCard label="Chat messages" value={overview.metrics.chatMessages} icon={FiMessageSquare} accent="text-sky-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Usage</h2>
          <p className="text-xs text-ink-mute">Content across the workspace</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <UsageTile label="Tasks" value={overview.metrics.tasks} icon={FiCheckCircle} />
            <UsageTile label="Meetings" value={overview.metrics.meetings} icon={FiVideo} />
            <UsageTile label="Events" value={overview.metrics.events} icon={FiActivity} />
            <UsageTile label="Files" value={overview.metrics.files} icon={FiFolder} />
            <UsageTile label="Members" value={overview.metrics.members} icon={FiUsers} />
            <UsageTile label="Invites" value={overview.metrics.pendingInvites} icon={FiUserPlus} />
          </div>

          <div className="mt-6">
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-semibold text-ink-soft">Seats used</span>
              <span className="text-ink-mute">
                {overview.metrics.seats.used} / {overview.metrics.seats.limit}
              </span>
            </div>
            <Progress value={seatsPct} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-ink">Roles</h2>
            <p className="text-xs text-ink-mute">Member distribution</p>
            <div className="mt-4 flex flex-col items-center gap-4">
              <DonutChart
                segments={roleSegments.filter((s) => s.value > 0)}
                centerValue={overview.metrics.members}
                centerLabel="members"
              />
              <div className="w-full">
                <Legend items={roleSegments} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-ink">Task status</h2>
            <div className="mt-4">
              <BarChart data={statusSegments} height={120} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false} className="overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Members</h2>
            <p className="text-xs text-ink-mute">All accounts in the workspace</p>
          </div>
          <ul className="scrollbar-slim max-h-96 divide-y divide-border-subtle overflow-y-auto">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={member.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {member.name}
                    {member.id === currentUser?.id && (
                      <span className="text-xs font-normal text-ink-mute"> (you)</span>
                    )}
                    {member.pending && <Badge variant="warning" className="ml-2">Pending</Badge>}
                  </p>
                  <p className="truncate text-xs text-ink-mute">{member.email}</p>
                </div>
                <Badge variant="brand" className="shrink-0 capitalize">
                  {ROLE_LABELS[member.role] ?? member.role}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
              <p className="text-xs text-ink-mute">Latest workspace events</p>
            </div>
            <Badge variant="default">{activity.length}</Badge>
          </div>
          <ActivityFeed activities={activity} limit={12} />
        </Card>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Role guide</h2>
          <p className="text-xs text-ink-mute">What each role can do in the workspace</p>
        </div>
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <div key={role} className="bg-surface-2/30 p-4">
              <p className="text-sm font-semibold capitalize text-ink">{ROLE_LABELS[role]}</p>
              <p className="mt-1 text-xs leading-snug text-ink-mute">{description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UsageTile({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-2/40 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
        <Icon size={15} />
      </span>
      <div>
        <p className="text-lg font-bold leading-none text-ink">{value}</p>
        <p className="text-[11px] text-ink-mute">{label}</p>
      </div>
    </div>
  );
}
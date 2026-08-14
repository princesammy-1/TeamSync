import { useMemo, useState } from "react";
import { FiRefreshCw, FiActivity } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import ActivityFeed from "../../components/shared/ActivityFeed";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useToast } from "../../hooks/useToast";
import { formatDate, isToday } from "../../utils/formatDate";

function dayLabel(iso) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatDate(d, { weekday: "long", month: "long", day: "numeric" });
}

export default function Activity() {
  const { activities, loading, loadActivities } = useWorkspace();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");

  const filters = [
    { value: "all", label: "All" },
    { value: "tasks", label: "Tasks" },
    { value: "meetings", label: "Meetings" },
    { value: "team", label: "Team" },
    { value: "files", label: "Files" },
    { value: "system", label: "System" },
  ];

  const matchesFilter = (action) => {
    if (filter === "all") return true;
    if (filter === "tasks") return action.startsWith("task") || action === "comment.added";
    if (filter === "meetings") return action.startsWith("meeting");
    if (filter === "team") return action.startsWith("team") || action.startsWith("member") || action === "invite.sent" || action === "role.changed";
    if (filter === "files") return action.startsWith("file");
    if (filter === "system") return action === "login" || action === "logout" || action.startsWith("workspace");
    return true;
  };

  const grouped = useMemo(() => {
    const list = activities.filter((a) => matchesFilter(a.action));
    const groups = [];
    list.forEach((activity) => {
      const label = dayLabel(activity.createdAt);
      const existing = groups.find((g) => g.label === label);
      if (existing) existing.items.push(activity);
      else groups.push({ label, items: [activity] });
    });
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, filter]);

  const refresh = async () => {
    await loadActivities();
    toast({ type: "info", title: "Activity refreshed" });
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        subtitle="A running log of everything happening in your workspace."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh}>
            <FiRefreshCw size={14} /> Refresh
          </Button>
        }
      />

      <Tabs tabs={filters} active={filter} onChange={setFilter} />

      {grouped.length === 0 ? (
        <EmptyState
          icon={<FiActivity size={22} />}
          title="No activity here yet"
          description="Changes to tasks, files, and team members will show up on this timeline."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="mb-4 text-xs font-semibold tracking-wider text-ink-mute uppercase">{group.label}</h2>
              <Card>
                <ActivityFeed activities={group.items} />
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

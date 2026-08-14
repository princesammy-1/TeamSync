import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck, FiTrash2 } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { relativeTime } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

const TYPE_META = {
  task: { label: "Task", dot: "bg-sky-400", chip: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
  meeting: { label: "Meeting", dot: "bg-violet-400", chip: "bg-violet-500/10 text-violet-300 border-violet-500/30" },
  mention: { label: "Mention", dot: "bg-amber-400", chip: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  team: { label: "Team", dot: "bg-emerald-400", chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
  system: { label: "System", dot: "bg-brand-400", chip: "bg-brand-500/10 text-brand-300 border-brand-500/30" },
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const {
    notifications,
    loading,
    loadNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    clearReadNotifications,
  } = useWorkspace();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (currentUser) loadNotifications(currentUser.id);
  }, [currentUser, loadNotifications]);

  const unread = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, filter],
  );

  const open = async (n) => {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) navigate(n.link);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={
          unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You're all caught up"
        }
        actions={
          <>
            {unread > 0 && (
              <Button variant="secondary" size="sm" onClick={() => markAllNotificationsRead(currentUser.id)}>
                <FiCheck size={15} /> Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => clearReadNotifications(currentUser.id)}>
              <FiTrash2 size={14} /> Clear read
            </Button>
          </>
        }
      />

      <Tabs
        tabs={[
          { value: "all", label: "All", count: notifications.length },
          { value: "unread", label: "Unread", count: unread },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FiBell size={22} />}
          title={filter === "unread" ? "No unread notifications" : "Nothing here yet"}
          description={
            filter === "unread"
              ? "Great job — everything is handled."
              : "Notifications about tasks, meetings, and mentions will appear here."
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-border-subtle">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.system;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => open(n)}
                    className={cn(
                      "flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-surface-2/40",
                      !n.read && "bg-brand-500/[0.04]",
                    )}
                  >
                    <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", meta.chip)}>
                          {meta.label}
                        </span>
                        <p className={cn("text-sm font-medium", n.read ? "text-ink-soft" : "text-ink")}>{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />}
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-ink-mute">{n.message}</p>
                      <p className="mt-1 text-[11px] text-ink-mute/70">{relativeTime(n.createdAt)}</p>
                    </div>

                    {!n.read && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(n.id);
                        }}
                        className="mt-1 shrink-0 rounded-md p-1.5 text-ink-mute transition hover:bg-surface-2 hover:text-ink"
                        aria-label="Mark as read"
                      >
                        <FiCheck size={14} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

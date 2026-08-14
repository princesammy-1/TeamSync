import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck, FiArrowRight } from "react-icons/fi";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import Dropdown from "../ui/Dropdown";
import EmptyState from "../ui/EmptyState";
import { relativeTime } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

const TYPE_ICON = {
  task: "bg-sky-500/15 text-sky-300",
  meeting: "bg-violet-500/15 text-violet-300",
  mention: "bg-amber-500/15 text-amber-300",
  team: "bg-emerald-500/15 text-emerald-300",
  system: "bg-brand-500/15 text-brand-300",
};

export default function NotificationsPopover() {
  const { currentUser } = useAuth();
  const {
    notifications,
    loadNotifications,
    markAllNotificationsRead,
    markNotificationRead,
  } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadNotifications(currentUser.id);
    }
  }, [currentUser, loadNotifications]);

  const unread = notifications.filter((n) => !n.read).length;
  const recent = notifications.slice(0, 6);

  const openNotification = async (n) => {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Dropdown
      align="right"
      className="w-80 p-0 sm:w-96"
      trigger={
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink-soft transition-colors hover:border-ink-mute/40 hover:text-ink"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <FiBell size={17} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-sm font-semibold text-ink">Notifications</p>
        {unread > 0 && (
          <button
            onClick={() => markAllNotificationsRead(currentUser.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 transition hover:text-brand-200"
          >
            <FiCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {recent.length === 0 ? (
          <EmptyState
            className="border-0 py-8"
            icon={<FiBell size={20} />}
            title="You're all caught up"
            description="New notifications about tasks, meetings, and mentions will show up here."
          />
        ) : (
          <ul>
            {recent.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => openNotification(n)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2",
                    !n.read && "bg-brand-500/[0.04]",
                  )}
                >
                  <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", TYPE_ICON[n.type])}>
                    <FiBell size={14} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm font-medium", n.read ? "text-ink-soft" : "text-ink")}>
                        {n.title}
                      </span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-mute">
                      {n.message}
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-mute/70">
                      {relativeTime(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => navigate("/app/notifications")}
        className="flex w-full items-center justify-center gap-1 border-t border-border-subtle px-4 py-2.5 text-xs font-semibold text-brand-300 transition hover:bg-surface-2"
      >
        View all notifications <FiArrowRight size={13} />
      </button>
    </Dropdown>
  );
}

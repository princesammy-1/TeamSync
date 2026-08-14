import {
  FiCheckCircle,
  FiArrowRight,
  FiVideo,
  FiUserPlus,
  FiUpload,
  FiMessageSquare,
  FiLogIn,
  FiSettings,
  FiUsers,
  FiMail,
  FiEdit,
  FiTrash,
} from "react-icons/fi";
import { relativeTime } from "../../utils/formatDate";
import { useWorkspace } from "../../hooks/useWorkspace";
import { cn } from "../../utils/cn";

const ACTION_META = {
  "task.created": { icon: FiEdit, color: "bg-sky-500/15 text-sky-300", label: "created" },
  "task.updated": { icon: FiEdit, color: "bg-sky-500/15 text-sky-300", label: "updated" },
  "task.completed": { icon: FiCheckCircle, color: "bg-emerald-500/15 text-emerald-300", label: "completed" },
  "task.moved": { icon: FiArrowRight, color: "bg-amber-500/15 text-amber-300", label: "moved" },
  "task.assigned": { icon: FiUserPlus, color: "bg-violet-500/15 text-violet-300", label: "assigned" },
  "task.deleted": { icon: FiTrash, color: "bg-rose-500/15 text-rose-300", label: "deleted" },
  "meeting.scheduled": { icon: FiVideo, color: "bg-violet-500/15 text-violet-300", label: "scheduled" },
  "meeting.completed": { icon: FiVideo, color: "bg-violet-500/15 text-violet-300", label: "wrapped up" },
  "team.created": { icon: FiUsers, color: "bg-brand-500/15 text-brand-300", label: "created" },
  "team.updated": { icon: FiUsers, color: "bg-brand-500/15 text-brand-300", label: "updated" },
  "member.invited": { icon: FiUserPlus, color: "bg-emerald-500/15 text-emerald-300", label: "invited" },
  "member.joined": { icon: FiUserPlus, color: "bg-emerald-500/15 text-emerald-300", label: "joined" },
  "member.removed": { icon: FiTrash, color: "bg-rose-500/15 text-rose-300", label: "removed" },
  "role.changed": { icon: FiSettings, color: "bg-amber-500/15 text-amber-300", label: "updated" },
  "file.uploaded": { icon: FiUpload, color: "bg-emerald-500/15 text-emerald-300", label: "uploaded" },
  "file.deleted": { icon: FiTrash, color: "bg-rose-500/15 text-rose-300", label: "deleted" },
  "comment.added": { icon: FiMessageSquare, color: "bg-sky-500/15 text-sky-300", label: "commented on" },
  login: { icon: FiLogIn, color: "bg-brand-500/15 text-brand-300", label: "signed in" },
  logout: { icon: FiLogIn, color: "bg-brand-500/15 text-brand-300", label: "signed out" },
  "workspace.created": { icon: FiSettings, color: "bg-brand-500/15 text-brand-300", label: "created" },
  "workspace.updated": { icon: FiSettings, color: "bg-brand-500/15 text-brand-300", label: "updated" },
  "invite.sent": { icon: FiMail, color: "bg-emerald-500/15 text-emerald-300", label: "invited" },
  "team.deleted": { icon: FiTrash, color: "bg-rose-500/15 text-rose-300", label: "deleted" },
};

export default function ActivityFeed({ activities = [], limit }) {
  const { userById } = useWorkspace();
  const items = limit ? activities.slice(0, limit) : activities;

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-mute">
        No activity yet. Actions across the workspace will appear here.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-border-subtle">
      {items.map((activity) => {
        const meta = ACTION_META[activity.action] || { icon: FiEdit, color: "bg-slate-500/15 text-slate-300", label: activity.action };
        const Icon = meta.icon;
        const actor = userById(activity.actorId);

        return (
          <li key={activity.id} className="relative flex items-start gap-3 pl-0">
            <span className={cn("z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.color)}>
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm leading-snug text-ink-soft">
                <span className="font-semibold text-ink">{actor?.name || "Someone"}</span>{" "}
                <span className="text-ink-mute">{meta.label}</span>{" "}
                <span className="font-medium text-ink">{activity.target?.name}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-ink-mute">
                {relativeTime(activity.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

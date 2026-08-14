import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";
import Dropdown from "../ui/Dropdown";
import Badge from "../ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import {
  FiUser,
  FiBell,
  FiLogOut,
  FiSettings,
  FiMessageCircle,
} from "react-icons/fi";
import { PRESENCE_STATUSES } from "../../context/PresenceContext";
import { titleCase } from "../../utils/format";

const PRESENCE_DOT = {
  online: "bg-emerald-400",
  busy: "bg-amber-400",
  away: "bg-slate-400",
  offline: "bg-slate-600",
};

export default function UserMenu({ user, presence, onNavigate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Dropdown
      align="left"
      className="min-w-56"
      trigger={
        <button className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-surface-2">
          <Avatar name={user.name} size="md" presence={presence} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
            <span className="block truncate text-xs text-ink-mute">{user.title}</span>
          </span>
        </button>
      }
    >
      <div className="px-2.5 pt-2 pb-1.5">
        <p className="text-sm font-semibold text-ink">{user.name}</p>
        <p className="text-xs text-ink-mute">{user.email}</p>
        <Badge variant="brand" className="mt-2 capitalize">
          {user.role}
        </Badge>
      </div>

      <Dropdown.Separator />

      <Dropdown.Item
        icon={<FiUser size={15} />}
        onClick={() => onNavigate?.("/app/profile")}
      >
        Profile
      </Dropdown.Item>
      <Dropdown.Item
        icon={<FiMessageCircle size={15} />}
        onClick={() => onNavigate?.("/app/chat")}
      >
        Chat
      </Dropdown.Item>
      <Dropdown.Item
        icon={<FiBell size={15} />}
        onClick={() => onNavigate?.("/app/notifications")}
      >
        Notifications
      </Dropdown.Item>
      <Dropdown.Item
        icon={<FiSettings size={15} />}
        onClick={() => onNavigate?.("/app/settings")}
      >
        Settings
      </Dropdown.Item>

      <Dropdown.Separator />

      <Dropdown.Item destructive icon={<FiLogOut size={15} />} onClick={handleLogout}>
        Sign out
      </Dropdown.Item>

      <div className="px-2.5 py-2">
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-mute uppercase">
          Status
        </p>
        <div className="flex flex-wrap gap-1">
          {PRESENCE_STATUSES.map((s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] capitalize ${
                presence === s
                  ? "bg-brand-500/15 text-brand-300"
                  : "text-ink-mute"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${PRESENCE_DOT[s]}`} />
              {titleCase(s)}
            </span>
          ))}
        </div>
      </div>
    </Dropdown>
  );
}

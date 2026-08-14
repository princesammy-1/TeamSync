import { NavLink } from "react-router-dom";
import { NAV_GROUPS } from "../../constants/navigation";
import Logo from "../shared/Logo";
import Badge from "../ui/Badge";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { usePresence } from "../../hooks/usePresence";
import UserMenu from "./UserMenu";
import { cn } from "../../utils/cn";

export default function Sidebar({ onNavigate }) {
  const { workspace } = useWorkspace();
  const { currentUser } = useAuth();
  const { presenceOf } = usePresence();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border-subtle bg-surface">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Logo withText={false} size="sm" />
        <div className="ml-2 min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{workspace?.name || "Workspace"}</p>
          <p className="text-[11px] text-ink-mute">{workspace?.plan} plan</p>
        </div>
        <Badge variant="brand" className="hidden xl:inline-flex">
          {workspace?.seats?.used}/{workspace?.seats?.limit}
        </Badge>
      </div>

      <nav className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-3 py-2" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-ink-mute uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-brand-500/10 text-brand-300"
                            : "text-ink-mute hover:bg-surface-2 hover:text-ink",
                        )
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      {item.title}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <UserMenu
          user={currentUser}
          presence={presenceOf(currentUser?.id)}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

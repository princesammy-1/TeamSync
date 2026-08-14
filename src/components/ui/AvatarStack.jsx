import { cn } from "../../utils/cn";
import Avatar from "./Avatar";

export default function AvatarStack({ users = [], max = 4, size = "sm", presenceMap, className = "" }) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((user, i) => (
        <div
          key={user?.id || i}
          className={cn("rounded-full border-2 border-surface", i > 0 && "-ml-2")}
          title={user?.name}
        >
          <Avatar
            name={user?.name}
            size={size}
            presence={presenceMap ? presenceMap[user?.id] : undefined}
          />
        </div>
      ))}

      {overflow > 0 && (
        <span className="z-10 -ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-elevated text-[11px] font-semibold text-ink-soft">
          +{overflow}
        </span>
      )}
    </div>
  );
}

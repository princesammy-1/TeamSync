import { cn } from "../../utils/cn";
import { avatarGradient, getInitials } from "../../utils/avatar";

export default function Avatar({
  name = "",
  src,
  size = "md",
  presence,
  className = "",
}) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
  };

  const presenceDot = {
    online: "bg-emerald-400",
    busy: "bg-amber-400",
    away: "bg-slate-400",
    offline: "bg-slate-600",
  };

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white select-none",
          avatarGradient(name),
          sizes[size],
        )}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{getInitials(name)}</span>
        )}
      </span>

      {presence && (
        <span
          className={cn(
            "absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-canvas",
            presenceDot[presence] || presenceDot.offline,
          )}
          title={presence}
        />
      )}
    </span>
  );
}

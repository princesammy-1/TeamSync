import { cn } from "../../utils/cn";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-mute">
          {icon}
        </div>
      )}

      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-mute">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

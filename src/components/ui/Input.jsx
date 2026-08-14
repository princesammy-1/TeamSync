import { useId } from "react";
import { cn } from "../../utils/cn";

export default function Input({
  label,
  icon,
  error,
  hint,
  className = "",
  id,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          className={cn(
            "h-9.5 w-full rounded-lg border bg-surface px-3.5 text-sm text-ink transition-colors",
            "placeholder:text-ink-mute focus:outline-2 focus:outline-offset-0 focus:outline-brand-500",
            icon && "pl-9",
            error
              ? "border-rose-500/60"
              : "border-border hover:border-ink-mute/40",
            className,
          )}
          {...props}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

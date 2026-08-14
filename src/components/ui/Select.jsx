import { useId } from "react";
import { cn } from "../../utils/cn";

export default function Select({ label, options, error, className = "", id, ...props }) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "h-9.5 w-full appearance-none rounded-lg border bg-surface px-3.5 pr-9 text-sm text-ink transition-colors",
            "focus:outline-2 focus:outline-offset-0 focus:outline-brand-500",
            error ? "border-rose-500/60" : "border-border hover:border-ink-mute/40",
            "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2397a3b6%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat",
            className,
          )}
          {...props}
        >
          {options.map((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const labelText = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            );
          })}
        </select>
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

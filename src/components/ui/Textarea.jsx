import { useId } from "react";
import { cn } from "../../utils/cn";

export default function Textarea({ label, error, className = "", id, rows = 4, ...props }) {
  const autoId = useId();
  const textareaId = id || autoId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-soft uppercase"
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors",
          "placeholder:text-ink-mute focus:outline-2 focus:outline-offset-0 focus:outline-brand-500",
          error ? "border-rose-500/60" : "border-border hover:border-ink-mute/40",
          className,
        )}
        {...props}
      />

      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

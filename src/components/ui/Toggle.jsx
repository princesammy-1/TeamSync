import { cn } from "../../utils/cn";

export default function Toggle({ checked, onChange, label, className = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full border transition-colors",
        checked ? "border-brand-500 bg-brand-600" : "border-border bg-surface-2",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

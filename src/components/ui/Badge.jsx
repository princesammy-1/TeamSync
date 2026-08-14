import { cn } from "../../utils/cn";

const VARIANTS = {
  default: "bg-surface-2 text-ink-soft border-border",
  brand: "bg-brand-500/10 text-brand-300 border-brand-500/30",
  success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  danger: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  info: "bg-sky-500/10 text-sky-300 border-sky-500/30",
};

export default function Badge({ variant = "default", className = "", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] leading-4 font-medium",
        VARIANTS[variant] || VARIANTS.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

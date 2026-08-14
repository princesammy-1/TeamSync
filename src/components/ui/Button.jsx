import { cn } from "../../utils/cn";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-950/40 hover:bg-brand-500 active:bg-brand-700",
  secondary:
    "bg-surface-2 text-ink border border-border hover:border-ink-mute/50 hover:bg-elevated active:bg-surface-2",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink",
  danger:
    "bg-rose-600/90 text-white hover:bg-rose-500 active:bg-rose-700",
  outline:
    "border border-brand-500/60 text-brand-300 hover:bg-brand-500/10 active:bg-brand-500/20",
};

const SIZES = {
  xs: "h-7 px-2.5 text-xs gap-1.5",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

function Spinner({ className }) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-hidden="true"
    />
  );
}

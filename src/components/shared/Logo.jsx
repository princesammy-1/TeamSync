import { cn } from "../../utils/cn";

export default function Logo({ size = "md", withText = true, className = "" }) {
  const sizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-950/40",
          sizes[size],
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
          <path
            d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M8 12h8M12 8v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {withText && (
        <span className={cn("font-bold tracking-tight text-ink", textSizes[size])}>
          Team<span className="text-brand-400">Sync</span>
        </span>
      )}
    </span>
  );
}

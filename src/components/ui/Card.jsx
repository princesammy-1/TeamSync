import { cn } from "../../utils/cn";

export default function Card({ children, className = "", padded = true, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm shadow-black/20",
        padded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

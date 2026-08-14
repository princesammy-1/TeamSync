import { cn } from "../../utils/cn";

export default function Skeleton({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-2",
        className,
      )}
      aria-hidden="true"
    />
  );
}

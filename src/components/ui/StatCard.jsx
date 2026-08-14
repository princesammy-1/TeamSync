import { cn } from "../../utils/cn";

export default function StatCard({ label, value, delta, icon: Icon, accent = "text-brand-300", className = "" }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">{label}</p>
        {Icon && <Icon size={18} className={cn("text-ink-mute", accent)} />}
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>

      {delta && <p className={cn("mt-1 text-xs font-medium", delta.positive ? "text-emerald-400" : "text-rose-400")}>{delta.text}</p>}
    </div>
  );
}

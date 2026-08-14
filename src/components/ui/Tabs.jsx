import { cn } from "../../utils/cn";

export default function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5",
        className,
      )}
    >
      {tabs.map((tab) => {
        const activeTab = active === tab.value;
        const disabled = tab.disabled;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab}
            disabled={disabled}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab
                ? "bg-elevated text-ink shadow-sm"
                : "text-ink-mute hover:text-ink",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 text-[11px] font-semibold",
                  activeTab ? "bg-brand-500/20 text-brand-300" : "bg-surface-2 text-ink-mute",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

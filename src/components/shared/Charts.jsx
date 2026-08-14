export function BarChart({ data = [], height = 160, barColor = "bg-brand-400" }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  void height;

  return (
    <div className="flex h-full items-end gap-2" role="img" aria-label="Bar chart">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.label}: ${d.value}`}>
          <span className="text-[10px] font-semibold text-ink-soft">{d.value}</span>
          <div className="flex w-full max-w-9 flex-1 items-end">
            <div
              className={`w-full rounded-md ${barColor}`}
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%`, minHeight: 4 }}
            />
          </div>
          <span className="text-[10px] text-ink-mute">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ segments = [], size = 150, thickness = 16, centerLabel, centerValue }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const dashOffset = -offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-ink">{centerValue}</span>
        <span className="text-[11px] text-ink-mute">{centerLabel}</span>
      </div>
    </div>
  );
}

export function Legend({ items = [] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.label}
          <span className="ml-auto font-semibold text-ink">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

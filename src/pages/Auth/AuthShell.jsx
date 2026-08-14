export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-ink-mute">{subtitle}</p>}

      <div className="mt-8">{children}</div>

      {footer && <p className="mt-8 text-center text-sm text-ink-mute">{footer}</p>}
    </div>
  );
}

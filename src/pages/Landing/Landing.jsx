import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiVideo,
  FiMessageSquare,
  FiFolder,
  FiZap,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import Logo from "../../components/shared/Logo";
import Button from "../../components/ui/Button";

const FEATURES = [
  {
    icon: FiCheckCircle,
    title: "Task management",
    description: "Kanban boards and lists that keep your team focused and shipping.",
  },
  {
    icon: FiMessageSquare,
    title: "Real-time chat",
    description: "Channels and DMs with live presence, typing, and mentions.",
  },
  {
    icon: FiVideo,
    title: "Video meetings",
    description: "One-click rooms with screen share, chat, and instant joining.",
  },
  {
    icon: FiCalendar,
    title: "Shared calendar",
    description: "Events, deadlines, and meetings in one calm, readable view.",
  },
  {
    icon: FiFolder,
    title: "File sharing",
    description: "Upload, preview, and organize files right next to your work.",
  },
  {
    icon: FiUsers,
    title: "Teams & roles",
    description: "Granular permissions, invites, and an audit trail you control.",
  },
];

const LOGOS = ["Nimbus", "Vertex", "Lumen", "Forge", "Orbit", "Hearth"];

function HeroPreview() {
  return (
    <div className="relative mt-14 lg:mt-16">
      <div
        className="absolute -inset-8 rounded-3xl opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(600px circle at 50% 20%, rgba(122,85,248,0.25), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/50">
        <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-3 flex-1 rounded-md bg-surface-2 px-2 py-0.5 text-center text-[11px] text-ink-mute">
            app.teamsync.io
          </span>
        </div>

        <div className="flex">
          <div className="hidden w-44 shrink-0 border-r border-border-subtle p-3 sm:block">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="h-4 w-4 rounded bg-gradient-to-br from-brand-400 to-brand-700" />
              <span className="text-[11px] font-semibold text-ink">Aurora Labs</span>
            </div>
            {[
              "Dashboard",
              "Teams",
              "Tasks",
              "Calendar",
              "Meetings",
              "Chat",
              "Files",
            ].map((item, i) => (
              <div
                key={item}
                className={`mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                  i === 0 ? "bg-brand-500/15 font-medium text-brand-300" : "text-ink-mute"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {item}
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-3 p-4">
            <div className="grid grid-cols-3 gap-2">
              {[["Open tasks", "24"], ["In progress", "8"], ["Online now", "6"]].map(([label, value], i) => (
                <div key={label} className="rounded-lg border border-border bg-surface-2/50 p-2.5">
                  <p className="text-[9px] font-medium tracking-wide text-ink-mute uppercase">{label}</p>
                  <p className={`mt-1 text-base font-bold ${i === 2 ? "text-emerald-400" : "text-ink"}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-surface-2/50 p-3">
              <p className="text-[9px] font-medium tracking-wide text-ink-mute uppercase">
                This week's momentum
              </p>
              <div className="mt-2 flex h-14 items-end gap-1.5">
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${i === 5 ? "bg-brand-400" : "bg-brand-500/40"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface-2/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-ink">Upcoming meetings</p>
                <span className="text-[9px] text-ink-mute">Today</span>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-md bg-surface px-2.5 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                  <FiVideo size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink">Weekly all-hands sync</p>
                  <p className="text-[9px] text-ink-mute">11:00 – 11:45</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <a href="#product" className="transition hover:text-ink">Product</a>
            <a href="#cta" className="transition hover:text-ink">Pricing</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-16 pb-12 text-center sm:pt-24">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(800px circle at 50% 0%, rgba(122,85,248,0.16), transparent 55%)",
            }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl px-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
              <FiZap size={13} /> Built for focused teams
            </span>

            <h1 className="mt-6 text-4xl leading-tight font-bold tracking-tight text-ink sm:text-6xl">
              Everything your team needs.
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-teal-300 bg-clip-text text-transparent">
                In one calm place.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg">
              TeamSync brings tasks, chat, meetings, and files together so your
              team can plan, focus, and ship — without the chaos.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Start free <FiArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/app" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  View live demo
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-ink-mute">
              Free for small teams · No credit card required
            </p>
          </div>

          <HeroPreview />
        </section>

        <section className="border-y border-border-subtle bg-surface/40 py-10">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-center text-xs font-semibold tracking-widest text-ink-mute uppercase">
              Trusted by forward-thinking teams
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {LOGOS.map((name) => (
                <span key={name} className="text-lg font-bold tracking-tight text-ink-mute/60">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                A workspace that respects your focus
              </h2>
              <p className="mt-3 text-base text-ink-mute">
                Designed to reduce noise and keep every signal visible, so your
                team always knows what matters.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-ink-mute/30"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-mute">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="product" className="border-t border-border-subtle bg-surface/40 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold tracking-widest text-brand-300 uppercase">
                Why TeamSync
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Less tab-switching. More getting it done.
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  { icon: FiShield, text: "Granular roles and permissions keep your workspace secure." },
                  { icon: FiZap, text: "Command palette and shortcuts put everything a keystroke away." },
                  { icon: FiUsers, text: "Invite, onboard, and organize members in minutes." },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.text} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                        <Icon size={16} />
                      </span>
                      <p className="text-sm leading-relaxed text-ink-soft">{item.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="text-xs font-semibold tracking-widest text-ink-mute uppercase">
                The daily rhythm
              </p>
              <div className="mt-4 space-y-3">
                {[
                  { time: "09:00", title: "Standup in #engineering", type: "Chat", color: "text-sky-300" },
                  { time: "10:30", title: "Design critique", type: "Meeting", color: "text-violet-300" },
                  { time: "11:15", title: "Review OAuth migration PR", type: "Task", color: "text-amber-300" },
                  { time: "14:00", title: "Ship calmer — webinar", type: "Calendar", color: "text-emerald-300" },
                  { time: "16:30", title: "Deep work block", type: "Focus", color: "text-brand-300" },
                ].map((row) => (
                  <div
                    key={row.time + row.title}
                    className="flex items-center gap-3 rounded-lg bg-surface-2/50 px-3 py-2.5"
                  >
                    <span className="w-11 shrink-0 text-xs font-semibold text-ink-mute">{row.time}</span>
                    <span className={`text-[10px] font-semibold tracking-wide uppercase ${row.color}`}>
                      {row.type}
                    </span>
                    <span className="truncate text-sm text-ink-soft">{row.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-5">
            <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-900/40 to-surface p-10 text-center sm:p-14">
              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Give your team calmer days.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base text-ink-mute">
                Join thousands of teams shipping better work with TeamSync.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start free today <FiArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo size="sm" />
          <p className="text-xs text-ink-mute">
            © {new Date().getFullYear()} TeamSync, Inc. Crafted for focused teams.
          </p>
          <div className="flex gap-5 text-xs font-medium text-ink-mute">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <a href="#product" className="transition hover:text-ink">Product</a>
            <a href="#cta" className="transition hover:text-ink">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

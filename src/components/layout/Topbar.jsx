import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiCommand } from "react-icons/fi";
import NotificationsPopover from "./NotificationsPopover";
import { usePresence } from "../../hooks/usePresence";

export default function Topbar({ onOpenMobileNav, onOpenCommandPalette }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { onlineCount } = usePresence();

  const submitSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-subtle bg-surface/80 px-4 backdrop-blur">
      <button
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-ink-soft transition hover:text-ink lg:hidden"
        aria-label="Open navigation"
      >
        <FiMenu size={18} />
      </button>

      <form onSubmit={submitSearch} className="relative min-w-0 flex-1 sm:max-w-md">
        <FiSearch
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, files, people…"
          className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-14 text-sm text-ink transition-colors placeholder:text-ink-mute focus:border-brand-500/50 focus:outline-none"
          aria-label="Search workspace"
        />
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-mute transition hover:text-ink"
          aria-label="Open command palette (Ctrl+K)"
        >
          <FiCommand size={11} /> K
        </button>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-ink-soft md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {onlineCount} online
        </span>

        <NotificationsPopover />
      </div>
    </header>
  );
}

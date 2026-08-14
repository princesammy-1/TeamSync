import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiUser,
  FiUsers,
  FiFile,
  FiMessageSquare,
  FiVideo,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";
import { SEARCHABLE_PAGES } from "../../constants/navigation";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";
import { getInitials, avatarGradient } from "../../utils/avatar";

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { tasks, users, files, teams } = useWorkspace();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];

    const pushSection = (label, list) => {
      if (list.length) out.push({ section: label, items: list });
    };

    const actions = [
      { id: "a1", label: "Create task", hint: "New to-do item", icon: <FiPlus size={15} />, action: () => navigate("/app/tasks") },
      { id: "a2", label: "Schedule meeting", hint: "Book a video call", icon: <FiVideo size={15} />, action: () => navigate("/app/meetings") },
      { id: "a3", label: "Add calendar event", hint: "Plan your day", icon: <FiCalendar size={15} />, action: () => navigate("/app/calendar") },
      { id: "a4", label: "Upload file", hint: "Share with your team", icon: <FiFile size={15} />, action: () => navigate("/app/files") },
      { id: "a5", label: "Invite member", hint: "Grow your workspace", icon: <FiUser size={15} />, action: () => navigate("/app/settings") },
    ];

    const pages = SEARCHABLE_PAGES.filter((p) => {
      if (!q) return true;
      return `${p.title} ${p.keywords}`.toLowerCase().includes(q);
    });

    pushSection("Actions", q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions);
    pushSection(
      "Pages",
      pages.map((p) => ({
        id: `page-${p.path}`,
        label: p.title,
        hint: p.path,
        icon: <FiArrowRight size={15} />,
        action: () => navigate(p.path),
      })),
    );

    if (q) {
      pushSection(
        "Tasks",
        tasks
          .filter((t) => `${t.title} ${t.tags?.join(" ") || ""}`.toLowerCase().includes(q))
          .slice(0, 6)
          .map((t) => ({
            id: `task-${t.id}`,
            label: t.title,
            hint: "Task",
            icon: <FiMessageSquare size={15} />,
            action: () => navigate("/app/tasks"),
          })),
      );

      pushSection(
        "People",
        users
          .filter((u) => `${u.name} ${u.email} ${u.title}`.toLowerCase().includes(q))
          .slice(0, 5)
          .map((u) => ({
            id: `user-${u.id}`,
            label: u.name,
            hint: u.title,
            avatar: u.name,
            action: () => navigate(u.id === currentUser?.id ? "/app/profile" : `/app/chat?dm=${u.id}`),
          })),
      );

      pushSection(
        "Files",
        files
          .filter((f) => f.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map((f) => ({
            id: `file-${f.id}`,
            label: f.name,
            hint: "File",
            icon: <FiFile size={15} />,
            action: () => navigate("/app/files"),
          })),
      );

      pushSection(
        "Teams",
        teams
          .filter((t) => `${t.name} ${t.description}`.toLowerCase().includes(q))
          .slice(0, 5)
          .map((t) => ({
            id: `team-${t.id}`,
            label: t.name,
            hint: "Team",
            icon: <FiUsers size={15} />,
            action: () => navigate(`/app/teams/${t.id}`),
          })),
      );
    }

    return out;
  }, [query, tasks, users, files, teams, navigate, currentUser]);

  const flatItems = useMemo(
    () => items.flatMap((s) => s.items.map((item) => ({ section: s.section, ...item }))),
    [items],
  );

  const run = (item) => {
    item.action();
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[active];
      if (item) run(item);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-label="Command palette"
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-3 border-b border-border-subtle px-4">
          <FiSearch size={17} className="text-ink-mute" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search or jump to…"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute"
            aria-label="Command palette input"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-mute">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="scrollbar-slim max-h-[50vh] overflow-y-auto p-2">
          {flatItems.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-mute">
              No results for “{query}”.
            </p>
          ) : (
            items.map((section) => (
              <div key={section.section} className="mb-1">
                <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-ink-mute uppercase">
                  {section.section}
                </p>
                {section.items.map((item) => {
                  const index = flatItems.findIndex((f) => f.id === item.id);
                  const selected = index === active;
                  return (
                    <button
                      key={item.id}
                      data-index={index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => run(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                        selected ? "bg-brand-500/15 text-ink" : "text-ink-soft hover:bg-surface-2",
                      )}
                    >
                      {item.avatar ? (
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white",
                            avatarGradient(item.avatar),
                          )}
                        >
                          {getInitials(item.avatar)}
                        </span>
                      ) : (
                        <span className={cn("shrink-0", selected ? "text-brand-300" : "text-ink-mute")}>
                          {item.icon}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
                      {item.hint && (
                        <span className="shrink-0 text-[11px] text-ink-mute">{item.hint}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
